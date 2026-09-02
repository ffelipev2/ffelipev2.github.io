import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.resolve(scriptDirectory, '..');
const host = '127.0.0.1';
const port = 4173;

const mimeTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.ico', 'image/x-icon'],
    ['.jpg', 'image/jpeg'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.pdf', 'application/pdf'],
    ['.png', 'image/png'],
    ['.svg', 'image/svg+xml'],
    ['.webp', 'image/webp'],
    ['.xml', 'application/xml; charset=utf-8']
]);

function resolveRequestPath(requestUrl) {
    const url = new URL(requestUrl, `http://${host}:${port}`);
    const normalizedPath = path.posix.normalize(decodeURIComponent(url.pathname)).replace(/^\/+/, '');
    const relativePath = normalizedPath || 'index.html';
    const candidate = path.resolve(rootDirectory, relativePath);
    const relativeToRoot = path.relative(rootDirectory, candidate);

    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) return null;
    if (relativeToRoot.split(path.sep).includes('.git') || relativeToRoot.split(path.sep).includes('.openai')) return null;
    return candidate;
}

async function findFile(requestUrl) {
    let candidate = resolveRequestPath(requestUrl);
    if (!candidate) return null;

    const details = await stat(candidate);
    if (details.isDirectory()) candidate = path.join(candidate, 'index.html');

    const fileDetails = await stat(candidate);
    return fileDetails.isFile() ? candidate : null;
}

const server = createServer(async (request, response) => {
    if (!request.url || !['GET', 'HEAD'].includes(request.method || '')) {
        response.writeHead(405, { Allow: 'GET, HEAD' });
        response.end();
        return;
    }

    try {
        const filePath = await findFile(request.url);
        if (!filePath) {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            response.end('No encontrado');
            return;
        }

        const extension = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes.get(extension) || 'application/octet-stream';
        response.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'X-Content-Type-Options': 'nosniff'
        });

        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        response.end(await readFile(filePath));
    } catch {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('No encontrado');
    }
});

server.listen(port, host, () => {
    console.log(`Servidor local disponible en http://${host}:${port}/`);
});
