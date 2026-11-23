import { initializeDatabase, openDatabase } from './database.mjs'

// Run only after an operator has independently verified the student's affiliation.
const [handle, institution, ...extra] = process.argv.slice(2)
if (!/^[a-z0-9_]{3,24}$/.test(handle ?? '') || !institution?.trim() || institution.length > 100 || extra.length) {
  console.error('Usage: npm run verify-school -- username "Canonical school name" (or --revoke)')
  process.exit(1)
}

const db = openDatabase()
await initializeDatabase(db)
const result = await db.execute({
  sql: 'UPDATE accounts SET institution=?, school_share=0 WHERE handle=?',
  args: [institution === '--revoke' ? null : institution.trim(), handle],
})
db.close()
if (!result.rowsAffected) {
  console.error('Study account unavailable.')
  process.exit(1)
}
console.log('Affiliation updated. The student controls leaderboard visibility.')
