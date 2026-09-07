import { build } from 'esbuild';
import { readFile, copyFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

await build({
    entryPoints: ['js/hero/scene.js'],
    outfile: 'js/hero/scene.bundle.js',
    bundle: true, minify: true, format: 'esm', target: ['es2020'],
    legalComments: 'eof',
    banner: { js: '/*! Three.js: MIT license in ./THREE-LICENSE.txt */' },
});
await copyFile('node_modules/three/LICENSE', 'js/hero/THREE-LICENSE.txt');
const bundle = await readFile('js/hero/scene.bundle.js');
console.log(`Hero 3D: ${(bundle.length / 1024).toFixed(1)} KiB, ${(gzipSync(bundle).length / 1024).toFixed(1)} KiB gzip (lazy).`);
