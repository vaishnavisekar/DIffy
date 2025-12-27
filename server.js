const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');
const formidable = require('formidable'); // ✅ added for file uploads

// Parse CLI arguments
const args = process.argv.slice(2);
let sourceDir = null;
let targetDir = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source') {
        sourceDir = args[i + 1];
        i++;
    } else if (args[i] === '--target') {
        targetDir = args[i + 1];
        i++;
    }
}

// Set default directories if not provided
if (!sourceDir) {
    sourceDir = './sample_data/folder_a';
    console.log('Using default source directory: ./sample_data/folder_a');
}
if (!targetDir) {
    targetDir = './sample_data/folder_b';
    console.log('Using default target directory: ./sample_data/folder_b');
}

// Resolve absolute paths
sourceDir = path.resolve(sourceDir);
targetDir = path.resolve(targetDir);

console.log(`Starting server...`);
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.dcm': 'application/dicom',
    '.pdf': 'application/pdf',
};

// Compute SHA-256 hash for file
function computeFileHashSync(filePath, isText) {
    try {
        let data = fs.readFileSync(filePath);
        if (isText) {
            const text = data.toString('utf-8');
            const normalized = text.replace(/\r\n/g, '\n');
            data = Buffer.from(normalized);
        }
        return crypto.createHash('sha256').update(data).digest('hex');
    } catch (e) {
        console.error(`Hash computation failed for ${filePath}:`, e.message);
        return null;
    }
}

// Scan directory for files recursively
function scanDirectory(dirPath, baseDir = dirPath) {
    let files = [];
    try {
        const items = fs.readdirSync(dirPath);
        const ignoredFiles = ['.ds_store', 'thumbs.db', 'desktop.ini'];

        items.forEach(item => {
            if (ignoredFiles.includes(item.toLowerCase())) return;

            const fullPath = path.join(dirPath, item);
            const relativePath = path.relative(baseDir, fullPath);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                files = files.concat(scanDirectory(fullPath, baseDir));
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                let type = 'default';
                if (['.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.py'].includes(ext)) type = 'text';
                else if (['.xlsx', '.xls', '.csv'].includes(ext)) type = 'spreadsheet';
                else if (['.pdf'].includes(ext)) type = 'pdf';
                else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) type = 'image';
                else if (['.dcm', '.dicom'].includes(ext)) type = 'dicom';

                files.push({
                    name: item,
                    size: stat.size / (1024 * 1024),
                    date: stat.mtime.toISOString().split('T')[0],
                    type: type,
                    relativePath: relativePath
                });
            }
        });
    } catch (err) {
        console.error(`Error scanning directory ${dirPath}:`, err);
    }
    return files;
}

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // =================== File Upload API ===================
    if (pathname === '/my-api' && req.method.toUpperCase() === 'POST') {
        const form = new formidable.IncomingForm({ multiples: true });

        // Use header to decide target folder
        const side = req.headers['x-upload-side'] || 'left'; // 'left' = source, 'right' = target
        const uploadDir = side === 'left' ? sourceDir : targetDir;
        form.uploadDir = uploadDir;
        form.keepExtensions = true;

        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
                return;
            }

            let uploadedFiles = [];
            if (files.files) {
                if (Array.isArray(files.files)) {
                    uploadedFiles = files.files.map(f => path.basename(f.filepath));
                } else {
                    uploadedFiles = [path.basename(files.files.filepath)];
                }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ uploadedFiles }));
        });
        return;
    }

    // =================== Comparison API ===================
    if (pathname === '/api/comparison') {
        const sFiles = scanDirectory(sourceDir);
        const tFiles = scanDirectory(targetDir);

        const data = {
            source: { name: path.basename(sourceDir), path: sourceDir, files: sFiles, totalSize: sFiles.reduce((acc, f) => acc + f.size, 0) },
            target: { name: path.basename(targetDir), path: targetDir, files: tFiles, totalSize: tFiles.reduce((acc, f) => acc + f.size, 0) }
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return;
    }

    // =================== File streaming ===================
    if (pathname.startsWith('/files/source/') || pathname.startsWith('/files/target/')) {
        const isSource = pathname.startsWith('/files/source/');
        const requestedPath = decodeURIComponent(pathname.replace(isSource ? '/files/source/' : '/files/target/', ''));
        const baseDir = isSource ? sourceDir : targetDir;

        if (requestedPath.includes('..') || requestedPath.startsWith('/')) {
            res.writeHead(403);
            res.end('Forbidden: Invalid path');
            return;
        }

        const filePath = path.join(baseDir, requestedPath);
        const resolvedPath = path.resolve(filePath);

        if (!resolvedPath.startsWith(baseDir)) {
            res.writeHead(403);
            res.end('Forbidden: Path outside directory');
            return;
        }
        serveFile(res, resolvedPath);
        return;
    }

    // =================== Static file serving ===================
    let localPath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    serveFile(res, localPath);
});

// Serve a single file
function serveFile(res, filePath) {
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size
        });

        fs.createReadStream(filePath).pipe(res);
    });
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
