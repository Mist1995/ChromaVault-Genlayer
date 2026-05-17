import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const PRIVATE_KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x39cA68308b544a53E64BA7DE5dD08059811aCAAc'
const weekNum = Math.floor(Date.now() / 1000 / 604800)
console.log('Week number:', weekNum)

const client = createClient({ chain: studionet })
const account = createAccount(PRIVATE_KEY)

// 1. Check current colors
console.log('\n=== Reading current colors ===')
const current = await client.readContract({ address: CONTRACT, functionName: 'get_weekly_colors', args: [weekNum] })
console.log('Current colors:', current)

if (current && current !== '[]' && JSON.parse(current).length === 7) {
  console.log('✅ Colors already generated!')
  process.exit(0)
}

// 2. Submit generate tx
console.log('\n=== Submitting generate_weekly_colors ===')
const txHash = await client.writeContract({
  account,
  address: CONTRACT,
  functionName: 'generate_weekly_colors',
  args: [],
  value: 0,
})
console.log('TX hash:', txHash)

// 3. Wait for FINALIZED (not just ACCEPTED)
console.log('Waiting for ACCEPTED...')
const receipt = await client.waitForTransactionReceipt({
  hash: txHash,
  status: TransactionStatus.ACCEPTED,
  fullTransaction: false,
})
console.log('Receipt status:', receipt.status_name ?? JSON.stringify(receipt).slice(0, 100))

// 4. Read again
console.log('\n=== Reading colors after FINALIZED ===')
const after = await client.readContract({ address: CONTRACT, functionName: 'get_weekly_colors', args: [weekNum] })
console.log('Colors:', after?.slice(0, 150))
