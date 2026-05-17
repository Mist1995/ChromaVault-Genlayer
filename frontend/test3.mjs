import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const PRIVATE_KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0xeF7A92210b0b70b4046A19d4BEf3b849a51d9BC8'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })
const account = createAccount(PRIVATE_KEY)

// Check TransactionStatus enum values
console.log('TransactionStatus:', TransactionStatus)

// Get last generate tx receipt (full details)
const TX = '0x9e2933aac249d2a741effb55738530f45e992ccdc43e10f27dac17573daa434d'
console.log('\n=== Full receipt of last generate_weekly_colors TX ===')
try {
  const tx = await client.getTransaction({ hash: TX })
  console.log('Status:', tx.status, tx.status_name)
  console.log('Type:', tx.type)
  if (tx.execution_error) console.log('Execution error:', tx.execution_error)
  if (tx.result_name) console.log('Result:', tx.result_name)
} catch(e) {
  console.error('getTransaction failed:', e.message)
}

// Try finalize via raw RPC
console.log('\n=== Try finalize via SDK ===')
try {
  // Check if there's a finalizeTransaction method
  const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(client)).filter(m => m.includes('final') || m.includes('Final'))
  console.log('Finalize-related methods:', methods)
  
  // Try calling finalize
  if (client.finalizeTransaction) {
    const res = await client.finalizeTransaction({ hash: TX })
    console.log('finalize result:', res)
  } else {
    console.log('No finalizeTransaction method found')
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)).slice(0, 20))
  }
} catch(e) {
  console.error('finalize error:', e.message)
}

// Try reading with different stateStatus
console.log('\n=== Reading colors with stateStatus latest ===')
for (const status of ['accepted', 'finalized', undefined]) {
  try {
    const params = { address: CONTRACT, functionName: 'get_weekly_colors', args: [weekNum] }
    if (status) params.stateStatus = status
    const result = await client.readContract(params)
    console.log(`stateStatus=${status}: ${result?.slice(0,80)}`)
  } catch(e) {
    console.log(`stateStatus=${status}: ERROR - ${e.message.slice(0,60)}`)
  }
}
