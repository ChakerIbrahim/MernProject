# MernProject
mkdir server\config server\controllers server\models server\routes
type nul > server\config\mongoose.config.js
type nul > server\controllers\user.controller.js
type nul > server\models\user.model.js
type nul > server\routes\user.routes.js
type nul > server\server.js
type nul > server\.env

cd server
npm init -y

npm install express mongoose cors dotenv bcrypt jsonwebtoken helmet express-rate-limit
npm install -D nodemon

-------------------------------------------------------
npm create vite@latest client -- --template react
cd client
mkdir src\components src\pages src\functions
npm install axios react-router-dom
npm install -D tailwindcss @tailwindcss/vite

-----------------------------------
vite.config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
---------------
src/index.css
@import "tailwindcss";


--
 <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>