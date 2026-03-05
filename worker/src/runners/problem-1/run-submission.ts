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
            console.log(`Extracting ${submissionPath} to ${tempExtractDir}...`);
            await fs.createReadStream(submissionPath)
                .pipe(unzipper.Extract({ path: tempExtractDir }))
                .promise();
            extractRoot = tempExtractDir;
        } else {
            extractRoot = submissionPath;
        }

        // Find BUILD_DIR
        let buildDir = '';
        const searchDirs = [
            extractRoot,
            path.join(extractRoot, 'next-version')
        ];

        // Also check one level deep
        const subdirs = await fs.readdir(extractRoot);
        for (const subdir of subdirs) {
            const fullPath = path.join(extractRoot, subdir);
            if ((await fs.stat(fullPath)).isDirectory()) {
                searchDirs.push(fullPath);
            }
        }

        for (const dir of searchDirs) {
            if (await fs.pathExists(path.join(dir, 'Dockerfile')) && await fs.pathExists(path.join(dir, 'package.json'))) {
                buildDir = dir;
                break;
            }
        }

        if (!buildDir) {
            console.error(`Error: no directory with Dockerfile and package.json found standard under ${extractRoot}`);
            process.exit(2);
        }

        console.log(`Found build directory: ${buildDir}`);

        const tag = `submission-${Date.now()}`;
        containerName = tag;

        console.log(`Building Docker image: ${tag}...`);
        try {
            cp.execSync(`docker build -t ${tag} .`, { cwd: buildDir, stdio: 'inherit' });
        } catch (e: any) {
            console.error('Docker build failed. Diagnostics: Listing files in build directory...');
            try {
                cp.execSync(`find . -maxdepth 3 -not -path '*/.*'`, { cwd: buildDir, stdio: 'inherit' });
            } catch (findErr) { }
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
                    cp.execSync(`docker run -d -p ${p}:8080 --name ${containerName} ${tag}`, { stdio: 'pipe' });
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
