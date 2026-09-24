import { build } from 'esbuild';
import { readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');

await build({
    absWorkingDir: rootDirectory,
    entryPoints: [path.join(rootDirectory, 'js/hero/scene.js')],
    outfile: path.join(rootDirectory, 'js/hero/scene.bundle.js'),
    bundle: true, minify: true, format: 'esm', target: ['es2020'],
    legalComments: 'eof',
    banner: { js: '/*! Three.js: MIT license in ./THREE-LICENSE.txt */' },
});
await copyFile(
    path.join(rootDirectory, 'node_modules/three/LICENSE'),
    path.join(rootDirectory, 'js/hero/THREE-LICENSE.txt')
);
const bundle = await readFile(path.join(rootDirectory, 'js/hero/scene.bundle.js'));
console.log(`Hero 3D: ${(bundle.length / 1024).toFixed(1)} KiB, ${(gzipSync(bundle).length / 1024).toFixed(1)} KiB gzip (lazy).`);
