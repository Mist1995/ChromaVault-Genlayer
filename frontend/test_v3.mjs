import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x09603aAB2Db1C1951B3b711854CA79CbA4356648'
const weekNum = String(Math.floor(Date.now() / 1000 / 604800))

const client = createClient({ chain: studionet })
const account = createAccount(KEY)

async function write(fn, args = []) {
  const h = await client.writeContract({ account, address: CONTRACT, functionName: fn, args, value: 0 })
  await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, fullTransaction: false })
  return h.slice(0, 14) + '...'
}
async function read(fn, args = []) {
  return await client.readContract({ address: CONTRACT, functionName: fn, args }).catch(e => `ERROR: ${e.message.slice(0,60)}`)
}

// Wait for contract
process.stdout.write('Waiting for contract')
while (true) {
  const r = await read('get_leaderboard_top10', [])
  if (!r.startsWith('ERROR')) { console.log(' ✅\n'); break }
  process.stdout.write('.')
  await new Promise(r => setTimeout(r, 4000))
}

console.log('Week:', weekNum)

console.log('1. generate_weekly_colors →', await write('generate_weekly_colors', [weekNum]))
const colors = await read('get_weekly_colors', [weekNum])
const c = JSON.parse(colors || '[]')
console.log('   colors:', c.length === 7 ? `✅ ${c[0].name}, ${c[1].name}...` : `❌ got: ${colors?.slice(0,60)}`)

console.log('2. create_room TEST01 →', await write('create_room', ['TEST01']))
const room = await read('get_room', ['TEST01'])
console.log('   room:', room !== '{}' ? `✅ ${room?.slice(0,80)}` : '⏳ not visible yet')

console.log('3. start_game →', await write('start_game', ['TEST01']))

console.log('4. submit_scores →', await write('submit_scores', ['TEST01', BigInt(650), weekNum]))
const lb = await read('get_leaderboard_top10', [])
const entries = JSON.parse(lb || '[]')
console.log('   leaderboard:', entries.length ? `✅ ${entries[0].address.slice(0,10)}... XP=${entries[0].xp}` : '⏳ not visible yet')

console.log('\n✅ ALL TXs ACCEPTED successfully!')
