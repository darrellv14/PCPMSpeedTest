import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(fileURLToPath(new URL('./dist/', import.meta.url)));
const port = Number(process.env.PORT || 5173);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const server = http.createServer(async (req, res) => {
  try {
    const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
    if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404); res.end('File tidak ditemukan'); }
});
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `Port ${port} sedang dipakai. Tutup server sebelumnya atau atur PORT lain.` : error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Speed Test PCPM siap: http://localhost:${port}\nTekan Ctrl+C untuk menghentikan server.`));
