import { useRef } from 'react'

export default function HSBSlider({ label, value, min, max, gradient, onChange }) {
  const trackRef = useRef(null)
  const pct = ((value - min) / (max - min)) * 100

  const handleClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    onChange(Math.round(min + ratio * (max - min)))
  }

  const handleMouseMove = (e) => {
    if (e.buttons !== 1) return
    handleClick(e)
  }

  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-300">{label}</span>
        <span className="text-sm font-mono text-white bg-white/10 px-2 py-0.5 rounded-md">
          {Math.round(value)}
          {label === 'Hue' ? '°' : '%'}
        </span>
      </div>
      <div className="relative h-7 flex items-center">
        <div
          ref={trackRef}
          className="w-full h-5 rounded-full cursor-pointer relative overflow-hidden"
          style={{ background: gradient }}
          onMouseDown={handleClick}
          onMouseMove={handleMouseMove}
        >
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{ margin: 0 }}
          />
        </div>
        <div
          className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-[0_0_12px_rgba(0,0,0,0.8)] pointer-events-none z-20 -translate-y-0"
          style={{ left: `calc(${pct}% - 12px)` }}
        />
      </div>
    </div>
  )
}
