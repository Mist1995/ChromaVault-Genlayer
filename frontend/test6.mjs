import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionStatus } from 'genlayer-js/types'

const PRIVATE_KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x39cA68308b544a53E64BA7DE5dD08059811aCAAc'

const client = createClient({ chain: studionet })
const account = createAccount(PRIVATE_KEY)

const roomId = 'DETTEST'
console.log('Testing deterministic write (create_room)...')

// 1. Create room
const txHash = await client.writeContract({
  account, address: CONTRACT,
  functionName: 'create_room',
  args: [roomId], value: 0,
})
console.log('TX:', txHash)
await client.waitForTransactionReceipt({ hash: txHash, status: TransactionStatus.ACCEPTED, fullTransaction: false })
console.log('ACCEPTED')

// 2. Read room immediately after ACCEPTED
const room = await client.readContract({ address: CONTRACT, functionName: 'get_room', args: [roomId] })
console.log('Room after ACCEPTED:', room)
// If room != "{}", deterministic writes are readable after ACCEPTED
// If room == "{}", even deterministic writes need finalization
