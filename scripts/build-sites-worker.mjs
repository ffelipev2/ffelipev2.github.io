import assert from "node:assert/strict";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const dist = path.join(root, "dist");
const serverDir = path.join(dist, "server");

const pages = [
  ["/", "index.html"],
  ["/proyectos/", "proyectos/index.html"],
  ["/proyectos/arduino-bluetooth-rele/", "proyectos/arduino-bluetooth-rele/index.html"],
  ["/proyectos/chat-lora/", "proyectos/chat-lora/index.html"],
  ["/proyectos/ethernet-sensor-biometrico/", "proyectos/ethernet-sensor-biometrico/index.html"],
  ["/proyectos/gemelo-digital/", "proyectos/gemelo-digital/index.html"],
  ["/proyectos/huskylens-esp32/", "proyectos/huskylens-esp32/index.html"],
  ["/proyectos/robot-otto-arduino-3d/", "proyectos/robot-otto-arduino-3d/index.html"],
  ["/proyectos/sensor-higrow-esp32-app/", "proyectos/sensor-higrow-esp32-app/index.html"],
  ["/proyectos/ufactory-lite-6/", "proyectos/ufactory-lite-6/index.html"],
  ["/proyectos/vehiculo-arduino-camara-wifi/", "proyectos/vehiculo-arduino-camara-wifi/index.html"],
];
const pageFiles = new Set(pages.map(([, file]) => file));

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".pdf", "application/pdf"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

const referencedFiles = new Set(["robots.txt", "sitemap.xml"]);
const localReferencePattern = /(?:href|src)=["']([^"']+)["']/g;

for (const [, file] of pages) {
  const html = await readFile(path.join(root, file), "utf8");
  for (const match of html.matchAll(localReferencePattern)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
    const cleanValue = decodeURIComponent(value.split("#")[0].split("?")[0]);
    if (!cleanValue || cleanValue.endsWith("/")) continue;
    const relative = cleanValue.startsWith("/")
      ? cleanValue.replace(/^\/+/, "")
      : path.posix.normalize(path.posix.join(path.posix.dirname(file), cleanValue));
    if (pageFiles.has(relative)) continue;
    try {
      const details = await stat(path.join(root, relative));
      if (details.isFile()) referencedFiles.add(relative);
    } catch {
      // Route URLs are checked by the main site validator.
    }
  }
}

const assets = {};
const aliases = {};
for (const [route, file] of pages) {
  assets[route] = {
    body: (await readFile(path.join(root, file))).toString("base64"),
    contentType: "text/html; charset=utf-8",
    cacheControl: "public, max-age=0, must-revalidate",
  };
  aliases[`/${file.replaceAll("\\", "/")}`] = route;
}

for (const file of [...referencedFiles].sort()) {
  const extension = path.extname(file).toLowerCase();
  const contentType = mimeTypes.get(extension);
  assert(contentType, `Missing MIME type for ${file}`);
  assets[`/${file.replaceAll("\\", "/")}`] = {
    body: (await readFile(path.join(root, file))).toString("base64"),
    contentType,
    cacheControl: extension === ".html"
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=3600",
  };
}

const notFoundHtml = '<!doctype html><html lang="es-CL"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página no encontrada | Felipe Flores</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;color:#0a1733}main{text-align:center;padding:2rem}a{color:#0346c7}</style><main><p>404</p><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main></html>';

const worker = `const assets = ${JSON.stringify(assets)};
const aliases = ${JSON.stringify(aliases)};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function responseFor(asset, method) {
  const headers = new Headers({
    "Cache-Control": asset.cacheControl,
    "Content-Type": asset.contentType,
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "SAMEORIGIN",
  });
  return new Response(method === "HEAD" ? null : decodeBase64(asset.body), { status: 200, headers });
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const url = new URL(request.url);
    let pathname;
    try {
      pathname = decodeURIComponent(url.pathname);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const direct = assets[pathname] || assets[aliases[pathname]];
    if (direct) return responseFor(direct, request.method);

    const lastSegment = pathname.slice(pathname.lastIndexOf("/") + 1);
    if (!lastSegment.includes(".") && !pathname.endsWith("/")) {
      const slashRoute = pathname + "/";
      if (assets[slashRoute]) {
        url.pathname = slashRoute;
        return Response.redirect(url.toString(), 308);
      }
    }

    const notFound = ${JSON.stringify(notFoundHtml)};
    return new Response(request.method === "HEAD" ? null : notFound, {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
};
`;

await rm(dist, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await writeFile(path.join(serverDir, "index.js"), worker, "utf8");

const hostingConfig = await readFile(path.join(root, ".openai", "hosting.json"));
await mkdir(path.join(dist, ".openai"), { recursive: true });
await writeFile(path.join(dist, ".openai", "hosting.json"), hostingConfig);

const workerUrl = pathToFileURL(path.join(serverDir, "index.js"));
workerUrl.searchParams.set("build", Date.now().toString());
const { default: builtWorker } = await import(workerUrl.href);

for (const [route] of pages) {
  const response = await builtWorker.fetch(new Request(`https://example.test${route}`));
  assert.equal(response.status, 200, `Worker route failed: ${route}`);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/);
}

for (const [, file] of pages) {
  const response = await builtWorker.fetch(new Request(`https://example.test/${file}`));
  assert.equal(response.status, 200, `Worker file route failed: /${file}`);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/);
}

for (const route of ["/css/portfolio.css", "/js/portfolio.js", "/docs/Felipe-CV.pdf"]) {
  const response = await builtWorker.fetch(new Request(`https://example.test${route}`));
  assert.equal(response.status, 200, `Worker asset failed: ${route}`);
}

const redirect = await builtWorker.fetch(new Request("https://example.test/proyectos"));
assert.equal(redirect.status, 308);
assert.equal(redirect.headers.get("location"), "https://example.test/proyectos/");

const missing = await builtWorker.fetch(new Request("https://example.test/no-existe"));
assert.equal(missing.status, 404);

const size = (await stat(path.join(serverDir, "index.js"))).size;
console.log(`Built Sites worker with ${pages.length} pages, ${referencedFiles.size} static files, and ${(size / 1024).toFixed(1)} KiB.`);
