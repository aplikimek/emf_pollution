/**
 * JSON Data Store
 * ───────────────
 * Ruan të dhënat si JSON në Vercel Blob Storage.
 * Fallback: in-memory (për development lokal pa BLOB_READ_WRITE_TOKEN).
 *
 * Struktura e skedarëve:
 *   users.json        → lista e të gjithë userave
 *   projects.json     → lista e të gjithë projekteve
 *   measurements/{projectId}.json → matjet e secilit projekt
 */

export type Role = 'admin' | 'editor' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  image: string | null
  role: Role
  clerkId: string
  createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  ownerId: string
  ownerName: string
  ownerEmail: string
  frequency: number
  icnirpLimit: number
  memberIds: string[]         // user IDs with any access
  memberRoles: Record<string, 'editor' | 'viewer'>  // userId → role
  createdAt: string
  updatedAt: string
}

export interface Measurement {
  id: string
  projectId: string
  uploadedBy: string
  locationName: string | null
  lat: number
  lon: number
  distanceM: number | null
  hightM: number | null
  frequencyGhz: number | null
  emaxVm: number
  eavgVm: number
  eminVm: number
  createdAt: string
}

// ── In-memory fallback + URL cache ───────────────────────────
const memStore: Record<string, string> = {}
const urlCache: Record<string, string> = {}  // key → blob URL (per-instance)

async function blobGet(key: string): Promise<string | null> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return memStore[key] ?? null
  try {
    // Use cached URL from a previous put in this instance
    const cached = urlCache[key]
    if (cached) {
      const r = await fetch(cached, { cache: 'no-store' })
      if (r.ok) return r.text()
    }
    // List all blobs and find exact match
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ limit: 200 })
    const blob = blobs.find(b => b.pathname === key)
    if (!blob) return null
    urlCache[key] = blob.url
    const r = await fetch(blob.url, { cache: 'no-store' })
    if (!r.ok) return null
    return r.text()
  } catch (e) {
    console.error(`blobGet(${key}):`, e)
    return memStore[key] ?? null
  }
}

async function blobPut(key: string, value: string): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    memStore[key] = value
    return
  }
  try {
    const { put } = await import('@vercel/blob')
    const blob = await put(key, value, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })
    urlCache[key] = blob.url
  } catch (e) {
    console.error(`blobPut(${key}) FAILED:`, e)
    memStore[key] = value  // fallback so app keeps running
  }
}

// ── Generic helpers ───────────────────────────────────────────
async function readJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await blobGet(key)
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

async function writeJSON<T>(key: string, data: T): Promise<void> {
  await blobPut(key, JSON.stringify(data, null, 2))
}

// ── ID generator ──────────────────────────────────────────────
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

export async function getUsers(): Promise<User[]> {
  return readJSON<User[]>('users.json', [])
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.clerkId === clerkId) ?? null
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.id === id) ?? null
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const users = await getUsers()
  return users.find(u => u.email === email) ?? null
}

