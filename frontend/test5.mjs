import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const PRIVATE_KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x39cA68308b544a53E64BA7DE5dD08059811aCAAc'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(PRIVATE_KEY)
console.log('Account:', account.address, '| Week:', weekNum)

// 1. Submit generate_weekly_colors
console.log('\n1. Submitting generate_weekly_colors...')
const txHash = await client.writeContract({
  account,
  address: CONTRACT,
  functionName: 'generate_weekly_colors',
  args: [],
  value: 0,
})
console.log('TX:', txHash)

// 2. Wait ACCEPTED
console.log('2. Waiting for ACCEPTED...')
await client.waitForTransactionReceipt({ hash: txHash, status: TransactionStatus.ACCEPTED, fullTransaction: false })
console.log('✅ ACCEPTED')

// 3. Finalize
console.log('3. Finalizing...')
const finTx = await client.finalizeTransaction({ account, txId: txHash })
console.log('Finalize EVM tx:', finTx)

// 4. Wait FINALIZED
console.log('4. Waiting for FINALIZED...')
await client.waitForTransactionReceipt({ hash: txHash, status: TransactionStatus.FINALIZED, fullTransaction: false })
console.log('✅ FINALIZED')

// 5. Read colors
console.log('\n5. Reading colors...')
const colors = await client.readContract({ address: CONTRACT, functionName: 'get_weekly_colors', args: [weekNum] })
console.log('Colors:', colors?.slice(0, 200))
