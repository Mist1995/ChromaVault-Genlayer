import { useState, useEffect } from 'react'
import { LogIn, Plus, ArrowRight, Eye, Zap, Trophy, RefreshCw, AlertCircle, CheckCircle, Play } from 'lucide-react'
import { shortenAddress } from '../utils/colorUtils'
import { CONTRACT_ADDRESS } from '../config'

export default function LandingPage({
  account, isConnecting, txPending, error, setError,
  colorsReady, loadingColors,
  onConnect, onCheckColors, onGenerateColors, onCreateRoom, onJoinRoom, onPlayDemo
}) {
  const [tab, setTab] = useState('create')
  const [roomInput, setRoomInput] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (account && !checked) {
      onCheckColors().then(() => setChecked(true))
    }
  }, [account, checked, onCheckColors])

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  const handleCreate = async () => {
    if (!roomInput.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreateRoom(roomInput.trim().toUpperCase())
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!roomInput.trim()) return
    setJoining(true)
    setError(null)
    try {
      await onJoinRoom(roomInput.trim().toUpperCase())
    } finally {
      setJoining(false)
    }
  }

  const isContractSet = CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899, #f97316)' }}>
                🎨
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-[#0a0a14] flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
            ChromaVault
          </h1>
          <p className="text-gray-400 text-sm">
            Memorize & recreate colors with HSB sliders.<br />
            Powered by <span className="text-purple-400 font-medium">GenLayer AI</span> on-chain.
          </p>
        </div>

        {/* How it works */}
        <div className="glass-card p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="space-y-1">
              <div className="text-2xl">👁️</div>
              <div className="text-white font-medium">Memorize</div>
              <div className="text-gray-400">See the color</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">🎚️</div>
              <div className="text-white font-medium">Recall</div>
              <div className="text-gray-400">Use HSB sliders</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl">🏆</div>
              <div className="text-white font-medium">Score</div>
              <div className="text-gray-400">Win XP on-chain</div>
            </div>
          </div>
        </div>

        {/* Demo mode */}
        <button
          onClick={onPlayDemo}
          className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #7c3aed22, #ec489922)', border: '1px solid #a855f750', color: '#d8b4fe' }}
        >
          <Play size={16} />
          Try Demo — No wallet needed
        </button>

        {/* Contract deploy guide */}
        {!isContractSet && (
          <div className="glass-card p-4 space-y-3" style={{ borderColor: '#f59e0b40', background: '#f59e0b08' }}>
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-yellow-400 shrink-0" />
              <p className="text-sm font-semibold text-yellow-300">Deploy contract to play online</p>
            </div>
            <ol className="text-xs text-yellow-400/80 space-y-1.5 list-none">
              <li>1️⃣ Go to <a href="https://studio.genlayer.com" target="_blank" rel="noreferrer" className="text-yellow-300 underline font-medium">studio.genlayer.com</a></li>
              <li>2️⃣ Create contract → paste <code className="bg-black/30 px-1 rounded">contracts/color_memory_game.py</code></li>
              <li>3️⃣ Deploy on <strong className="text-yellow-300">studionet</strong> → copy address</li>
              <li>4️⃣ Create <code className="bg-black/30 px-1 rounded">frontend/.env</code> with:</li>
            </ol>
            <div className="bg-black/40 rounded-lg px-3 py-2 font-mono text-xs text-green-400 select-all">
              VITE_CONTRACT_ADDRESS=0xYourAddressHere
            </div>
            <p className="text-xs text-yellow-500/60">Then restart: <code className="bg-black/30 px-1 rounded">npm run dev</code></p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex gap-3 items-start">
            <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 text-sm text-red-300">{error}</div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
          </div>
        )}

        {/* Connect wallet */}
        {!account ? (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base py-4"
          >
            {isConnecting ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Connecting...</>
            ) : (
              <><LogIn size={18} />{typeof window !== 'undefined' && window.ethereum ? 'Connect Wallet' : 'Enter Game'}</>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {/* Account badge */}
            <div className="glass-card p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                {account.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Connected</p>
                <p className="font-mono text-sm text-white">{shortenAddress(account)}</p>
              </div>
              <CheckCircle size={16} className="text-green-400" />
            </div>

            {/* Weekly colors status */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={16} className={colorsReady ? 'text-green-400' : 'text-gray-500'} />
                  <span className="text-sm font-medium">Weekly Challenge</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorsReady ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {colorsReady ? 'Ready ✓' : 'Not generated'}
                </span>
              </div>
              {!colorsReady && (
                <button
                  onClick={onGenerateColors}
                  disabled={loadingColors || txPending || !isContractSet}
                  className="btn-secondary w-full flex items-center justify-center gap-2 text-sm py-2.5"
                >
                  {loadingColors ? (
                    <><div className="w-3 h-3 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />Generating AI colors...</>
                  ) : (
                    <><RefreshCw size={14} />Generate This Week's Colors</>
                  )}
                </button>
              )}
            </div>

            {/* Create / Join tabs */}
            <div className="glass-card p-4 space-y-4">
              <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                <button
                  onClick={() => { setTab('create'); setRoomInput('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'create' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Plus size={14} className="inline mr-1" />Create Room
                </button>
                <button
                  onClick={() => { setTab('join'); setRoomInput('') }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'join' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <ArrowRight size={14} className="inline mr-1" />Join Room
                </button>
              </div>

              {tab === 'create' ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      className="input-field font-mono tracking-widest text-center text-lg uppercase"
                      placeholder="ROOM ID"
                      value={roomInput}
                      maxLength={8}
                      onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    />
                    <button
                      onClick={() => setRoomInput(generateRoomId())}
                      className="btn-secondary px-3 py-2 text-xs whitespace-nowrap"
                    >
                      Random
                    </button>
                  </div>
                  <button
                    onClick={handleCreate}
                    disabled={!roomInput.trim() || creating || txPending || !isContractSet}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {creating || txPending ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating room...</>
                    ) : (
                      <><Plus size={16} />Create Room</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    className="input-field font-mono tracking-widest text-center text-lg uppercase"
                    placeholder="Enter Room Code"
                    value={roomInput}
                    maxLength={8}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  />
                  <button
                    onClick={handleJoin}
                    disabled={!roomInput.trim() || joining || txPending || !isContractSet}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {joining || txPending ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Joining room...</>
                    ) : (
                      <><ArrowRight size={16} />Join Room</>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 justify-center">
              <Trophy size={12} />
              <span>Weekly XP • On-chain leaderboard • Once per week</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
