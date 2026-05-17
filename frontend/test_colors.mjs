import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x54cB985Cc88d7669865b5fA1C5DbEA703e902B4a'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(KEY)

// Poll until colors appear
async function pollUntil(fn, args, check, maxMs = 120000) {
  const t0 = Date.now()
  while (Date.now() - t0 < maxMs) {
    const v = await client.readContract({ address: CONTRACT, functionName: fn, args }).catch(() => null)
    if (v && check(v)) return v
    process.stdout.write('.')
    await new Promise(r => setTimeout(r, 4000))
  }
  return null
}

console.log('1. Checking colors (may already be generated from previous TX)...')
process.stdout.write('Polling')
const colors = await pollUntil('get_weekly_colors', [weekNum], v => JSON.parse(v||'[]').length === 7)
if (colors) {
  const c = JSON.parse(colors)
  console.log(` ✅ Colors ready: ${c.map(x=>x.name).join(', ')}`)
} else {
  console.log('\n⏳ Colors still not visible - generating fresh TX...')
  const h = await client.writeContract({ account, address: CONTRACT, functionName: 'generate_weekly_colors', args: [], value: 0 })
  await client.waitForTransactionReceipt({ hash: h, status: TransactionStatus.ACCEPTED, fullTransaction: false })
  console.log('TX ACCEPTED:', h.slice(0,14) + '...')
  
  process.stdout.write('Polling again')
  const c2 = await pollUntil('get_weekly_colors', [weekNum], v => JSON.parse(v||'[]').length === 7, 180000)
  if (c2) {
    console.log(` ✅ Colors: ${JSON.parse(c2).map(x=>x.name).join(', ')}`)
  } else {
    console.log('\n❌ Colors not visible after 3 min - TX may be erroring')
  }
}

console.log('\n2. Leaderboard check...')
const lb = await client.readContract({ address: CONTRACT, functionName: 'get_leaderboard_top10', args: [] })
console.log(lb === '[]' || lb === null ? '⏳ Empty (submit_scores state pending finalization)' : '✅ ' + lb)

console.log('\n3. Room ROOM01 status...')
const room = await client.readContract({ address: CONTRACT, functionName: 'get_room', args: ['ROOM01'] })
console.log(room && room !== '{}' ? '✅ ' + room.slice(0, 100) : '⏳ Not visible')
