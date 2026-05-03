const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    service: 'TechRetail API',
    timestamp: new Date().toISOString()
  }));
});

server.listen(PORT, () => {
  console.log('TechRetail backend corriendo en puerto ' + PORT);
});
