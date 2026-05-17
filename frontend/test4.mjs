import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

const CONTRACT = '0xeF7A92210b0b70b4046A19d4BEf3b849a51d9BC8'
const client = createClient({ chain: studionet })
const myWeek = Math.floor(Date.now() / 1000 / 604800)
console.log('My week num:', myWeek, '(Date.now =', Date.now(), ')')

// Try ±5 weeks around current
for (let w = myWeek - 5; w <= myWeek + 5; w++) {
  try {
    const res = await client.readContract({ address: CONTRACT, functionName: 'get_weekly_colors', args: [w] })
    const parsed = JSON.parse(res || '[]')
    if (parsed.length > 0) {
      console.log(`✅ Week ${w}: Found ${parsed.length} colors! First: ${JSON.stringify(parsed[0])}`)
    } else {
      console.log(`   Week ${w}: []`)
    }
  } catch(e) {
    console.log(`   Week ${w}: Error - ${e.message.slice(0,40)}`)
  }
}

// Also check studionet block timestamp
console.log('\n=== Checking studionet latest block ===')
try {
  const res = await fetch('https://studio.genlayer.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBlockByNumber', params: ['latest', false] }),
  })
  const json = await res.json()
  if (json.result?.timestamp) {
    const ts = parseInt(json.result.timestamp, 16)
    const blockWeek = Math.floor(ts / 604800)
    console.log('Block timestamp:', ts, '| Block week:', blockWeek, '| My week:', myWeek)
  } else {
    console.log('Block result:', JSON.stringify(json).slice(0, 200))
  }
} catch(e) {
  console.error('block fetch failed:', e.message)
}
