const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;

// Cari IP lokal perangkat (Wi-Fi / LAN)
function getLocalIpAddresses() {
    const interfaces = os.networkInterfaces();
    const results = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                results.push({ name, ip: iface.address });
            }
        }
    }
    return results;
}

const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    const filePath = path.join(__dirname, reqUrl);
    const extname = path.extname(filePath).toLowerCase();

    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.doc': 'application/msword',
        '.pdf': 'application/pdf'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Fallback to index.html for SPA routing if needed
                fs.readFile(path.join(__dirname, 'index.html'), (err2, fallbackContent) => {
                    if (err2) {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 File Tidak Ditemukan');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(fallbackContent);
                    }
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('500 Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const localIps = getLocalIpAddresses();
    const primaryIp = localIps.length > 0 ? localIps[0].ip : 'localhost';

    console.log('=================================================================');
    console.log('  SISTEM OTOMASI SURAT KSOP BANDA NAIRA SIAP DIAKSES DARI HP!');
    console.log('=================================================================');
    console.log('');
    console.log('  📱 CARA MEMBUKA DARI HP / SMARTPHONE:');
    console.log('  1. Pastikan HP terhubung ke jaringan Wi-Fi yang sama.');
    console.log('  2. Buka browser di HP Anda (Chrome, Safari, Edge, dll).');
    console.log(`  3. Ketik alamat URL berikut di browser HP:`);
    console.log('');
    console.log(`     👉👉  http://${primaryIp}:${PORT}  👈👈`);
    console.log('');
    if (localIps.length > 1) {
        console.log('  Opsi Alamat IP Lain:');
        localIps.slice(1).forEach(item => {
            console.log(`     - http://${item.ip}:${PORT} (${item.name})`);
        });
        console.log('');
    }
    console.log('  💻 Akses di Komputer ini:');
    console.log(`     👉  http://localhost:${PORT}`);
    console.log('');
    console.log('  (Tekan Ctrl + C di jendela ini untuk menghentikan server)');
    console.log('=================================================================');
});
