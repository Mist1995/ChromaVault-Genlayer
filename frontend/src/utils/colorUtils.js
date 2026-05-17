export function hsbToRgb(h, s, b) {
  s = s / 100
  b = b / 100
  const k = (n) => (n + h / 60) % 6
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)))
  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255),
  }
}

export function hsbToHex(h, s, b) {
  const { r, g, b: blue } = hsbToRgb(h, s, b)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
}

export function calculateRoundScore(target, player) {
  const deltaH = Math.abs(target.hue - player.hue)
  const hDiff = Math.min(deltaH, 360 - deltaH) / 180
  const sDiff = Math.abs(target.saturation - player.saturation) / 100
  const bDiff = Math.abs(target.brightness - player.brightness) / 100

  const penalty = hDiff * 40 + sDiff * 30 + bDiff * 30
  return Math.max(0, Math.round(100 - penalty))
}

export function getHueGradient() {
  return 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
}

export function getSatGradient(h, b) {
  const grayHex = hsbToHex(h, 0, b)
  const fullHex = hsbToHex(h, 100, b)
  return `linear-gradient(to right, ${grayHex}, ${fullHex})`
}

export function getBriGradient(h, s) {
  const darkHex = hsbToHex(h, s, 0)
  const lightHex = hsbToHex(h, s, 100)
  return `linear-gradient(to right, ${darkHex}, ${lightHex})`
}

export function getScoreColor(score) {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#eab308'
  if (score >= 50) return '#f97316'
  return '#ef4444'
}

export function getScoreLabel(score) {
  if (score >= 95) return 'Perfect! 🎯'
  if (score >= 85) return 'Excellent! ✨'
  if (score >= 70) return 'Great! 👍'
  if (score >= 50) return 'Good 🙂'
  if (score >= 30) return 'Not bad 😐'
  return 'Keep trying! 💪'
}

export function shortenAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}
