import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

const SYNC_FILE = path.resolve(process.cwd(), 'sync-data.json')

const LEGACY_TEST_EMAILS = new Set([
  'testecliente@gmail.com',
  'testeinspetor@gmail.com',
])
const MASTER_DEV_EMAIL = 'matheus.stanley12@gmail.com'
const MASTER_DEV_PASSWORD = '35215415'
const LEGACY_TEST_IDS = new Set([
  'resp_default_001',
  'usr_2',
  'usr_3',
])

function sanitizeSyncData(raw: any) {
  const data = raw && typeof raw === 'object' ? raw : {}
  const responses = Array.isArray(data.responses)
    ? data.responses.filter((r: any) => r && !LEGACY_TEST_IDS.has(String(r.id)))
    : []
  const expenses = Array.isArray(data.expenses) ? data.expenses : []
  const orders = Array.isArray(data.orders) ? data.orders : []
  const clients = Array.isArray(data.clients) ? data.clients : []
  const users = Array.isArray(data.users)
    ? data.users
        .filter((u: any) => {
          if (!u) return false
          const email = String(u.email || '').trim().toLowerCase()
          if (LEGACY_TEST_EMAILS.has(email) && (!u.updatedAt || u.updatedAt === 0)) return false
          return true
        })
        .map((u: any) => {
          const email = String(u.email || '').trim().toLowerCase()
          if (email === MASTER_DEV_EMAIL) {
            return {
              ...u,
              name: 'Matheus Stanley',
              password: MASTER_DEV_PASSWORD,
              role: 'gestor',
              status: 'ativo',
              mustChangePassword: false,
              updatedAt: Math.max(Number(u.updatedAt) || 0, 1),
            }
          }
          return u
        })
    : null

  return {
    forms: Array.isArray(data.forms) ? data.forms : null,
    responses,
    expenses,
    orders,
    clients,
    users,
    updatedAt: typeof data.updatedAt === 'number' ? data.updatedAt : 0,
  }
}

function readSyncData() {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SYNC_FILE, 'utf-8'))
      return sanitizeSyncData(parsed)
    }
  } catch { /* ignore */ }
  return { forms: null, responses: [], expenses: [], orders: [], clients: [], users: null, updatedAt: 0 }
}

function writeSyncData(data: any) {
  try {
    fs.writeFileSync(SYNC_FILE, JSON.stringify(sanitizeSyncData(data), null, 2), 'utf-8')
  } catch { /* ignore */ }
}

function mergeById(existing: any[] = [], incoming: any[] = [], deletedIds: string[] = []) {
  const deletedSet = new Set((deletedIds || []).map(id => String(id)))
  const map = new Map<string, any>()
  for (const item of existing) {
    if (item && item.id && !deletedSet.has(String(item.id)) && !LEGACY_TEST_IDS.has(String(item.id))) {
      map.set(String(item.id), item)
    }
  }
  for (const item of incoming) {
    if (item && item.id && !deletedSet.has(String(item.id)) && !LEGACY_TEST_IDS.has(String(item.id))) {
      map.set(String(item.id), item)
    }
  }
  return Array.from(map.values())
}

function mergeUsers(existing: any[] = [], incoming: any[] = [], deletedIds: string[] = []) {
  const deletedSet = new Set((deletedIds || []).map(id => String(id)))
  const map = new Map<string, any>()

  const getKey = (u: any) => (u?.email ? String(u.email).trim().toLowerCase() : String(u?.id || ''))
  const getRank = (u: any) => {
    if (typeof u?.updatedAt === 'number' && u.updatedAt > 0) return u.updatedAt
    if (u?.passwordChangedAt) {
      const parsed = Date.parse(u.passwordChangedAt)
      if (!Number.isNaN(parsed)) return parsed
    }
    if (u?.mustChangePassword === false) return 1
    return 0
  }

  for (const u of existing) {
    if (!u || deletedSet.has(String(u.id))) continue
    const key = getKey(u)
    if (LEGACY_TEST_EMAILS.has(key) && (!u.updatedAt || u.updatedAt === 0)) continue
    if (key) map.set(key, u)
  }

  for (const u of incoming) {
    if (!u || deletedSet.has(String(u.id))) continue
    const key = getKey(u)
    if (!key) continue
    if (LEGACY_TEST_EMAILS.has(key) && (!u.updatedAt || u.updatedAt === 0)) continue
    const prev = map.get(key)
    if (!prev) {
      map.set(key, u)
    } else {
      const prevRank = getRank(prev)
      const nextRank = getRank(u)
      if (nextRank >= prevRank) {
        map.set(key, u)
      }
    }
  }

  if (map.has(MASTER_DEV_EMAIL)) {
    const prev = map.get(MASTER_DEV_EMAIL)
    map.set(MASTER_DEV_EMAIL, {
      ...prev,
      name: 'Matheus Stanley',
      email: MASTER_DEV_EMAIL,
      password: MASTER_DEV_PASSWORD,
      role: 'gestor',
      status: 'ativo',
      mustChangePassword: false,
      updatedAt: Math.max(Number(prev?.updatedAt) || 0, 1),
    })
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
                  current.orders = payload.replaceOrders
                    ? payload.orders
                    : mergeById(
                        current.orders || [],
                        payload.orders,
                        Array.isArray(payload.deletedOrderIds) ? payload.deletedOrderIds : []
                      )
                }
                if (Array.isArray(payload.clients)) {
                  current.clients = payload.replaceClients
                    ? payload.clients
                    : mergeById(
                        current.clients || [],
                        payload.clients,
                        Array.isArray(payload.deletedClientIds) ? payload.deletedClientIds : []
                      )
                }
                if (Array.isArray(payload.users)) {
                  current.users = mergeUsers(
                    current.users || [],
                    payload.users,
                    Array.isArray(payload.deletedUserIds) ? payload.deletedUserIds : []
                  )
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
