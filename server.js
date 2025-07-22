const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript', 
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
};

// Helper function to make HTTPS requests
function makeHttpsRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Add CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Handle Claude API proxy
    if (pathname === '/api/claude' && req.method === 'POST') {
        try {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    const apiKey = req.headers['x-api-key'];
                    
                    if (!apiKey) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'API key is required' }));
                        return;
                    }

                    const options = {
                        hostname: 'api.anthropic.com',
                        port: 443,
                        path: '/v1/messages',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apiKey,
                            'anthropic-version': '2023-06-01'
                        }
                    };

                    const claudeResponse = await makeHttpsRequest(options, body);
                    
                    res.writeHead(claudeResponse.statusCode, { 'Content-Type': 'application/json' });
                    res.end(claudeResponse.data);
                    
                } catch (error) {
                    console.error('API Proxy error:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
                }
            });
        } catch (error) {
            console.error('Request handling error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
        return;
    }

    // Serve static files
    if (pathname === '/') {
        pathname = '/index.html';
    }

    const filePath = path.join(__dirname, pathname);
    
    try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = mimeTypes[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 ReleaseWit server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${__dirname}`);
    console.log(`🔧 Claude API proxy available at /api/claude`);
});