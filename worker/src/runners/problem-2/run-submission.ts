import * as cp from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as unzipper from 'unzipper';

async function run() {
    const submissionPathArg = process.argv[2];
    if (!submissionPathArg) {
        console.error('Usage: ts-node run-submission.ts <path-to-submission>');
        process.exit(2);
    }

    const scriptDir = __dirname;
    const runnerDir = path.join(scriptDir, 'runner');
    let containerName = '';
    let tempExtractDir = '';
    let submissionPath = path.resolve(submissionPathArg);

    const cleanup = async () => {
        if (containerName) {
            console.log(`Cleaning up container ${containerName}...`);
            try {
                cp.execSync(`docker stop ${containerName}`, { stdio: 'ignore' });
                cp.execSync(`docker rm ${containerName}`, { stdio: 'ignore' });
            } catch (e) { }
        }
        if (tempExtractDir) {
            console.log(`Cleaning up temp dir ${tempExtractDir}...`);
            await fs.remove(tempExtractDir);
        }
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    try {
        if (!(await fs.pathExists(submissionPath))) {
            console.error(`Error: path does not exist: ${submissionPath}`);
            process.exit(2);
        }

        let extractRoot = '';
        if ((await fs.stat(submissionPath)).isFile()) {
            if (!submissionPath.endsWith('.zip')) {
                console.error(`Error: file is not a .zip: ${submissionPath}`);
                process.exit(2);
            }
            tempExtractDir = await fs.mkdtemp(path.join(os.tmpdir(), 'eval-'));
            console.log(`Extracting ${submissionPath} to ${tempExtractDir} using system unzip...`);
            try {
                // Using system unzip as it's more reliable with Mac-generated zips
                cp.execSync(`unzip -o "${submissionPath}" -d "${tempExtractDir}"`, { stdio: 'inherit' });
            } catch (unzipErr: any) {
                console.error('Extraction failed with system unzip, falling back to diagnostics...');
                throw unzipErr;
            }
            extractRoot = tempExtractDir;
        } else {
            extractRoot = submissionPath;
        }

        // 1. Unwrap logic: if extractRoot contains only one directory, move into it
        let currentRoot = extractRoot;
        while (true) {
            const files = await fs.readdir(currentRoot);
            const filteredFiles = files.filter(f => f !== '__MACOSX' && !f.startsWith('.'));
            if (filteredFiles.length === 1) {
                const fullPath = path.join(currentRoot, filteredFiles[0]);
                if ((await fs.stat(fullPath)).isDirectory()) {
                    currentRoot = fullPath;
                    console.log(`Unwrapping ZIP: moving into ${currentRoot}`);
                    continue;
                }
            }
            break;
        }
        extractRoot = currentRoot;

        // 2. Find the best directory to run build from
        let buildDir = '';
        let dockerfilePath = '';

        const findBuildInfo = async (dir: string): Promise<string | null> => {
            const files = await fs.readdir(dir);
            if (files.includes('Dockerfile') && files.includes('package.json')) {
                return dir;
            }
            // Check subdirectories
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = await fs.stat(fullPath);
                if (stat.isDirectory() && file !== 'node_modules' && !file.startsWith('.')) {
                    const found: string | null = await findBuildInfo(fullPath);
                    if (found) return found;
                }
            }
            return null;
        };

        const foundDir = await findBuildInfo(extractRoot);

        if (foundDir) {
            // If tsconfig.json exists at a higher level than the one with Dockerfile/package.json,
            // we should probably use that higher level as the context.
            if (await fs.pathExists(path.join(extractRoot, 'tsconfig.json')) && extractRoot !== foundDir) {
                console.log(`Found tsconfig.json at root ${extractRoot}, but Dockerfile/package.json at ${foundDir}. Using root as context.`);
                buildDir = extractRoot;
                dockerfilePath = path.relative(extractRoot, path.join(foundDir, 'Dockerfile'));
            } else {
                buildDir = foundDir;
                dockerfilePath = 'Dockerfile';
            }
        }

        if (!buildDir) {
            console.error(`Error: no directory with Dockerfile and package.json found standard under ${extractRoot}`);
            process.exit(2);
        }

        console.log(`Found build context: ${buildDir} (Dockerfile: ${dockerfilePath})`);

        const tag = `submission-${Date.now()}`;
        containerName = tag;

        console.log(`Building Docker image: ${tag}...`);
        try {
            const buildFlags = dockerfilePath !== 'Dockerfile' ? `-f "${dockerfilePath}"` : '';
            cp.execSync(`docker build -t ${tag} ${buildFlags} .`, { cwd: buildDir, stdio: 'inherit' });
        } catch (e: any) {
            console.error('Docker build failed. Diagnostics: Detailed file search...');
            try {
                console.log('--- Searching for tsconfig.json everywhere in extraction root ---');
                cp.execSync(`find "${extractRoot}" -name "tsconfig.json"`, { stdio: 'inherit' });

                console.log('--- Listing all files (including hidden) in build context ---');
                cp.execSync(`ls -la`, { cwd: buildDir, stdio: 'inherit' });

                console.log('--- Files in src directory ---');
                if (await fs.pathExists(path.join(buildDir, 'src'))) {
                    cp.execSync(`find src -maxdepth 2`, { cwd: buildDir, stdio: 'inherit' });
                }
            } catch (diagErr) { }
            throw e;
        }

        const isDocker = await fs.pathExists('/.dockerenv');
        let dockerNetArgs = '';
        let baseUrl = 'http://localhost';

        if (isDocker) {
            const hostname = os.hostname();
            try {
                const networkName = cp.execSync(`docker inspect ${hostname} -f '{{range $k, $v := .NetworkSettings.Networks}}{{$k}}{{end}}'`).toString().trim().split('\n')[0];
                if (networkName) {
                    console.log(`Detected Docker environment, using network: ${networkName}`);
                    dockerNetArgs = `--network ${networkName}`;
                    baseUrl = `http://${containerName}:8080`;
                }
            } catch (e) {
                console.warn('Failed to detect Docker network, falling back to localhost mapping');
            }
        }

        if (!dockerNetArgs) {
            // Local fallback logic
            let hostPort = '';
            for (let p = 5000; p <= 5019; p++) {
                try {
                    cp.execSync(`docker run -d -p ${p}:80 --name ${containerName} ${tag}`, { stdio: 'pipe' });
                    hostPort = p.toString();
                    break;
                } catch (e: any) {
                    cp.execSync(`docker rm -f ${containerName}`, { stdio: 'ignore' });
                    continue;
                }
            }
            if (!hostPort) {
                throw new Error('No available port in 5000-5019');
            }
            baseUrl = `http://localhost:${hostPort}`;
        } else {
            console.log(`Starting container ${containerName} on internal network...`);
            cp.execSync(`docker run -d --name ${containerName} ${dockerNetArgs} ${tag}`, { stdio: 'inherit' });
        }

        console.log(`Waiting for server at ${baseUrl} (timeout 90s)...`);
        const startTime = Date.now();
        const timeout = 90000;
        let ready = false;
        while (Date.now() - startTime < timeout) {
            try {
                const response = await fetch(baseUrl);
                if (response.status === 200) {
                    ready = true;
                    break;
                }
            } catch (e) { }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!ready) {
            throw new Error(`Server at ${baseUrl} did not return 200 within 90s`);
        }

        console.log('Running SSR HTML check from runner...');
        cp.execSync(`npm install --no-audit --no-fund`, { cwd: runnerDir, stdio: 'inherit' });

        try {
            cp.execSync(`npm run check-ssr-html`, {
                cwd: runnerDir,
                env: {
                    ...process.env,
                    STATIC_DIR: path.join(runnerDir, 'static'),
                    BASE_URL: baseUrl
                },
                stdio: 'inherit'
            });
            process.exit(0);
        } catch (e) {
            console.error('SSR check failed');
            process.exit(1);
        }

    } catch (error: any) {
        console.error('Error during evaluation:', error.message);
        process.exit(1);
    } finally {
        await cleanup();
    }
}

run();
