import { useState, useEffect, useCallback, useRef } from 'react'
import { ROUNDS, MEMORIZE_TIMES, RECALL_TIME, REVEAL_TIME } from '../config'
import { hsbToHex, calculateRoundScore, getHueGradient, getSatGradient, getBriGradient, getScoreColor, getScoreLabel } from '../utils/colorUtils'
import HSBSlider from './HSBSlider'

const PHASES = { MEMORIZE: 'memorize', RECALL: 'recall', REVEAL: 'reveal' }

export default function GameScreen({ colors, onFinish }) {
  const [roundIdx, setRoundIdx] = useState(0)
  const [phase, setPhase] = useState(PHASES.MEMORIZE)
  const [timeLeft, setTimeLeft] = useState(MEMORIZE_TIMES[0])
  const [playerHSB, setPlayerHSB] = useState({ hue: 180, saturation: 50, brightness: 50 })
  const [roundScore, setRoundScore] = useState(null)
  const [allScores, setAllScores] = useState([])
  const timerRef = useRef(null)

  const target = colors[roundIdx]
  const targetHex = hsbToHex(target.hue, target.saturation, target.brightness)
  const playerHex = hsbToHex(playerHSB.hue, playerHSB.saturation, playerHSB.brightness)

  const advancePhase = useCallback(() => {
    setPhase((prev) => {
      if (prev === PHASES.MEMORIZE) {
        setTimeLeft(RECALL_TIME)
        return PHASES.RECALL
      }
      if (prev === PHASES.RECALL) {
        const score = calculateRoundScore(target, playerHSB)
        setRoundScore(score)
        setAllScores((s) => [...s, score])
        setTimeLeft(REVEAL_TIME)
        return PHASES.REVEAL
      }
      return prev
    })
  }, [target, playerHSB])

  useEffect(() => {
    if (phase === PHASES.REVEAL) return

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          advancePhase()
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [phase, roundIdx, advancePhase])

  const handleNextRound = useCallback(() => {
    if (roundIdx + 1 >= ROUNDS) {
      const finalScores = [...allScores]
      onFinish(finalScores)
      return
    }
    const nextIdx = roundIdx + 1
    setRoundIdx(nextIdx)
    setPhase(PHASES.MEMORIZE)
    setTimeLeft(MEMORIZE_TIMES[nextIdx])
    setPlayerHSB({ hue: 180, saturation: 50, brightness: 50 })
    setRoundScore(null)
  }, [roundIdx, allScores, onFinish])

  useEffect(() => {
    if (phase === PHASES.REVEAL) {
      const timeout = setTimeout(handleNextRound, REVEAL_TIME * 1000)
      return () => clearTimeout(timeout)
    }
  }, [phase, handleNextRound])

  const totalTime = phase === PHASES.MEMORIZE ? MEMORIZE_TIMES[roundIdx] : RECALL_TIME
  const timePct = (timeLeft / totalTime) * 100

  const difficultyLabel = ['Easy', 'Easy', 'Medium', 'Medium', 'Hard', 'Hard', 'Boss 👑'][roundIdx]
  const difficultyColor = ['text-green-400', 'text-green-400', 'text-yellow-400', 'text-yellow-400', 'text-orange-400', 'text-orange-400', 'text-pink-400'][roundIdx]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 relative">

      {/* Top bar: round progress */}
      <div className="w-full max-w-md mb-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Round {roundIdx + 1} / {ROUNDS}</span>
          <span className={`font-semibold ${difficultyColor}`}>{difficultyLabel}</span>
          <span className="text-gray-400">{target.name}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                i < roundIdx ? 'bg-purple-500' :
                i === roundIdx ? 'bg-purple-400 animate-pulse' :
                'bg-white/10'
              }`}
            />
          ))}
        </div>
        {allScores.length > 0 && (
          <div className="flex gap-1 justify-end">
            {allScores.map((s, i) => (
              <span key={i} className="text-xs font-mono font-medium" style={{ color: getScoreColor(s) }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timer bar */}
      <div className="w-full max-w-md mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span className="uppercase tracking-widest">{phase}</span>
          <span className="font-mono text-white font-medium">{timeLeft}s</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{
              width: `${timePct}%`,
              background: timePct > 50 ? '#a855f7' : timePct > 25 ? '#f97316' : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* MEMORIZE PHASE */}
      {phase === PHASES.MEMORIZE && (
        <div className="w-full max-w-md space-y-4 animate-[scaleIn_0.4s_ease-out]">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Memorize this color</p>
            <p className="text-sm text-gray-300">{target.name}</p>
          </div>
          <div
            className="w-full rounded-3xl shadow-2xl transition-all duration-300"
            style={{
              background: targetHex,
              height: '280px',
              boxShadow: `0 0 80px ${targetHex}60, 0 20px 60px rgba(0,0,0,0.5)`
            }}
          />
          <div className="flex justify-center gap-6 text-xs font-mono text-gray-400">
            <span>H: {target.hue}°</span>
            <span>S: {target.saturation}%</span>
            <span>B: {target.brightness}%</span>
          </div>
        </div>
      )}

      {/* RECALL PHASE */}
      {phase === PHASES.RECALL && (
        <div className="w-full max-w-md space-y-4 animate-[scaleIn_0.3s_ease-out]">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest">Recreate the color</p>
          </div>

          <div className="flex gap-3">
            <div
              className="flex-1 rounded-2xl min-h-[120px]"
              style={{
                background: playerHex,
                boxShadow: `0 0 40px ${playerHex}50`
              }}
            />
          </div>

          <div className="glass-card p-5 space-y-1">
            <HSBSlider
              label="Hue"
              value={playerHSB.hue}
              min={0}
              max={360}
              gradient={getHueGradient()}
              onChange={(v) => setPlayerHSB((p) => ({ ...p, hue: v }))}
            />
            <HSBSlider
              label="Saturation"
              value={playerHSB.saturation}
              min={0}
              max={100}
              gradient={getSatGradient(playerHSB.hue, playerHSB.brightness)}
              onChange={(v) => setPlayerHSB((p) => ({ ...p, saturation: v }))}
            />
            <HSBSlider
              label="Brightness"
              value={playerHSB.brightness}
              min={0}
              max={100}
              gradient={getBriGradient(playerHSB.hue, playerHSB.saturation)}
              onChange={(v) => setPlayerHSB((p) => ({ ...p, brightness: v }))}
            />
          </div>

          <button
            onClick={advancePhase}
            className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
          >
            Lock In Answer
          </button>
        </div>
      )}

      {/* REVEAL PHASE */}
      {phase === PHASES.REVEAL && roundScore !== null && (
        <div className="w-full max-w-md space-y-5 animate-[scaleIn_0.4s_ease-out]">
          <div className="flex gap-3">
            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-400 text-center uppercase tracking-widest">Target</p>
              <div
                className="rounded-2xl"
                style={{ background: targetHex, height: '140px', boxShadow: `0 0 40px ${targetHex}50` }}
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs text-gray-400 text-center uppercase tracking-widest">Your Answer</p>
              <div
                className="rounded-2xl"
                style={{ background: playerHex, height: '140px', boxShadow: `0 0 40px ${playerHex}50` }}
              />
            </div>
          </div>

          <div className="glass-card p-6 text-center space-y-2">
            <p className="text-5xl font-bold font-mono" style={{ color: getScoreColor(roundScore) }}>
              {roundScore}
            </p>
            <p className="text-sm" style={{ color: getScoreColor(roundScore) }}>
              {getScoreLabel(roundScore)}
            </p>
            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10 text-xs">
              <div>
                <p className="text-gray-400">Target H</p>
                <p className="font-mono text-white">{target.hue}°</p>
              </div>
              <div>
                <p className="text-gray-400">Target S</p>
                <p className="font-mono text-white">{target.saturation}%</p>
              </div>
              <div>
                <p className="text-gray-400">Target B</p>
                <p className="font-mono text-white">{target.brightness}%</p>
              </div>
            </div>
          </div>

          {roundIdx + 1 < ROUNDS && (
            <p className="text-center text-xs text-gray-500">
              Next round in {REVEAL_TIME}s...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
