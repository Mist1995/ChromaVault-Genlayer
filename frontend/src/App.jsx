import { useState, useEffect, useCallback } from 'react'
import { useGenLayer } from './hooks/useGenLayer'
import LandingPage from './components/LandingPage'
import WaitingRoom from './components/WaitingRoom'
import GameScreen from './components/GameScreen'
import FinalLeaderboard from './components/FinalLeaderboard'
import { getWeekNum } from './config'

const DEMO_COLORS = [
  { hue: 0,   saturation: 90, brightness: 90, name: 'Crimson Red',     difficulty: 1 },
  { hue: 210, saturation: 85, brightness: 85, name: 'Ocean Blue',      difficulty: 1 },
  { hue: 160, saturation: 70, brightness: 75, name: 'Emerald Teal',    difficulty: 2 },
  { hue: 28,  saturation: 80, brightness: 95, name: 'Coral Amber',     difficulty: 2 },
  { hue: 270, saturation: 55, brightness: 70, name: 'Dusty Lavender',  difficulty: 3 },
  { hue: 195, saturation: 60, brightness: 65, name: 'Steel Cyan',      difficulty: 3 },
  { hue: 340, saturation: 72, brightness: 68, name: 'Deep Mauve',      difficulty: 3 },
]

const DEMO_ACCOUNT = '0xDem0...P1ay3r'
const DEMO_ROOM = {
  id: 'DEMO01',
  host: DEMO_ACCOUNT,
  players: [DEMO_ACCOUNT, '0xBot1...A1ph4', '0xBot2...B3ta'],
  status: 'finished',
  scores: {},
}

function localSaveRoom(room) {
  try {
    const all = JSON.parse(localStorage.getItem('gl_rooms') || '{}')
    all[room.id] = { ...room, _ts: Date.now() }
    localStorage.setItem('gl_rooms', JSON.stringify(all))
  } catch {}
}

function localGetRoom(id) {
  try {
    const all = JSON.parse(localStorage.getItem('gl_rooms') || '{}')
    return all[id] || null
  } catch { return null }
}

function localUpdateRoom(id, updates) {
  const r = localGetRoom(id)
  if (r) localSaveRoom({ ...r, ...updates })
}

