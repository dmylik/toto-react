# TOTO Predictor — Deployment Guide (Ubuntu + PM2)

## Architecture

| Component | Tech | Notes |
|-----------|------|-------|
| **Frontend** | React + Vite | Builds to `dist/` |
| **Backend** | Express.js (`server/index.cjs`) | Serves the frontend + API |
| **Data** | JSON file (`server/data.json`) | No database needed |
| **Process Manager** | PM2 | Keeps app alive, auto-restarts |

The server serves both the API and the built frontend from a single process on port `3001`.

---

## Step 1 — Install Node.js (if not installed)

```bash
# Use NodeSource to get a recent LTS version
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node -v   # v22.x
npm -v
```

---

## Step 2 — Upload the project to the server

```bash
# Option A: via SCP (from your local machine)
scp -r /path/to/toto-react user@your-server-ip:~

# Option B: via Git (if the repo is on GitHub/GitLab)
git clone https://github.com/your-org/toto-predictor.git
cd toto-predictor
```

---

## Step 3 — Install dependencies & build the frontend

```bash
cd ~/toto-react

# Install production + dev dependencies
npm install

# Build the React frontend (output goes to dist/)
npm run build
```

---

## Step 4 — Install PM2 globally

```bash
sudo npm install -g pm2
```

---

## Step 5 — Start the app with PM2

```bash
# Start the Express server
pm2 start server/index.cjs --name toto-predictor

# Save the PM2 process list so it restarts on server reboot
pm2 save
pm2 startup   # follow the on-screen instructions to enable systemd
```

**Verify it's running:**

```bash
pm2 status
# Should show "online" for toto-predictor
```

---

## Step 6 — (Optional) Configure a reverse proxy with Nginx

If you want to serve the app on port 80/443 with a domain name:

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/toto-predictor`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/toto-predictor /etc/nginx/sites-enabled/
sudo nginx -t          # test config
sudo systemctl restart nginx
```

If you need HTTPS (recommended), use Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Step 7 — Useful PM2 commands

```bash
pm2 status                    # list all processes
pm2 show toto-predictor       # detailed info (shows path, uptime, restarts, etc.)
pm2 info toto-predictor       # same as show
pm2 logs toto-predictor       # view logs
pm2 logs toto-predictor --lines 100  # last 100 lines
pm2 restart toto-predictor    # restart
pm2 stop toto-predictor       # stop
pm2 delete toto-predictor     # remove from PM2
```

### Проверка пути (рабочей директории) процесса

Чтобы узнать, из какой папки запущен процесс на сервере:

```bash
# Через PM2 (показывает cwd — current working directory)
pm2 show toto-predictor

# В выводе найдите строку "cwd" — это полный путь до папки проекта
# Пример: cwd  /home/user/toto-react

# Альтернатива — через PID процесса
pm2 pid toto-predictor | xargs -I {} ls -l /proc/{}/cwd
```

---

## Step 8 — Updating the app

```bash
cd ~/toto-react

# Pull latest code (if using git)
git pull

# Or re-upload files manually

# Rebuild & restart
npm install
npm run build
pm2 restart toto-predictor
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3001`  | Server port |

Example with custom port:

```bash
PORT=8080 pm2 start server/index.cjs --name toto-predictor
```

---

## Data Persistence

The app stores all data in [`server/data.json`](server/data.json). This file is created automatically on first run (seeded from [`src/data/db.json`](src/data/db.json)).

**Back it up regularly:**

```bash
cp server/data.json server/data.json.backup
```

---

## Summary (Quick Start)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Upload or clone the project to the server
# (e.g., git clone <repo-url>)

# 3. Inside the project directory
cd toto-react
npm install
npm run build
sudo npm install -g pm2
pm2 start server/index.cjs --name toto-predictor
pm2 save
pm2 startup
```

Your app will be available at `http://your-server-ip:3001`.
