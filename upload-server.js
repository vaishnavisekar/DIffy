const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { parse } = require('querystring');

// Simple server that supports both static files and POST requests for uploads
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Handle POST request for file uploads
    if (req.method === 'POST' && pathname === '/my-api/') {
        console.log('POST request received at /my-api/');

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                // In a real implementation, you would process the uploaded files here
                // For now, we'll just send a success response
                console.log('Received upload request');

                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                });

                res.end(JSON.stringify({
                    success: true,
                    message: 'Files uploaded successfully',
                    timestamp: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Error processing upload:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
        return;
    }

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS' && pathname === '/my-api/') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    // Static file serving for all other requests
    let localPath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // Security check to prevent directory traversal
    localPath = path.resolve(localPath);
    const basePath = path.resolve(__dirname);
    if (!localPath.startsWith(basePath)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.stat(localPath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(localPath).toLowerCase();
        const MIME_TYPES = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.dcm': 'application/dicom',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.md': 'text/markdown',
            '.xml': 'application/xml',
            '.csv': 'text/csv',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.xls': 'application/vnd.ms-excel'
        };

        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });

        const readStream = fs.createReadStream(localPath);
        readStream.pipe(res);
    });
});

const PORT = 8090;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Supports POST requests at /my-api/ for file uploads`);
});