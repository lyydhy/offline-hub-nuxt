import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

/**
 * 包元信息表结构:
 *   id          INTEGER PK AUTOINCREMENT
 *   package_id  TEXT NOT NULL
 *   version     TEXT NOT NULL
 *   filename    TEXT NOT NULL
 *   size        INTEGER NOT NULL
 *   md5         TEXT
 *   upload_time INTEGER NOT NULL  (ms epoch)
 *   UNIQUE(package_id, version)
 */

export interface PackageRow {
  id: number
  package_id: string
  version: string
  filename: string
  size: number
  md5: string | null
  upload_time: number
}

let dbInstance: Database.Database | null = null
let zipsDir: string | null = null

/**
 * 初始化数据库 + zips 目录(单例)。
 */
export function initStorage(dbPath: string, _zipsDir: string) {
  if (dbInstance) return
  // 确保目录存在
  const dir = dirname(dbPath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  if (!existsSync(_zipsDir)) mkdirSync(_zipsDir, { recursive: true })

  dbInstance = new Database(dbPath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS packages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      package_id TEXT NOT NULL,
      version TEXT NOT NULL,
      filename TEXT NOT NULL,
      size INTEGER NOT NULL,
      md5 TEXT,
      upload_time INTEGER NOT NULL,
      UNIQUE(package_id, version)
    );
    CREATE INDEX IF NOT EXISTS idx_package_id ON packages(package_id);
  `)
  zipsDir = _zipsDir
  console.log(`[db] initialized: ${dbPath}`)
  console.log(`[db] zips dir:    ${_zipsDir}`)
}

function getDb(): Database.Database {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initStorage() first.')
  }
  return dbInstance
}

export function getZipsDir(): string {
  if (!zipsDir) {
    throw new Error('Zips dir not initialized.')
  }
  return zipsDir
}

// ========== 业务方法 ==========

export function insertPackage(pkg: Omit<PackageRow, 'id' | 'upload_time'>): PackageRow {
  const db = getDb()
  const now = Date.now()
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO packages
      (package_id, version, filename, size, md5, upload_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const info = stmt.run(
    pkg.package_id,
    pkg.version,
    pkg.filename,
    pkg.size,
    pkg.md5,
    now,
  )
  return getById(Number(info.lastInsertRowid))!
}

export function listPackages(packageIdFilter?: string): PackageRow[] {
  const db = getDb()
  if (packageIdFilter) {
    return db
      .prepare(
        'SELECT * FROM packages WHERE package_id = ? ORDER BY package_id ASC, version DESC',
      )
      .all(packageIdFilter) as PackageRow[]
  }
  return db
    .prepare('SELECT * FROM packages ORDER BY package_id ASC, version DESC')
    .all() as PackageRow[]
}

export function getById(id: number): PackageRow | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM packages WHERE id = ?').get(id) as
    | PackageRow
    | undefined
  return row ?? null
}

export function getLatest(packageId: string): PackageRow | null {
  const db = getDb()
  const row = db
    .prepare(
      'SELECT * FROM packages WHERE package_id = ? ORDER BY upload_time DESC LIMIT 1',
    )
    .get(packageId) as PackageRow | undefined
  return row ?? null
}

export function deleteById(id: number): string | null {
  const db = getDb()
  const row = getById(id)
  if (!row) return null
  db.prepare('DELETE FROM packages WHERE id = ?').run(id)
  return row.filename
}

export function getStats() {
  const db = getDb()
  const total = db
    .prepare('SELECT COUNT(*) as c, COALESCE(SUM(size), 0) as s FROM packages')
    .get() as { c: number; s: number }
  const byPkg = db
    .prepare(
      'SELECT package_id, COUNT(*) as c, COALESCE(SUM(size), 0) as s FROM packages GROUP BY package_id',
    )
    .all() as Array<{ package_id: string; c: number; s: number }>
  return {
    totalCount: total.c,
    totalSize: total.s,
    packageCount: byPkg.length,
    byPackage: byPkg,
  }
}
