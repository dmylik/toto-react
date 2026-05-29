const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Data file path
const DATA_FILE = path.join(__dirname, '..', 'server', 'data.json');

// Use the initial db.json if no data.json exists yet
const INITIAL_DATA = path.join(__dirname, '..', 'src', 'data', 'db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve built frontend
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Helper: read data
function readData() {
  if (fs.existsSync(DATA_FILE)) {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  }
  // Copy initial data
  const initial = JSON.parse(fs.readFileSync(INITIAL_DATA, 'utf-8'));
  fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

// Helper: write data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET /api/data - full data
app.get('/api/data', (req, res) => {
  try {
    const data = readData();
    // Never send passwords to client for security
    const safeUsers = data.users.map(u => ({
      ...u,
      password: undefined,
    }));
    res.json({ ...data, users: safeUsers });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/data - save full data
app.post('/api/data', (req, res) => {
  try {
    const newData = req.body;
    // Merge with existing to preserve passwords
    const existing = readData();
    
    // Preserve passwords: for each user in new data, keep existing password
    if (newData.users) {
      newData.users = newData.users.map(newUser => {
        const existingUser = existing.users.find(u => u.id === newUser.id);
        if (existingUser) {
          return { ...newUser, password: existingUser.password };
        }
        return newUser;
      });
    }
    
    writeData(newData);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/register - register new user
app.post('/api/register', (req, res) => {
  try {
    const { fullname, username, password } = req.body;
    const data = readData();
    
    // Check if username exists
    const exists = data.users.find(u => u.username === username);
    if (exists) {
      return res.status(400).json({ error: 'Пользователь с таким логином уже существует' });
    }
    
    const newUser = {
      id: 'user_' + Date.now(),
      fullname: fullname || username,
      username,
      password,
      role: 'user',
      status: 'pending',
    };
    
    data.users.push(newUser);
    writeData(data);
    
    res.json({ success: true, message: 'Регистрация успешна. Ожидайте подтверждения администратором.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const data = readData();
    const user = data.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Ваша регистрация ещё не подтверждена администратором' });
    }
    
    res.json({
      success: true,
      user: { id: user.id, username: user.username, fullname: user.fullname, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Fallback for SPA routing
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const interfaces = require('os').networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  console.log(`TOTO Predictor API server running`);
  console.log(`  Local:    http://localhost:${PORT}`);
  addresses.forEach(addr => {
    console.log(`  Network:  http://${addr}:${PORT}`);
  });
});
