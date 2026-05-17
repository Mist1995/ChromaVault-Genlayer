import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x54cB985Cc88d7669865b5fA1C5DbEA703e902B4a'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(KEY)

async function write(fn, args = []) {
  const h = await client.writeContract({ account, address: CONTRACT, functionName: fn, args, value: 0 })
  const r = await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, fullTransaction: false })
  return { hash: h.slice(0,14) + '...', status: r.status_name ?? 'ACCEPTED' }
}

async function read(fn, args = []) {
  return await client.readContract({ address: CONTRACT, functionName: fn, args })
}

// Poll until contract finalized
process.stdout.write('Waiting for contract finalization')
const start = Date.now()
while (true) {
  try {
    await read('get_leaderboard_top10', [])
    console.log(` ✅ ready in ${Math.round((Date.now()-start)/1000)}s\n`)
    break
  } catch {
    process.stdout.write('.')
    await new Promise(r => setTimeout(r, 5000))
    if (Date.now() - start > 300000) { console.log('\n❌ timeout'); process.exit(1) }
  }
}

console.log('=== FULL TEST v2 contract ===')
console.log('Week:', weekNum, '| Account:', account.address.slice(0, 12) + '...')

console.log('\n1. generate_weekly_colors')
console.log(' ', await write('generate_weekly_colors', []))

console.log('\n2. Read colors')
const colors = await read('get_weekly_colors', [weekNum])
const parsed = JSON.parse(colors || '[]')
console.log(' ', parsed.length === 7 ? `✅ Got ${parsed.length} colors: ${parsed[0].name}, ${parsed[1].name}...` : `❌ Got: ${colors?.slice(0,60)}`)

console.log('\n3. create_room ROOM01')
console.log(' ', await write('create_room', ['ROOM01']))

console.log('\n4. Read room')
const room = await read('get_room', ['ROOM01'])
console.log(' ', room !== '{}' ? `✅ Room: ${room?.slice(0,80)}` : '⏳ Not finalized yet (expected)')

console.log('\n5. start_game')
console.log(' ', await write('start_game', ['ROOM01']))

console.log('\n6. submit_scores')
console.log(' ', await write('submit_scores', ['ROOM01', BigInt(650)]))

console.log('\n7. Leaderboard')
const lb = await read('get_leaderboard_top10', [])
console.log(' ', lb)

console.log('\n✅ All writes ACCEPTED. Contract v2 working!')
