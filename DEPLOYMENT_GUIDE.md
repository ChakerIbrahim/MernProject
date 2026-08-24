# Deploying Etemad MERN to AWS EC2

This guide deploys the prepared project at `RamezAtallah-9r/etemad-mern-deployment` to an Ubuntu EC2 instance in `eu-central-1` (Frankfurt). It uses Nginx for the React frontend and reverse proxy, Node.js/PM2 for the Express backend, MongoDB Atlas for the database, and Socket.IO for live chat.

> **Important:** The commands below are intended for an Ubuntu 22.04/24.04 EC2 instance. Run commands in the section marked **Your computer** on your own Ubuntu computer or WSL, and run commands in the section marked **EC2 server** after you connect through SSH.

## 1. What was prepared in the project

The project had no Git history, so a private GitHub repository was created at [github.com/RamezAtallah-9r/etemad-mern-deployment](https://github.com/RamezAtallah-9r/etemad-mern-deployment). Secrets, `node_modules`, Vite `dist`, runtime logs, and uploaded files are excluded by `.gitignore`.

Several production issues were also corrected. The frontend now uses one shared backend-origin helper instead of many hard-coded `http://localhost:8000` URLs. Socket.IO uses the live origin, the backend loads `server.env` using an absolute path based on `__dirname`, and the frontend environment example documents the same-origin production setting. The frontend build was tested successfully with Vite, and both lockfiles installed without reported vulnerabilities in the workspace test.

The backend uses **`MONGOOSE_URI`** and **`SECRET`**, not the generic names `MONGO_URI` and `JWT_SECRET`. Using the wrong names will make the application fail to connect to MongoDB or validate login tokens.

## 2. Understand the final architecture

The browser requests one public origin. Nginx serves the React files from `/var/www/html`, forwards `/api/` to Express on `127.0.0.1:8000`, forwards `/uploads/` to Express for uploaded documents and images, and forwards `/socket.io/` with WebSocket upgrade headers for live chat. Port 8000 must not be opened in the EC2 security group.

| Component | Location or port | Purpose |
|---|---:|---|
| React/Vite production files | `/var/www/html` | Static frontend served by Nginx |
| Express and Socket.IO | `127.0.0.1:8000` | API, authentication, uploads, and chat |
| Nginx | Public ports 80 and 443 | Public web entry point and reverse proxy |
| MongoDB Atlas | External managed service | Database |
| PM2 | Ubuntu service manager | Keeps the backend running after logout/reboot |

## 3. AWS account and free-usage warning

Open the AWS console in the Frankfurt region, `eu-central-1`, and check **Billing and Cost Management → Free Tier** before creating resources. AWS’s current Free Tier page describes up to USD 200 in credits for new customers, with eligibility and duration depending on the account plan and remaining credits [1]. The current AWS compute page lists `T3.micro` among Free plan eligible EC2 instances, but the console remains the authority for your account and region [2].

Use only one small EC2 instance, one EBS volume, and the default VPC. Do not create a NAT Gateway, load balancer, RDS database, extra public IPv4 addresses, or unused Elastic IPs for this beginner deployment. AWS currently charges for public IPv4 addresses, including in-use and idle addresses [3]. Before leaving a paid plan or experimenting with additional services, review the Free Tier and Billing pages.

## 4. Create the EC2 instance

In the AWS console, choose **EC2 → Instances → Launch instances**. Use the following values.

| Setting | Value |
|---|---|
| Name | `etemad-production` |
| Region | Frankfurt, `eu-central-1` |
| AMI | Ubuntu Server 24.04 LTS, 64-bit x86 |
| Instance type | `t3.micro` if the console marks it eligible; otherwise choose an eligible small type shown by your account |
| Key pair | Create a new key pair named `etemad-key`, type `.pem`, and download it once |
| Storage | One small `gp3` root volume, such as 20 GiB |
| Public IPv4 | Enabled, because the first deployment is reached by public IP |
| Security group | Create a new group with exactly the rules below |

The security-group rules should be as follows. AWS describes a security group as the instance’s virtual firewall [4].

| Type | Protocol | Port | Source | Reason |
|---|---|---:|---|---|
| SSH | TCP | 22 | **My IP** | Administration from your current computer |
| HTTP | TCP | 80 | `0.0.0.0/0` | Public website and Let’s Encrypt HTTP challenge |
| HTTPS | TCP | 443 | `0.0.0.0/0` | Public HTTPS website |

If your users require IPv6, add the corresponding IPv6 HTTP/HTTPS rules; otherwise the IPv4 rules are sufficient for the first deployment. Do not add an inbound rule for port 8000. AWS’s SSH prerequisites require a passed instance status check and an inbound SSH rule from your IP [5].

Click **Launch instance**. Wait until the instance state is **Running** and both status checks have passed. Copy its **Public IPv4 address**. For a stable long-term address, you can later attach one carefully chosen Elastic IP, but remember that public IPv4 addresses are billable under current AWS pricing [3].

## 5. Connect from your computer using SSH

On **Your computer**, place the downloaded key in a private folder. On Ubuntu or WSL, run:

```bash
mkdir -p ~/.ssh
mv ~/Downloads/etemad-key.pem ~/.ssh/etemad-key.pem
chmod 400 ~/.ssh/etemad-key.pem
ssh -i "~/.ssh/etemad-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
```

Replace `YOUR_EC2_PUBLIC_IP` with the address copied from EC2. AWS’s documented Ubuntu SSH form uses the `ubuntu` username and a restricted private-key permission [5]. The first connection asks whether to trust the host; type `yes` after checking that you are connecting to your own address.

If SSH reports **Permission denied (publickey)**, confirm that the key pair selected during launch is the same `.pem` file, that the username is `ubuntu`, and that `chmod 400` was applied. If it reports **Connection timed out**, confirm the instance is running, its status checks passed, the public IPv4 address is current, and security-group port 22 still allows your current IP.

## 6. Install Ubuntu, Nginx, Node.js, Git, and PM2

From this point, you are on the **EC2 server**. Run:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y nginx git curl build-essential

curl -fsSL https://deb.nodesource.com/setup_lts.x -o /tmp/nodesource_setup.sh
sudo -E bash /tmp/nodesource_setup.sh
sudo apt install -y nodejs

node --version
npm --version

sudo npm install -g pm2
```

Do not use `sudo npm install` inside the application directories. Install application dependencies as the `ubuntu` user; use `sudo` only for system packages, Nginx, and copying files into `/var/www/html`.

## 7. Give the EC2 server read-only access to the private GitHub repository

Because the repository is private, a plain HTTPS clone will ask for GitHub credentials. The cleanest server method is a **read-only deploy key**. On the **EC2 server**, generate a key with no passphrase:

```bash
ssh-keygen -t ed25519 -C "etemad-ec2-deploy" -f ~/.ssh/etemad_github -N ""
cat ~/.ssh/etemad_github.pub
```

Copy the single public-key line printed by the last command. In GitHub, open the repository, then choose **Settings → Deploy keys → Add deploy key**. Name it `etemad-ec2-readonly`, paste the public key, leave **Allow write access** unchecked, and save it. A deploy key is safer here than placing a personal GitHub token in shell history.

Back on the **EC2 server**, configure SSH for GitHub and clone the project:

```bash
cat > ~/.ssh/config <<'EOF'
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/etemad_github
    IdentitiesOnly yes
EOF
chmod 600 ~/.ssh/config
ssh-keyscan github.com >> ~/.ssh/known_hosts

ssh -T git@github.com
cd ~
git clone git@github.com:RamezAtallah-9r/etemad-mern-deployment.git etemad-mern-deployment
cd ~/etemad-mern-deployment
```

GitHub’s documentation warns never to add passwords or API keys to a repository and documents the normal local initialization and push workflow [6]. The repository created for this project is private and was pushed with secrets excluded.

## 8. Configure MongoDB Atlas before starting the API

Open MongoDB Atlas and create or select the database user and cluster used by this project. In **Security → Network Access**, add the EC2 public IPv4 address with a `/32` suffix, for example `203.0.113.25/32`. Do not use `0.0.0.0/0` for a production database unless you understand the security consequences. Atlas allows connections only from addresses in its IP access list [7].

Copy the Atlas connection string and replace the username, password, cluster, and database name. If the password contains characters such as `@`, `:`, `/`, or `#`, URL-encode them in the connection string. If the EC2 public IP changes, update the Atlas IP access list. If you later attach a stable public address, add that address instead.

## 9. Create the backend environment file

The repository contains `.env.example` only as a safe template. On the **EC2 server**, create the real file at the repository root. It is named `server.env` because this project loads that file:

```bash
cd ~/etemad-mern-deployment
nano server.env
```

Paste the following and replace every placeholder with real values. Do not use the generic names `MONGO_URI` or `JWT_SECRET`.

```dotenv
PORT=8000
MONGOOSE_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE?retryWrites=true&w=majority
SECRET=PASTE_A_LONG_RANDOM_SECRET_HERE
CLIENT_ORIGIN=http://YOUR_EC2_PUBLIC_IP
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=USE_A_STRONG_ADMIN_PASSWORD
GEMINI_API_KEY=
GEMINI_MODEL=
EMAILJS_SERVICE_ID=
EMAILJS_PUBLIC_KEY=
EMAILJS_PRIVATE_KEY=
EMAILJS_VERIFICATION_TEMPLATE=
EMAILJS_GENERAL_TEMPLATE=
```

For a domain-based HTTPS deployment, use `CLIENT_ORIGIN=https://example.com` instead of the temporary HTTP IP. Do not add a trailing slash. The server’s CORS configuration compares the browser origin exactly, and credentialed requests must not use a wildcard origin [8]. Save with `Ctrl+O`, press **Enter**, then exit with `Ctrl+X`. Restrict the file:

```bash
chmod 600 ~/etemad-mern-deployment/server.env
```

Create the frontend environment file before building. It must remain uncommitted because it may contain EmailJS configuration:

```bash
cd ~/etemad-mern-deployment/client
nano .env.local
```

For the Nginx same-origin setup, use:

```dotenv
VITE_API_URL=
VITE_EMAILJS_SERVICE_ID=YOUR_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID=YOUR_EMAILJS_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY=YOUR_EMAILJS_PUBLIC_KEY
```

An empty `VITE_API_URL` is intentional. It makes browser requests use the same public origin, so the browser calls `/api/...`, `/uploads/...`, and Socket.IO through Nginx rather than trying to call `localhost`.

## 10. Install dependencies and test the backend

On the **EC2 server**, run:

```bash
cd ~/etemad-mern-deployment
rm -rf client/node_modules client/dist server/node_modules

cd client
npm ci
cd ../server
npm ci --omit=dev

cd ~/etemad-mern-deployment/server
node server.js
```

The server should print that it is running on port 8000 and should establish a MongoDB connection. In a second SSH window, test it:

```bash
curl http://127.0.0.1:8000/api/health
```

The expected response is:

```json
{"message":"backend is healthy"}
```

Return to the first window and press `Ctrl+C` to stop the temporary foreground process. If the MongoDB connection fails, first check `MONGOOSE_URI`, the Atlas database user/password, and the Atlas IP access list.

## 11. Build and install the React frontend

Still on the **EC2 server**, build the frontend and copy only the generated files into Nginx’s web root:

```bash
cd ~/etemad-mern-deployment/client
npm run build

sudo rm -rf /var/www/html/*
sudo cp -r dist/. /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

If Vite says `vite: Permission denied`, do not use the archived `node_modules`. Run `rm -rf node_modules`, then `npm ci` again. The uploaded archive originally contained dependency folders with unsuitable permissions; the clean install is required.

## 12. Configure Nginx correctly

The project includes the complete configuration at `deployment/nginx-etemad.conf`. Copy it into Nginx’s enabled configuration:

```bash
sudo cp ~/etemad-mern-deployment/deployment/nginx-etemad.conf /etc/nginx/sites-available/etemad
sudo ln -sfn /etc/nginx/sites-available/etemad /etc/nginx/sites-enabled/etemad
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

The configuration has four important parts. `/api/` reaches Express, `/uploads/` reaches Express’s upload directory, `/socket.io/` uses HTTP/1.1 upgrade headers for live chat, and `/` uses `try_files` so React Router pages still work after a browser refresh. Socket.IO’s official reverse-proxy documentation requires the upgrade headers and recommends a proxy read timeout greater than its ping interval plus timeout [9].

## 13. Start the backend permanently with PM2

On the **EC2 server**, run:

```bash
cd ~/etemad-mern-deployment/server
pm2 start server.js --name etemad-api
pm2 status
pm2 logs etemad-api --lines 100
```

Test the API again:

```bash
curl http://127.0.0.1:8000/api/health
curl http://YOUR_EC2_PUBLIC_IP/api/health
```

The second command confirms that Nginx is forwarding the request to Express. Port 8000 remains private because the request is made through port 80.

Configure PM2 to restart after a reboot. Run:

```bash
pm2 startup
```

PM2 prints one `sudo ...` command. Copy and run that exact generated command, then run:

```bash
pm2 save
```

Verify with `pm2 status`. The process should be named `etemad-api` and show `online`.

## 14. Open the live website

Open this address in your browser:

```text
http://YOUR_EC2_PUBLIC_IP
```

Test the following behaviors before calling the deployment complete: the homepage loads, refreshing a React route does not show Nginx 404, login works, `/api/health` responds, an uploaded image or document opens, and negotiation chat connects. The chat test is important because a configuration that only proxies `/api/` will not support Socket.IO.

## 15. Add HTTPS with a domain name

An IP-only site can work over HTTP, but a normal trusted Let’s Encrypt certificate requires a domain name. At your domain registrar, create an **A record** such as `example.com` pointing to the EC2 public IP or stable address. Wait until DNS resolves to the instance, keep port 80 open, and confirm `http://example.com` works.

On the **EC2 server**, install Certbot and let it update Nginx:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
sudo certbot renew --dry-run
```

Certbot’s Nginx instructions are designed to obtain a certificate and update the Nginx configuration automatically [10]. After HTTPS works, update the backend origin and restart PM2:

```bash
nano ~/etemad-mern-deployment/server.env
# Set: CLIENT_ORIGIN=https://example.com

pm2 restart etemad-api --update-env
sudo nginx -t
sudo systemctl reload nginx
```

Because the frontend uses same-origin requests, you do not need to put `https://example.com` into `VITE_API_URL`; keep `VITE_API_URL=` and rebuild only when frontend source code changes.

## 16. Publish future code changes

The normal update flow has two parts: push code from **Your computer**, then pull and rebuild on the **EC2 server**. The real environment files are ignored by Git and remain on the server across updates.

On **Your computer**, after changing source code:

```bash
cd /path/to/your/etemad-mern-deployment
git status
git add .
git commit -m "Describe the change"
git push origin main
```

On the **EC2 server**, deploy the new commit:

```bash
cd ~/etemad-mern-deployment
git pull --ff-only origin main
```

If the change affects the frontend:

```bash
cd ~/etemad-mern-deployment/client
npm ci
npm run build
sudo rm -rf /var/www/html/*
sudo cp -r dist/. /var/www/html/
sudo chown -R www-data:www-data /var/www/html
```

If the change affects the backend:

```bash
cd ~/etemad-mern-deployment/server
npm ci --omit=dev
pm2 restart etemad-api --update-env
```

For any update, finish with:

```bash
sudo nginx -t
sudo systemctl reload nginx
pm2 status
curl http://127.0.0.1:8000/api/health
```

Do not run `git clean -fdx` on the server because it could delete the real `server.env`, the local frontend `.env.local`, and runtime uploads. Do not overwrite `server.env` with `.env.example` during an update.

## 17. Roll back a bad deployment

If the new version is broken, inspect recent commits and return to a known-good commit:

```bash
cd ~/etemad-mern-deployment
git log --oneline -5
git reset --hard KNOWN_GOOD_COMMIT
```

Then rebuild and restart the affected part using the update commands above. The ignored environment files are not changed by `git reset --hard`, but always verify them before restarting the backend.

## 18. Troubleshooting table

| Symptom | Checks and fix |
|---|---|
| SSH timeout | Confirm the instance is running, status checks passed, public IP is current, and security group port 22 allows **My IP** from the computer you are currently using. |
| `Permission denied (publickey)` | Use the correct `.pem`, `chmod 400` it, and connect as `ubuntu`, not `root`. |
| `vite: Permission denied` | Delete `client/node_modules` and run `npm ci`; never copy archived `node_modules` into production. |
| Nginx shows `502 Bad Gateway` | Run `pm2 status`, `pm2 logs etemad-api`, `curl http://127.0.0.1:8000/api/health`, and `sudo tail -n 100 /var/log/nginx/error.log`. |
| Nginx shows the default page | Check that `etemad` is enabled, `default` is removed, then run `sudo nginx -t` and reload Nginx. |
| Homepage works but refresh gives 404 | Confirm the `location /` block contains `try_files $uri $uri/ /index.html;`. |
| API calls still target localhost | Recreate `client/.env.local` with an empty `VITE_API_URL`, run `npm run build`, and copy the new `dist` files to `/var/www/html`. |
| Browser reports CORS error | Set `CLIENT_ORIGIN` to the exact public origin, with the correct `http` or `https` scheme and no trailing slash; then run `pm2 restart etemad-api --update-env`. |
| Chat does not connect | Confirm Nginx has a `/socket.io/` block with `proxy_http_version 1.1`, `Upgrade`, `Connection "upgrade"`, and a read timeout; check the browser console and PM2 logs. |
| Uploaded files or images fail | Confirm the `/uploads/` proxy exists, `server/uploads` exists, and the frontend was rebuilt after the origin fix. |
| MongoDB connection fails | Check `MONGOOSE_URI`, Atlas database credentials, the Atlas IP access list, and whether the EC2 public IP changed. |
| Login succeeds but later tokens fail | Confirm the same long-lived `SECRET` is present in `server.env`; do not change it casually because existing JWTs depend on it. |
| Changes are not visible | Check that `git pull` brought the expected commit, rebuild the frontend when needed, restart PM2 for backend changes, and hard-refresh the browser. |

## 19. Stop or delete resources when finished

For a temporary test, stop the EC2 instance when it is not needed. For a complete shutdown, terminate the instance and delete unused volumes and security resources according to the console’s retention choices. Release any Elastic IP that is no longer needed because AWS charges public IPv4 addresses, including idle ones [3]. Check **Billing and Cost Management → Free Tier** and **Bills** before and after cleanup.

## References

[1]: https://aws.amazon.com/free/ "AWS Free Tier"

[2]: https://aws.amazon.com/free/compute/ "AWS Free Tier Compute Offers"

[3]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/elastic-ip-addresses-eip.html "Amazon EC2 Elastic IP Addresses"

[4]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-security-groups.html "Amazon EC2 Security Groups"

[5]: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/connect-linux-inst-ssh.html "Connect to Your Linux Instance Using an SSH Client"

[6]: https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github "Adding Locally Hosted Code to GitHub"

[7]: https://www.mongodb.com/docs/atlas/security/ip-access-list/ "MongoDB Atlas IP Access List"

[8]: https://socket.io/docs/v4/handling-cors/ "Socket.IO Handling CORS"

[9]: https://socket.io/docs/v4/reverse-proxy/ "Socket.IO Behind a Reverse Proxy"

[10]: https://certbot.eff.org/instructions?ws=nginx&os=ubuntufocal "Certbot Nginx Instructions"
