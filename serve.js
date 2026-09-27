const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
  // index.html 的資產網址帶版本查詢字串（app.js?v=20260927 等）作為快取破壞，
  // 這裡先去掉 ?query／#hash 再對應檔案，否則每個 ?v= 資產都會 404（頁面全空）。
  const urlPath = req.url.split('?')[0].split('#')[0];
  let filePath = '.' + urlPath;
  if (filePath === './') filePath = './index.html';
  const ext = path.extname(filePath);
  const mimeType = mimeTypes[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found: ' + req.url);
    } else {
      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(3000, () => console.log('Server running at http://localhost:3000'));
