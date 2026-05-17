import { createClient, createAccount } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

const KEY = '0x0a28dac66d5356936a48ea727f828225f7d00b8c28f845e08699a96015ec9a5e'
const CONTRACT = '0x54cB985Cc88d7669865b5fA1C5DbEA703e902B4a'
const weekNum = Math.floor(Date.now() / 1000 / 604800)

const client = createClient({ chain: studionet })

async function read(fn, args = []) {
  return await client.readContract({ address: CONTRACT, functionName: fn, args })
}

console.log('Reading state (TXs were sent a moment ago)...\n')

const colors = await read('get_weekly_colors', [weekNum])
console.log('Weekly colors:', colors?.slice(0, 120))

const room = await read('get_room', ['ROOM01'])
console.log('Room ROOM01:', room?.slice(0, 120))

const lb = await read('get_leaderboard_top10', [])
console.log('Leaderboard:', lb)