export default function App() {
  const { account, isConnecting, txPending, error, setError, connect, readContract, writeContract } = useGenLayer()

  const [demoMode, setDemoMode] = useState(false)
  const [phase, setPhase] = useState('landing')
  const [roomId, setRoomId] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [room, setRoom] = useState(null)
  const [weeklyColors, setWeeklyColors] = useState([])
  const [roundScores, setRoundScores] = useState([])
  const [finalRoom, setFinalRoom] = useState(null)
  const [globalLeaderboard, setGlobalLeaderboard] = useState([])
  const [playerXP, setPlayerXP] = useState(0)
  const [colorsReady, setColorsReady] = useState(false)
  const [loadingColors, setLoadingColors] = useState(false)

  const pollRoom = useCallback(async (id) => {
    const local = localGetRoom(id)
    if (local) return local
    try {
      const raw = await readContract('get_room', [id])
      if (!raw || raw === '{}') return null
      return JSON.parse(raw)
    } catch {
      return null
    }
  }, [readContract])

  useEffect(() => {
    if (phase !== 'waiting' || !roomId) return
    const interval = setInterval(async () => {
      const roomData = await pollRoom(roomId)
      if (!roomData) return
      setRoom(roomData)
      if (roomData.status === 'playing') {
        setPhase('game')
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, roomId, pollRoom])

  useEffect(() => {
    if (phase !== 'submitting' || !roomId) return
    const interval = setInterval(async () => {
      const roomData = await pollRoom(roomId)
      if (!roomData) return
      if (roomData.status === 'finished') {
        setFinalRoom(roomData)
        loadGlobalLeaderboard()
        loadPlayerXP()
        setPhase('leaderboard')
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [phase, roomId, pollRoom])

  const loadGlobalLeaderboard = useCallback(async () => {
    try {
      const raw = await readContract('get_leaderboard_top10', [])
      setGlobalLeaderboard(JSON.parse(raw || '[]'))
    } catch { }
  }, [readContract])

  const loadPlayerXP = useCallback(async () => {
    if (!account) return
    try {
      const xp = await readContract('get_player_xp', [account])
      setPlayerXP(Number(xp))
    } catch { }
  }, [readContract, account])

  const handleConnect = useCallback(async () => {
    try {
      await connect()
    } catch (err) {
      setError(err.message)
    }
  }, [connect, setError])

  const handleCheckColors = useCallback(async () => {
    try {
      const raw = await readContract('get_weekly_colors', [getWeekNum()])
      const colors = JSON.parse(raw || '[]')
      setWeeklyColors(colors)
      setColorsReady(colors.length === 7)
      return colors.length === 7
    } catch {
      return false
    }
  }, [readContract])

  const handleGenerateColors = useCallback(async () => {
    setLoadingColors(true)
    try {
      await writeContract('generate_weekly_colors', [getWeekNum()])
      const ok = await handleCheckColors()
      if (!ok) {
        setWeeklyColors(DEMO_COLORS)
        setColorsReady(true)
      }
    } catch (err) {
      setWeeklyColors(DEMO_COLORS)
      setColorsReady(true)
      setError(null)
    } finally {
      setLoadingColors(false)
    }
  }, [writeContract, handleCheckColors, setError])

  const handleCreateRoom = useCallback(async (id) => {
    try {
      const colors = weeklyColors.length === 7 ? weeklyColors : DEMO_COLORS
      if (weeklyColors.length !== 7) {
        setWeeklyColors(DEMO_COLORS)
        setColorsReady(true)
      }
      await writeContract('create_room', [id])
      const localRoom = {
        id,
        host: account,
        players: [account],
        status: 'waiting',
        scores: {},
        created_at: Date.now(),
      }
      localSaveRoom(localRoom)
      setRoomId(id)
      setIsHost(true)
      setRoom(localRoom)
      setPhase('waiting')
    } catch (err) {
      setError(err.message)
    }
  }, [writeContract, account, weeklyColors, setError])

  const handleJoinRoom = useCallback(async (id) => {
    try {
      if (weeklyColors.length !== 7) {
        setWeeklyColors(DEMO_COLORS)
        setColorsReady(true)
      }
      await writeContract('join_room', [id])
      let roomData = localGetRoom(id)
      if (!roomData) {
        roomData = { id, host: null, players: [account], status: 'waiting', scores: {}, created_at: Date.now() }
      } else {
        if (!roomData.players.includes(account)) {
          roomData = { ...roomData, players: [...roomData.players, account] }
        }
      }
      localSaveRoom(roomData)
      setRoomId(id)
      setIsHost(false)
      setRoom(roomData)
      setPhase('waiting')
    } catch (err) {
      setError(err.message)
    }
  }, [writeContract, account, weeklyColors, setError])

  const handleStartGame = useCallback(async () => {
    try {
      await writeContract('start_game', [roomId])
      localUpdateRoom(roomId, { status: 'playing' })
      const colors = weeklyColors.length === 7 ? weeklyColors : DEMO_COLORS
      setWeeklyColors(colors)
      setPhase('game')
    } catch (err) {
      setError(err.message)
    }
  }, [writeContract, roomId, weeklyColors, setError])

  const handleGameFinish = useCallback(async (scores) => {
    setRoundScores(scores)
    const total = scores.reduce((a, b) => a + b, 0)
    setPhase('submitting')
    try {
      await writeContract('submit_scores', [roomId, BigInt(total), getWeekNum()])
      const updatedRoom = localGetRoom(roomId)
      if (updatedRoom) {
        updatedRoom.scores = updatedRoom.scores || {}
        updatedRoom.scores[account] = total
        updatedRoom.status = 'finished'
        localSaveRoom(updatedRoom)
        setFinalRoom(updatedRoom)
      }
    } catch (err) {
      const r = localGetRoom(roomId)
      setFinalRoom(r || { id: roomId, scores: { [account]: total }, players: [account], status: 'finished' })
    } finally {
      loadGlobalLeaderboard()
      loadPlayerXP()
      setPhase('leaderboard')
    }
  }, [writeContract, roomId, account, setError, loadGlobalLeaderboard, loadPlayerXP])

  const handlePlayAgain = useCallback(() => {
    setPhase('landing')
    setDemoMode(false)
    setRoomId(null)
    setIsHost(false)
    setRoom(null)
    setWeeklyColors([])
    setRoundScores([])
    setFinalRoom(null)
  }, [])

  const handlePlayDemo = useCallback(() => {
    setDemoMode(true)
    setWeeklyColors(DEMO_COLORS)
    setPhase('game')
  }, [])

  const handleDemoFinish = useCallback((scores) => {
    setRoundScores(scores)
    const total = scores.reduce((a, b) => a + b, 0)
    const mockRoom = {
      ...DEMO_ROOM,
      scores: {
        [DEMO_ACCOUNT]: total,
        '0xBot1...A1ph4': Math.floor(Math.random() * 200) + 350,
        '0xBot2...B3ta':  Math.floor(Math.random() * 200) + 200,
      },
    }
    setFinalRoom(mockRoom)
    setGlobalLeaderboard([
      { address: DEMO_ACCOUNT, xp: total + 150 },
      { address: '0xBot1...A1ph4', xp: 480 },
      { address: '0xBot2...B3ta', xp: 310 },
    ])
    setPlayerXP(total + 150)
    setPhase('leaderboard')
  }, [])

  return (
    <div className="min-h-screen">
      {phase === 'landing' && (
        <LandingPage
          account={account}
          isConnecting={isConnecting}
          txPending={txPending}
          error={error}
          setError={setError}
          colorsReady={colorsReady}
          loadingColors={loadingColors}
          onConnect={handleConnect}
          onCheckColors={handleCheckColors}
          onGenerateColors={handleGenerateColors}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onPlayDemo={handlePlayDemo}
        />
      )}

      {phase === 'waiting' && room && (
        <WaitingRoom
          room={room}
          account={account}
          isHost={isHost}
          txPending={txPending}
          error={error}
          setError={setError}
          onStartGame={handleStartGame}
        />
      )}

      {phase === 'game' && weeklyColors.length === 7 && (
        <GameScreen
          colors={weeklyColors}
          onFinish={demoMode ? handleDemoFinish : handleGameFinish}
        />
      )}

      {phase === 'submitting' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card p-12 text-center space-y-4">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xl font-semibold text-white">Submitting your score on-chain...</p>
            <p className="text-sm text-gray-400">Waiting for all players to finish</p>
          </div>
        </div>
      )}

      {phase === 'leaderboard' && finalRoom && (
        <FinalLeaderboard
          room={finalRoom}
          account={account}
          roundScores={roundScores}
          globalLeaderboard={globalLeaderboard}
          playerXP={playerXP}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  )
}
