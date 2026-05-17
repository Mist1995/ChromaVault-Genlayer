import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x6f9384A40a71fAAD920F4B30e69Da9C3651b2995'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(KEY)

async function write(fn, args=[]) {
  const h = await client.writeContract({ account, address: CONTRACT, functionName: fn, args, value: 0 })
  const r = await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, fullTransaction: false })
  console.log(`  ${fn} → ${r.status_name ?? 'ACCEPTED'} (${h.slice(0,12)}...)`)
  return h
}
async function read(fn, args=[]) {
  const r = await client.readContract({ address: CONTRACT, functionName: fn, args })
  return r
}

console.log('=== Testing fixed contract ===')
console.log('Week:', weekNum, '| Account:', account.address.slice(0,10))

console.log('\n1. generate_weekly_colors')
await write('generate_weekly_colors', [])

console.log('\n2. Read colors')
const colors = await read('get_weekly_colors', [weekNum])
console.log('Colors:', colors?.slice(0, 120))

console.log('\n3. create_room')
await write('create_room', ['TESTFX1'])

console.log('\n4. Read room')
const room = await read('get_room', ['TESTFX1'])
console.log('Room:', room?.slice(0, 100))

console.log('\n5. start_game')
await write('start_game', ['TESTFX1'])

console.log('\n6. submit_scores')
await write('submit_scores', ['TESTFX1', BigInt(420)])

console.log('\n7. Leaderboard')
const lb = await read('get_leaderboard_top10', [])
console.log('Leaderboard:', lb?.slice(0, 150))

console.log('\n✅ All tests passed!')
