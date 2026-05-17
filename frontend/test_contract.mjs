import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const PRIVATE_KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0xeF7A92210b0b70b4046A19d4BEf3b849a51d9BC8'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(PRIVATE_KEY)
console.log('Account:', account.address)

console.log('\n1. Testing readContract (no stateStatus)...')
try {
  const colors = await client.readContract({
    address: CONTRACT,
    functionName: 'get_weekly_colors',
    args: [weekNum],
  })
  console.log('Colors result:', colors)
} catch (e) {
  console.error('readContract (no stateStatus) failed:', e.message)
}

console.log('\n1b. Testing readContract leaderboard (no gl.message)...')
try {
  const lb = await client.readContract({
    address: CONTRACT,
    functionName: 'get_leaderboard_top10',
    args: [],
    stateStatus: 'accepted',
  })
  console.log('Leaderboard result:', lb)
} catch (e) {
  console.error('readContract leaderboard failed:', e.message)
}

console.log('\n1c. Testing raw gen_call RPC...')
try {
  const res = await fetch('https://studio.genlayer.com/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'gen_call',
      params: [{
        to: CONTRACT,
        data: JSON.stringify({ method: 'get_leaderboard_top10', args: [] }),
      }, 'latest'],
    }),
  })
  const json = await res.json()
  console.log('gen_call result:', JSON.stringify(json).slice(0, 200))
} catch(e) {
  console.error('raw gen_call failed:', e.message)
}

console.log('\n2. Testing generate_weekly_colors (LLM - slow!)...')
try {
  const txHash = await client.writeContract({
    account,
    address: CONTRACT,
    functionName: 'generate_weekly_colors',
    args: [],
    value: 0,
  })
  console.log('generate TX submitted:', txHash)
  console.log('Waiting for acceptance...')
  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: false,
  })
  console.log('generate receipt:', receipt.status_name ?? receipt)
  const colors = await client.readContract({
    address: CONTRACT,
    functionName: 'get_weekly_colors',
    args: [weekNum],
  })
  console.log('Colors after generate:', colors?.slice(0, 100))
} catch (e) {
  console.error('generate_weekly_colors FAILED:', e.message)
}

console.log('\n3. Testing writeContract create_room...')
try {
  const txHash = await client.writeContract({
    account,
    address: CONTRACT,
    functionName: 'create_room',
    args: ['NODE01'],
    value: 0,
  })
  console.log('TX submitted:', txHash)

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash,
    status: TransactionStatus.ACCEPTED,
    fullTransaction: false,
  })
  console.log('Receipt status:', receipt.status_name ?? receipt)
} catch (e) {
  console.error('writeContract failed:', e.message)
  console.error('Full error:', e)
}
