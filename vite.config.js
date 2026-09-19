import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import fs from 'fs'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const targetUrl = env.THUNDER_API_TARGET || 'https://dev.thunderlab.id'

  return {
    define: {
      '__APP_VERSION__': JSON.stringify(packageJson.version)
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      open: true,
      proxy: {
        '/api/thunder': {
          target: targetUrl,
          changeOrigin: true,
          secure: false, // In case of self-signed certs
          rewrite: (path) => path.replace(/^\/api\/thunder/, ''),
          // Crucial: we need to rewrite cookie domains so the browser accepts them for localhost
          cookieDomainRewrite: "localhost",
          configure: (proxy, _options) => {
            proxy.on('proxyRes', (proxyRes, req, res) => {
              let cookies = proxyRes.headers['set-cookie'];
              if (cookies) {
                // Strip Secure and SameSite=None so localhost over HTTP will accept the cookie
                proxyRes.headers['set-cookie'] = cookies.map(cookie => 
                  cookie.replace(/;\s*Secure/gi, '').replace(/;\s*SameSite=None/gi, '')
                );
              }
            });
          }
        }
      }
    },
    plugins: [react()],
  }
})
