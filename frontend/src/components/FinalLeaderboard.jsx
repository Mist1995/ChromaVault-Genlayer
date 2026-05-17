import { Trophy, RotateCcw, Star, Zap } from 'lucide-react'
import { getScoreColor, shortenAddress } from '../utils/colorUtils'
import { XP_TABLE, PARTICIPATION_XP } from '../config'

const MEDALS = ['🥇', '🥈', '🥉']

export default function FinalLeaderboard({ room, account, roundScores, globalLeaderboard, playerXP, onPlayAgain }) {
  const totalScore = roundScores.reduce((a, b) => a + b, 0)

  const sorted = Object.entries(room.scores || {})
    .map(([addr, score]) => ({ addr, score }))
    .sort((a, b) => b.score - a.score)

  const myRank = sorted.findIndex(p => p.addr === account || p.addr.toLowerCase() === account?.toLowerCase()) + 1
  const myXP = myRank > 0 ? (XP_TABLE[myRank - 1] || 0) + PARTICIPATION_XP + (totalScore >= 700 ? 50 : 0) : PARTICIPATION_XP

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 space-y-6 max-w-md mx-auto">

      {/* Trophy */}
      <div className="text-center space-y-2">
        <div className="text-6xl mb-2">
          {myRank === 1 ? '🏆' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎮'}
        </div>
        <h2 className="text-3xl font-bold text-white">
          {myRank === 1 ? 'You Won!' : myRank === 2 ? '2nd Place!' : myRank === 3 ? '3rd Place!' : `${myRank}th Place`}
        </h2>
        <p className="text-gray-400 text-sm">Your total score: <span className="font-mono font-semibold text-white">{totalScore} / 700</span></p>
      </div>

      {/* XP earned */}
      <div className="glass-card p-5 w-full text-center space-y-1"
        style={{ borderColor: '#a855f750', background: 'linear-gradient(135deg, #a855f710, #ec489910)' }}>
        <p className="text-xs text-gray-400 uppercase tracking-widest">XP Earned This Game</p>
        <div className="flex items-center justify-center gap-2">
          <Zap size={22} className="text-yellow-400" />
          <span className="text-4xl font-bold text-yellow-400 font-mono">+{myXP}</span>
        </div>
        <p className="text-xs text-gray-400">Total on-chain XP: <span className="text-white font-mono">{playerXP}</span></p>
      </div>

      {/* Round scores breakdown */}
      <div className="glass-card p-4 w-full space-y-3">
        <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Star size={14} />Round Scores
        </p>
        <div className="grid grid-cols-7 gap-1">
          {roundScores.map((s, i) => (
            <div key={i} className="text-center">
              <div
                className="h-12 rounded-lg flex items-end justify-center pb-1"
                style={{ background: `${getScoreColor(s)}20` }}
              >
                <div
                  className="w-full mx-0.5 rounded-sm transition-all duration-700"
                  style={{ height: `${s}%`, background: getScoreColor(s) }}
                />
              </div>
              <p className="text-xs font-mono mt-1" style={{ color: getScoreColor(s) }}>{s}</p>
              <p className="text-[10px] text-gray-600">R{i + 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Room leaderboard */}
      <div className="glass-card p-4 w-full space-y-3">
        <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Trophy size={14} />Game Results
        </p>
        <div className="space-y-2">
          {sorted.map(({ addr, score }, idx) => {
            const isMe = addr.toLowerCase() === account?.toLowerCase()
            const rankXP = (XP_TABLE[idx] || 0) + PARTICIPATION_XP
            return (
              <div
                key={addr}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isMe ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`}
              >
                <span className="text-xl w-7 text-center">{MEDALS[idx] || `${idx + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-white">
                    {shortenAddress(addr)}{isMe && <span className="ml-1 text-xs text-purple-300">(you)</span>}
                  </p>
                  <p className="text-xs text-gray-400">Score: <span className="font-mono">{score}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400 font-semibold text-sm">+{rankXP} XP</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Global leaderboard */}
      {globalLeaderboard.length > 0 && (
        <div className="glass-card p-4 w-full space-y-3">
          <p className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            🌍 Global Leaderboard (Top 10)
          </p>
          <div className="space-y-1.5">
            {globalLeaderboard.map(({ address, xp }, idx) => {
              const isMe = address.toLowerCase() === account?.toLowerCase()
              return (
                <div key={address} className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm ${isMe ? 'bg-purple-500/20' : ''}`}>
                  <span className="text-gray-500 w-5 text-xs font-mono">{idx + 1}</span>
                  <span className="font-mono text-white flex-1">{shortenAddress(address)}</span>
                  <span className="text-yellow-400 font-mono font-semibold">{xp} XP</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        className="btn-secondary w-full flex items-center justify-center gap-2 py-3.5"
      >
        <RotateCcw size={16} />Back to Lobby
      </button>

      <p className="text-xs text-center text-gray-600 pb-4">
        XP distributed on-chain via GenLayer smart contract ⛓️<br />
        Come back next week for new AI-generated colors!
      </p>
    </div>
  )
}
