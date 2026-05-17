import { Users, Crown, Play, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { shortenAddress } from '../utils/colorUtils'

export default function WaitingRoom({ room, account, isHost, txPending, error, setError, onStartGame }) {
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleStart = async () => {
    setStarting(true)
    setError(null)
    try {
      await onStartGame()
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-5">

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-white">Waiting Room</h2>
          <p className="text-gray-400 text-sm">Share the code with friends</p>
        </div>

        {/* Room code */}
        <div className="glass-card p-5 text-center space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Room Code</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-5xl font-mono font-bold tracking-[0.2em] bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {room.id}
            </span>
            <button
              onClick={copyCode}
              className="p-2 glass-card hover:bg-white/10 transition-all"
            >
              {copied ? <CheckCircle size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-400" />}
            </button>
          </div>
          <p className="text-xs text-gray-500">Share this code for friends to join</p>
        </div>

        {/* Players list */}
        <div className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
            <Users size={16} />
            <span>Players ({room.players?.length || 0}/6)</span>
            <div className="ml-auto flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i < (room.players?.length || 0) ? 'bg-purple-400' : 'bg-white/10'}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {room.players?.map((player, idx) => (
              <div key={player} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                  {player.slice(2, 4).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white">{shortenAddress(player)}</p>
                  {player.toLowerCase() === room.host?.toLowerCase() && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <Crown size={10} />Host
                    </p>
                  )}
                </div>
                {player.toLowerCase() === account?.toLowerCase() && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">You</span>
                )}
              </div>
            ))}

            {(room.players?.length || 0) < 6 && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
                  <Users size={16} className="text-white/20" />
                </div>
                <p className="text-sm text-white/20">Waiting for player...</p>
                <div className="ml-auto flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-card p-4 border-red-500/30 bg-red-500/5 flex gap-3 items-start">
            <AlertCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-red-400 text-xs">✕</button>
          </div>
        )}

        {/* Game info */}
        <div className="glass-card p-4">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="text-white font-semibold text-lg">7</p>
              <p className="text-gray-400">Rounds</p>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">~10</p>
              <p className="text-gray-400">Minutes</p>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">700</p>
              <p className="text-gray-400">Max Score</p>
            </div>
          </div>
        </div>

        {/* Start button (host only) */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || txPending}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
          >
            {starting || txPending ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Starting game on-chain...</>
            ) : (
              <><Play size={18} />Start Game</>
            )}
          </button>
        ) : (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Waiting for host to start the game...
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
