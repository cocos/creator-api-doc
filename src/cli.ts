import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as ps from 'path';
import * as typedoc from 'typedoc';

async function generateDoc({
    engineRootPath,
    entryFileName,
    outputFilePath,
}: {
    engineRootPath: string,
    entryFileName: string,
    outputFilePath: string,
}): Promise<boolean> {
    if (fs.existsSync(outputFilePath)) {
        const stats = fs.statSync(outputFilePath);
        if (stats.isFile()) {
            fs.unlinkSync(outputFilePath);
        }
    }

    const app = new typedoc.Application();
    const options = app.options;

    options.addReader(new typedoc.TSConfigReader());
    options.addReader(new typedoc.TypeDocReader());
    options.setValue('excludePrivate', true);
    options.setValue('excludeInternal', true);

    process.env.ENGINE_ROOT = engineRootPath;

    app.bootstrap({
        entryPoints: [ps.join(engineRootPath, entryFileName)],
        tsconfig: ps.join(engineRootPath, 'tsconfig.json'),
        plugin: ['./lib/index.js'],
    });

    const projectReflection = app.convert();
    if (!projectReflection) {
        process.exit(-6);
    }

    // await app.generateDocs(projectReflection, outputFilePath);
    await app.generateJson(projectReflection, outputFilePath);

    return true;
}

async function main() {

    const program = new Command();

    program.version('1.0.0')
        .requiredOption('-p, --path [value]', 'The root path of Cocos Creator engine')
        .requiredOption('-o, --output [value]', 'The output json file path');

    program.parse(process.argv);

    const options = program.opts();

    if (!options.path) {
        console.error(`[ERROR]: -p argument is not set!`);
        process.exit(-1);
    }

    const engineRootPath = options.path;

    if (!fs.existsSync(engineRootPath)) {
        console.error(`[ERROR]: Engine root path (${engineRootPath}) doesn't exist`);
        process.exit(-2);
    }

    const stats = fs.statSync(engineRootPath);
    if (!stats.isDirectory()) {
        console.error(`[ERROR]: Engine root path (${engineRootPath}) is not a directory`);
        process.exit(-3);
    }

    console.log(`Engine root path: ${engineRootPath}`);

    const packageJsonPath = ps.join(engineRootPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        console.error(`[ERROR]: package.json is not found!`);
        process.exit(-4);
    }

    const packageContent = fs.readFileSync(packageJsonPath, { encoding: 'utf-8' });
    let packageJson;
    try {
        packageJson = JSON.parse(packageContent);
    } catch (e) {
        console.error(`[ERROR]: parse package.json failed!`);
        process.exit(-5);
    }
    
    const engineName = packageJson.name;
    const engineVersion = packageJson.version;

    console.log(`==> ${engineName}: ${engineVersion}`);

    await generateDoc({
        engineRootPath,
        entryFileName: 'typedoc-index.ts',
        outputFilePath: options.output
    });

    console.info(`==> DONE`);
}

main();