export async function upsertClerkUser(profile: {
  clerkId: string; email: string; name: string; image: string | null
}): Promise<User> {
  const users = await getUsers()
  const existing = users.find(u => u.clerkId === profile.clerkId)
  if (existing) {
    // Only write to Blob if profile data actually changed — avoids overwriting
    // role updates made by admin (read-modify-write race condition on every login).
    const changed = existing.name !== profile.name ||
                    existing.image !== profile.image ||
                    existing.email !== profile.email
    if (changed) {
      Object.assign(existing, { name: profile.name, image: profile.image, email: profile.email })
      await writeJSON('users.json', users)
    }
    return existing
  }
  const isFirst = users.length === 0
  const user: User = {
    id: uid(),
    email: profile.email,
    name: profile.name,
    image: profile.image,
    role: isFirst ? 'admin' : 'viewer',
    clerkId: profile.clerkId,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  await writeJSON('users.json', users)
  return user
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  const users = await getUsers()
  const user = users.find(u => u.id === userId)
  if (user) { user.role = role; await writeJSON('users.json', users) }
}

// ═══════════════════════════════════════════════════════════════
// PROJECTS
// ═══════════════════════════════════════════════════════════════

export async function getProjects(): Promise<Project[]> {
  return readJSON<Project[]>('projects.json', [])
}

export async function getProjectsForUser(_userId: string, _role: Role): Promise<Project[]> {
  const all = await getProjects()
  return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProjectById(id: string): Promise<Project | null> {
  const all = await getProjects()
  return all.find(p => p.id === id) ?? null
}

export async function createProject(
  name: string, description: string | null,
  owner: User, frequency: number, icnirpLimit: number
): Promise<Project> {
  const all = await getProjects()
  const now = new Date().toISOString()
  const project: Project = {
    id: uid(), name, description, ownerId: owner.id,
    ownerName: owner.name, ownerEmail: owner.email,
    frequency, icnirpLimit, memberIds: [], memberRoles: {},
    createdAt: now, updatedAt: now,
  }
  all.push(project)
  await writeJSON('projects.json', all)
  return project
}

export async function deleteProject(id: string): Promise<void> {
  const all = await getProjects()
  await writeJSON('projects.json', all.filter(p => p.id !== id))
  await writeJSON(`measurements/${id}.json`, [])
}

export async function addProjectMember(
  projectId: string, userId: string, role: 'editor' | 'viewer'
): Promise<void> {
  const all = await getProjects()
  const project = all.find(p => p.id === projectId)
  if (!project) return
  if (!project.memberIds.includes(userId)) project.memberIds.push(userId)
  project.memberRoles[userId] = role
  project.updatedAt = new Date().toISOString()
  await writeJSON('projects.json', all)
}

export async function removeProjectMember(projectId: string, userId: string): Promise<void> {
  const all = await getProjects()
  const project = all.find(p => p.id === projectId)
  if (!project) return
  project.memberIds = project.memberIds.filter(id => id !== userId)
  delete project.memberRoles[userId]
  project.updatedAt = new Date().toISOString()
  await writeJSON('projects.json', all)
}

export function getEffectiveProjectRole(
  project: Project, userId: string, userRole: Role
): 'admin' | 'editor' | 'viewer' {
  if (userRole === 'admin') return 'admin'
  if (project.ownerId === userId) return 'editor'
  return project.memberRoles[userId] ?? 'viewer'
}

export function canAccessProject(_project: Project, _userId: string, _userRole: Role): boolean {
  return true  // all authenticated users see all projects; editing is controlled by projectRole
}

// ═══════════════════════════════════════════════════════════════
// MEASUREMENTS
// ═══════════════════════════════════════════════════════════════

export async function getMeasurements(projectId: string): Promise<Measurement[]> {
  return readJSON<Measurement[]>(`measurements/${projectId}.json`, [])
}

export async function addMeasurements(
  projectId: string, rows: Omit<Measurement, 'id' | 'createdAt'>[]
): Promise<Measurement[]> {
  const existing = await getMeasurements(projectId)
  const now = new Date().toISOString()
  const newRows: Measurement[] = rows.map(r => ({ ...r, id: uid(), createdAt: now }))
  await writeJSON(`measurements/${projectId}.json`, [...existing, ...newRows])
  // Update project updatedAt
  const projects = await getProjects()
  const project = projects.find(p => p.id === projectId)
  if (project) { project.updatedAt = now; await writeJSON('projects.json', projects) }
  return newRows
}

export async function deleteMeasurement(projectId: string, measurementId: string): Promise<void> {
  const all = await getMeasurements(projectId)
  await writeJSON(`measurements/${projectId}.json`, all.filter(m => m.id !== measurementId))
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════════

export interface AppSettings {
  city: string
  icnirpLimits: { '900': number; '1800': number; '2100': number; default: number }
  measurementTypes: { emf: boolean; airQuality: boolean; noise: boolean; radiation: boolean }
}

const DEFAULT_SETTINGS: AppSettings = {
  city: 'Tiranë',
  icnirpLimits: { '900': 41.2, '1800': 58.3, '2100': 61.4, default: 41.2 },
  measurementTypes: { emf: true, airQuality: false, noise: false, radiation: false },
}

export async function getSettings(): Promise<AppSettings> {
  return readJSON<AppSettings>('settings.json', DEFAULT_SETTINGS)
}

export async function saveSettings(s: Partial<AppSettings>): Promise<void> {
  const current = await getSettings()
  await writeJSON('settings.json', { ...current, ...s })
}
