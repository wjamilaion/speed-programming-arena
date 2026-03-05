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
            const runnerScript = path.join(CUSTOM_RUNNERS_BASE_DIR, runnerId, 'run-submission.sh');
            console.log(`[DEBUG] Checking for runner script at: ${runnerScript}`);

            if (await fs.pathExists(runnerScript)) {
                console.log(`✅ [DEBUG] Found custom runner: ${runnerScript}`);
                // Ensure script is executable
                await fs.chmod(runnerScript, '755');

                const cmd = `${runnerScript} "${params.zipPath}"`;
                const { stdout, stderr, code } = await runWithTimeout(cmd, TIMEOUT_MS);

                // For custom runners, exit code 0 is Success
                const isAccepted = code === 0;

                const score = calculateScore(isAccepted ? 1 : 0, 1, params.timeTakenSeconds, params.attemptNumber);
                return {
                    status: isAccepted ? 'accepted' : 'rejected',
                    score,
                    passedCount: isAccepted ? 1 : 0,
                    totalCount: 1
                };
            } else {
                console.warn(`❌ [DEBUG] Runner script NOT found at: ${runnerScript}`);
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
        return parseJestOutput(stdout + stderr, params.timeTakenSeconds, params.attemptNumber);

    } finally {
        await fs.remove(tempDir).catch(err => console.error('Cleanup error', err));
    }
}

async function runWithTimeout(cmd: string, timeout: number): Promise<{ stdout: string; stderr: string; code: number | null }> {
    return new Promise((resolve, reject) => {
        const child = cp.exec(cmd, (error, stdout, stderr) => {
            resolve({
                stdout,
                stderr,
                code: error ? (error as any).code : 0
            });
        });
        const timer = setTimeout(() => {
            child.kill();
            reject(new Error('Evaluation timed out'));
        }, timeout);
        child.on('exit', () => clearTimeout(timer));
    });
}

function parseJestOutput(output: string, timeTakenSeconds: number, attemptNumber: number): EvaluationResult {
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
    const score = calculateScore(passedCount, totalCount, timeTakenSeconds, attemptNumber);
    return { status, score, passedCount, totalCount };
}

function calculateScore(passed: number, total: number, timeTaken: number, attempts: number): number {
    const baseScore = total > 0 ? (passed / total) * 1000 : 0;
    const timeBonus = Math.max(0, 600 - timeTaken);
    const penalty = (attempts - 1) * 20;
    return Math.max(0, Math.round(baseScore + timeBonus - penalty));
}
