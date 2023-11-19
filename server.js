const http = require('http');
let usersData = []; // To store regular user data in memory
let adminData = { username: 'admin', password: '111' }; // Admin credentials

const server = http.createServer((req, res) => {
  console.log('Request origin:', req.headers.origin);
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { username, password, role } = JSON.parse(body);
        if (role === 'admin') {
          res.writeHead(403);
          res.end(JSON.stringify({ message: 'Cannot register as admin' }));
        } else {
          usersData.push({ username, password, role });
          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ message: 'Registration successful' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid request' }));
      }
    });
  }

  if (req.url === '/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { username, password } = JSON.parse(body);
        if (username === adminData.username && password === adminData.password) {
          res.writeHead(200, {
            'Content-Type': 'application/json',
          });
          res.end(JSON.stringify({ message: 'Admin login successful', role: 'admin' }));
        } else {
          const user = usersData.find(user => user.username === username && user.password === password);
          if (user) {
            res.writeHead(200, {
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ message: 'Login successful', role: 'user' }));
          } else {
            res.writeHead(401);
            res.end(JSON.stringify({ message: 'Invalid credentials' }));
          }
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: 'Invalid request' }));
      }
    });
  }

  if (req.url === '/something' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ message: 'Here is something' }));
  }

});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});