export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000'

export const getWeekNum = () => String(Math.floor(Date.now() / 1000 / 604800))

export const ROUNDS = 7

export const MEMORIZE_TIMES = [5, 5, 3, 3, 2, 2, 2]

export const RECALL_TIME = 15

export const REVEAL_TIME = 4

export const XP_TABLE = [150, 100, 70, 50, 35, 25]

export const PARTICIPATION_XP = 20
