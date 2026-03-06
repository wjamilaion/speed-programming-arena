import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as unzipper from 'unzipper';
import { v4 as uuidv4 } from 'uuid';
import db from './db';

interface EvaluateParams {
    submissionId: string;
    challengeId: string;
    zipPath: string;
    timeTakenSeconds: number;
    attemptNumber: number;
    eventStartTime?: string;
}

interface EvaluationResult {
    status: 'accepted' | 'rejected';
    score: number;
    passedCount?: number;
    totalCount?: number;
}

const TIMEOUT_MS = 300000; // 5 minutes for docker builds
const HIDDEN_TESTS_BASE_DIR = path.join(process.cwd(), 'hidden-tests');
const CUSTOM_RUNNERS_BASE_DIR = path.join(process.cwd(), 'src', 'runners');

export async function evaluateSubmission(params: EvaluateParams): Promise<EvaluationResult> {
    const isDocker = await fs.pathExists('/.dockerenv');
    const baseTempDir = isDocker ? '/app/uploads/temp' : '/tmp';
    const tempDirName = `eval-${params.submissionId}-${uuidv4()}`;
    const tempDir = path.join(baseTempDir, tempDirName);

    await fs.ensureDir(tempDir);

    try {
        // 0. Fetch runner_id from DB
        const res = await db.query('SELECT runner_id FROM challenges WHERE id = $1', [params.challengeId]);
        const runnerId = res.rows[0]?.runner_id;

        console.log(`[DEBUG] Runner ID: ${runnerId}`);
        console.log(`[DEBUG] CWD: ${process.cwd()}`);
        console.log(`[DEBUG] __dirname: ${__dirname}`);

        if (runnerId) {
            const runnerTs = path.join(CUSTOM_RUNNERS_BASE_DIR, runnerId, 'run-submission.ts');
            const runnerSh = path.join(CUSTOM_RUNNERS_BASE_DIR, runnerId, 'run-submission.sh');

            let cmd = '';
            if (await fs.pathExists(runnerTs)) {
                console.log(`✅ [DEBUG] Found custom TS runner: ${runnerTs}`);
                cmd = `tsx "${runnerTs}" "${params.zipPath}"`;
            } else if (await fs.pathExists(runnerSh)) {
                console.log(`✅ [DEBUG] Found custom SH runner: ${runnerSh}`);
                await fs.chmod(runnerSh, '755');
                cmd = `${runnerSh} "${params.zipPath}"`;
            }

            if (cmd) {
                const { code } = await runWithTimeout(cmd, TIMEOUT_MS);
                const isAccepted = code === 0;

                const score = calculateScore(isAccepted ? 1 : 0, 1, params.timeTakenSeconds, params.attemptNumber, params.eventStartTime);
                return {
                    status: isAccepted ? 'accepted' : 'rejected',
                    score,
                    passedCount: isAccepted ? 1 : 0,
                    totalCount: 1
                };
            } else {
                console.warn(`❌ [DEBUG] No runner found for ID: ${runnerId}`);
            }
        }

        // 1. Extract ZIP to tempDir
        await fs.createReadStream(params.zipPath)
            .pipe(unzipper.Extract({ path: tempDir }))
            .promise();

        // 2. Inject hidden tests for the challenge
        const challengeTestDir = path.join(HIDDEN_TESTS_BASE_DIR, params.challengeId);
        if (await fs.pathExists(challengeTestDir)) {
            await fs.copy(challengeTestDir, tempDir);
        }

        // 3. Setup default Jest environment
        const pkgJson = {
            name: "submission-eval",
            version: "1.0.0",
            scripts: { "test": "jest --json" },
            dependencies: { "react": "^18.2.0", "react-dom": "^18.2.0" },
            devDependencies: {
                "jest": "^29.7.0",
                "@testing-library/react": "^14.1.2",
                "jest-environment-jsdom": "^29.7.0"
            }
        };
        await fs.writeJson(path.join(tempDir, 'package.json'), pkgJson);
        await fs.writeFile(path.join(tempDir, 'jest.config.js'), `module.exports = { testEnvironment: 'jsdom' };`);

        // 4. Run Docker with default Jest runner
        const volumeArg = isDocker ? '-v uploads:/app/uploads' : `-v ${tempDir}:/app`;
        const workDir = isDocker ? `/app/uploads/temp/${tempDirName}` : '/app';

        const dockerCmd = `docker run --rm --network none --memory 512m --cpus 1 ${volumeArg} -w ${workDir} node:20-slim sh -c "npm install --silent && npm test"`;
        const { stdout, stderr } = await runWithTimeout(dockerCmd, TIMEOUT_MS);

        // 5. Parse output
        return parseJestOutput(stdout + stderr, params.timeTakenSeconds, params.attemptNumber, params.eventStartTime);

    } finally {
        await fs.remove(tempDir).catch(err => console.error('Cleanup error', err));
    }
}
async function runWithTimeout(cmd: string, timeout: number): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
        const child = cp.spawn(cmd, { shell: true });
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            const str = data.toString();
            stdout += str;
            process.stdout.write(str);
        });

        child.stderr.on('data', (data) => {
            const str = data.toString();
            stderr += str;
            process.stderr.write(str);
        });

        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('Evaluation timed out'));
        }, timeout);

        child.on('exit', (code) => {
            clearTimeout(timer);
            resolve({ stdout, stderr, code });
        });
    });
}

function parseJestOutput(output: string, timeTakenSeconds: number, attemptNumber: number, eventStartTime?: string): EvaluationResult {
    let passedCount = 0;
    let totalCount = 0;
    try {
        const jsonMatch = output.match(/\{[\s\S]*"numTotalTests":\s*\d+[\s\S]*\}/);
        if (jsonMatch) {
            const results = JSON.parse(jsonMatch[0]);
            passedCount = results.numPassedTests || 0;
            totalCount = results.numTotalTests || 0;
        }
    } catch (e) {
        console.error('Failed to parse Jest output', e);
    }

    const status = (passedCount === totalCount && totalCount > 0) ? 'accepted' : 'rejected';
    const score = calculateScore(passedCount, totalCount, timeTakenSeconds, attemptNumber, eventStartTime);
    return { status, score, passedCount, totalCount };
}

function calculateScore(passed: number, total: number, timeTaken: number, attempts: number, eventStartTime?: string): number {
    const baseScore = total > 0 ? (passed / total) * 1000 : 0;

    // If eventStartTime is provided, time bonus decays based on absolute time since event start
    // Otherwise, it decays based on timeTaken (legacy/fallback)
    let timeReference = timeTaken;
    if (eventStartTime) {
        const start = new Date(eventStartTime).getTime();
        const now = Date.now();
        timeReference = Math.max(0, Math.floor((now - start) / 1000));
    }

    const timeBonus = Math.max(0, 3600 - timeReference); // 1 hour pool for absolute timing
    const penalty = (attempts - 1) * 20;
    return Math.max(0, Math.round(baseScore + timeBonus - penalty));
}
