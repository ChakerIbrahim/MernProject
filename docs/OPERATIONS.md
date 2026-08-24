# Etemad operations runbook

This runbook describes the routine commands for the Ubuntu EC2 deployment. The public entry point is Nginx on ports 80 and 443. The Express process is private on port 8000 and is supervised by PM2.

## Health check

From the project root on EC2, run:

```bash
bash scripts/ec2-health-check.sh
```

The script checks that `etemad-api` is registered in PM2, that the Nginx configuration is valid, that Express answers on port 8000, and that Nginx forwards `/api/health` correctly. It intentionally does not print environment secrets.

## Deploy the latest main branch

Create a backup of the current commit, pull the new source, install locked dependencies, build the frontend, and restart the backend:

```bash
cd ~/etemad-mern-deployment
git fetch origin
git branch "backup-$(date +%Y%m%d-%H%M%S)" HEAD
git pull --ff-only origin main

cd client
npm ci
npm test
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/. /var/www/html/
sudo chown -R www-data:www-data /var/www/html

cd ../server
npm ci
npm test
pm2 restart etemad-api --update-env

cd ..
sudo nginx -t
sudo systemctl reload nginx
bash scripts/ec2-health-check.sh
pm2 save
```

If a command fails, stop the deployment and inspect the error before restarting services. Do not run `npm install` without the lockfile on production unless the dependency change is intentional and has been tested first.

## Roll back the application source

List the local backup branches:

```bash
git branch --list 'backup-*'
```

Check out the desired backup branch, rebuild the client, and restart the backend using the same build and restart commands. A rollback should be followed by the health check and a browser test of login and one authenticated API request.

## Logs

Useful non-secret diagnostics are:

```bash
pm2 status
pm2 logs etemad-api --lines 100 --nostream
sudo tail -n 100 /var/log/nginx/error.log
sudo systemctl status nginx --no-pager
```

The application log may contain user-facing error context, so share only the relevant lines and redact emails, tokens, connection strings, and uploaded filenames before posting logs publicly.

## Secrets and access

Keep `server.env` outside Git. It contains the MongoDB URI, JWT secret, Gemini key, and EmailJS credentials. The repository should contain only `.env.example` templates. Keep AWS security-group access limited to SSH from the maintainer’s IP and HTTP/HTTPS from the public internet; do not expose port 8000.
