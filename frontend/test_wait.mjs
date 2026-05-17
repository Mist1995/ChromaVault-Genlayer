import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x89F64e8bB5C6B4F0355D59A7206Dc4Ca5f27b980'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(KEY)

// Poll until contract is readable
async function waitForContract(maxWaitMs = 300000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    try {
      const lb = await client.readContract({ address: CONTRACT, functionName: 'get_leaderboard_top10', args: [] })
      console.log(`✅ Contract readable after ${Math.round((Date.now()-start)/1000)}s`)
      return true
    } catch(e) {
      process.stdout.write('.')
      await new Promise(r => setTimeout(r, 5000))
    }
  }
  return false
}

console.log('Waiting for contract to be finalized (polling every 5s)...')
const ok = await waitForContract()
if (!ok) { console.log('\n❌ Timed out'); process.exit(1) }

// Now test operations
const weekColors = await client.readContract({ address: CONTRACT, functionName: 'get_weekly_colors', args: [weekNum] })
console.log('Colors:', weekColors)

const room = await client.readContract({ address: CONTRACT, functionName: 'get_room', args: ['TESTFX1'] })
console.log('Room TESTFX1:', room)

const lb = await client.readContract({ address: CONTRACT, functionName: 'get_leaderboard_top10', args: [] })
console.log('Leaderboard:', lb)
