import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const SYNC_FILE = path.resolve(process.cwd(), 'sync-data.json')

function readSyncData() {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      return JSON.parse(fs.readFileSync(SYNC_FILE, 'utf-8'))
    }
  } catch { /* ignore */ }
  return { forms: null, responses: [], expenses: [], orders: [], updatedAt: 0 }
}

function writeSyncData(data: any) {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch { /* ignore */ }
}

function mergeById(existing: any[] = [], incoming: any[] = []) {
  const map = new Map<string, any>()
  for (const item of existing) {
    if (item && item.id) map.set(String(item.id), item)
  }
  for (const item of incoming) {
    if (item && item.id) map.set(String(item.id), item)
  }
  return Array.from(map.values())
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'da-sync-api',
      configureServer(server) {
        server.middlewares.use('/api/sync', (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method === 'GET') {
            const current = readSyncData()
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(current))
            return
          }

          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => { body += chunk })
            req.on('end', () => {
              try {
                const payload = JSON.parse(body || '{}')
                const current = readSyncData()

                if (Array.isArray(payload.forms)) {
                  current.forms = payload.replaceForms
                    ? payload.forms
                    : mergeById(current.forms || [], payload.forms)
                }
                if (Array.isArray(payload.responses)) {
                  current.responses = mergeById(current.responses || [], payload.responses)
                }
                if (Array.isArray(payload.expenses)) {
                  current.expenses = mergeById(current.expenses || [], payload.expenses)
                }
                if (Array.isArray(payload.orders)) {
                  current.orders = mergeById(current.orders || [], payload.orders)
                }
                current.updatedAt = Date.now()
                writeSyncData(current)

                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(current))
              } catch (e: any) {
                res.statusCode = 400
                res.end(JSON.stringify({ error: e?.message || 'Invalid JSON' }))
              }
            })
            return
          }

          res.statusCode = 405
          res.end()
        })
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    cors: true,
    open: false
  }
})
