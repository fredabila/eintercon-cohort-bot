# Deploying to Digital Ocean

## Important Notes

⚠️ **This WhatsApp bot requires QR code authentication which needs terminal access. Digital Ocean App Platform doesn't provide interactive terminals.**

### Recommended Deployment Option: Digital Ocean Droplet

Use a Droplet (VPS) instead of App Platform for this bot because:
1. You need terminal access to scan the QR code
2. The bot runs continuously without needing HTTP endpoints
3. You can use screen/tmux to keep it running

---

## Option 1: Digital Ocean Droplet (Recommended)

### Step 1: Create a Droplet

1. Go to Digital Ocean Console
2. Create → Droplets
3. Choose:
   - **Distribution**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/month is sufficient)
   - **Datacenter**: Choose closest to your users
4. Add SSH key
5. Create Droplet

### Step 2: Connect to Droplet

```bash
ssh root@your_droplet_ip
```

### Step 3: Install Node.js

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18.x or higher (18, 20, or 22 LTS versions work)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x, 20.x, or 22.x
npm --version
```

### Step 4: Install Git

```bash
apt install git -y
```

### Step 5: Clone Your Repository (First Time Only)

```bash
cd /opt
git clone https://github.com/fredabila/eintercon-cohort-bot.git
cd eintercon-cohort-bot
```

**If you already cloned it, update instead:**
```bash
cd /opt/eintercon-cohort-bot
git pull origin main
```

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: First Run - QR Code Authentication

```bash
npm start
```

- You'll see a QR code in the terminal
- Open WhatsApp on your phone
- Go to: Settings → Linked Devices → Link a Device
- Scan the QR code shown in terminal
- Wait for "Connected to WhatsApp successfully!" message
- Press `Ctrl+C` to stop

### Step 8: Keep Bot Running with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start bot with PM2
pm2 start npm --name "whatsapp-bot" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you

# Check status
pm2 status

# View logs
pm2 logs whatsapp-bot

# Restart bot
pm2 restart whatsapp-bot

# Stop bot
pm2 stop whatsapp-bot
```

### Step 9: Update Bot (Future)

```bash
cd /opt/eintercon-cohort-bot
git pull
npm install
pm2 restart whatsapp-bot
```

---

## Option 2: Digital Ocean App Platform (Has Limitations)

⚠️ **Problem**: App Platform doesn't provide interactive terminal for QR code scanning.

**Workaround**: Authenticate locally first, then deploy with auth_info folder.

### Step 1: Authenticate Locally

```bash
# On your local machine
npm start
# Scan QR code
# Wait for successful connection
# Stop the bot (Ctrl+C)
```

### Step 2: Commit Auth Files

```bash
# Temporarily remove auth_info from .gitignore
# Edit .gitignore and comment out: # auth_info/

git add auth_info/
git commit -m "Add authentication for deployment"
git push
```

### Step 3: Deploy to App Platform

1. Go to Digital Ocean Console
2. Apps → Create App
3. Choose your GitHub repository
4. Select branch: `main`
5. **Important**: Change from "Web Service" to "Worker"
6. Build Command: `npm install`
7. Run Command: `npm start`
8. Plan: Basic ($5/month)
9. Deploy

### Step 4: Secure Auth Files

```bash
# After successful deployment, remove auth from git
git rm -r --cached auth_info/
# Uncomment auth_info/ in .gitignore
git commit -m "Remove auth files from repository"
git push
```

⚠️ **Security Risk**: Committing auth_info to GitHub exposes your WhatsApp session. Only do this with a private repository and remove it immediately after deployment.

---

## Troubleshooting

### "makeWASocket is not a function"
- Run: `npm install` or `npm ci`
- Check that `@whiskeysockets/baileys` is installed in node_modules
- Verify Node.js version: `node --version` (should be 18.x or higher)
- Delete node_modules and package-lock.json, then run `npm install` again

### "Connection Closed"
- WhatsApp may have logged out the device
- Re-run authentication process
- Check internet connectivity

### Bot Stops Running
- Use PM2 (Droplet) or ensure proper configuration (App Platform)
- Check logs: `pm2 logs` or Digital Ocean console

### QR Code Not Showing
- Make sure terminal supports QR code display
- SSH with proper terminal emulator
- Alternatively, check logs for QR code URL

---

## Monitoring

### Check Bot Status (PM2)
```bash
pm2 status
pm2 monit
pm2 logs whatsapp-bot --lines 50
```

### Check Memory/CPU (Droplet)
```bash
htop
# or
top
```

---

## Costs

- **Droplet**: ~$6/month (recommended)
- **App Platform**: ~$5/month (requires workaround for QR authentication)

---

## Best Practices

1. ✅ Use PM2 for process management on Droplets
2. ✅ Keep auth_info folder private (never commit to public repos)
3. ✅ Monitor logs regularly
4. ✅ Set up alerts for bot downtime
5. ✅ Keep Node.js and dependencies updated
6. ✅ Use private GitHub repository
7. ✅ Enable 2FA on Digital Ocean account
