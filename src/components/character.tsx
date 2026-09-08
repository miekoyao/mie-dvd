import { useState, useEffect, useRef, type CSSProperties } from 'react'
import mImg from '../assets/mie/m.png'
import m1Img from '../assets/mie/m1.png'
import m2Img from '../assets/mie/m2.png'
import dImg from '../assets/dvd/d.png'
import d1Img from '../assets/dvd/d1.png'
import d2Img from '../assets/dvd/d2.png'

const SPEED = 4
const FRAME_INTERVAL_MS = 120

export type CharacterSet = 'mie' | 'dvd'

const FRAME_SETS: Record<CharacterSet, string[]> = {
  mie: [mImg, m1Img, m2Img],
  dvd: [dImg, d1Img, d2Img],
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

function clampPosition(pos: Position, size: Size): Position {
  const maxX = Math.max(0, window.innerWidth - size.width)
  const maxY = Math.max(0, window.innerHeight - size.height)
  return {
    x: Math.min(Math.max(pos.x, 0), maxX),
    y: Math.min(Math.max(pos.y, 0), maxY),
  }
}

function Character({ choice }: { choice: CharacterSet }) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 })
  const [isMoving, setIsMoving] = useState(false)
  const [facing, setFacing] = useState<1 | -1>(1) // 1 = right, -1 = left
  const [frame, setFrame] = useState(0)
  const keysPressed = useRef<Record<string, boolean>>({})
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const sizeRef = useRef<Size>({ width: 0, height: 0 })

  const frames = FRAME_SETS[choice]

  // Reset to the idle frame whenever the character set changes, so we never
  // briefly render an out-of-range index if the two sets differ in length
  useEffect(() => {
    setFrame(0)
  }, [choice])

  // Track which keys are currently held down
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Measure the sprite so we know how far it can travel before hitting an edge
  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        sizeRef.current = { width: rect.width, height: rect.height }
        // Re-clamp current position in case the window shrank
        setPosition((prev) => clampPosition(prev, sizeRef.current))
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Movement loop, driven by requestAnimationFrame for smoothness
  useEffect(() => {
    let animationId: number

    const loop = () => {
      const keys = keysPressed.current
      let dx = 0
      let dy = 0

      if (keys['ArrowUp']) dy -= SPEED
      if (keys['ArrowDown']) dy += SPEED
      if (keys['ArrowLeft']) dx -= SPEED
      if (keys['ArrowRight']) dx += SPEED

      const moving = dx !== 0 || dy !== 0

      if (moving) {
        setPosition((prev) =>
          clampPosition({ x: prev.x + dx, y: prev.y + dy }, sizeRef.current)
        )
        if (dx !== 0) setFacing(dx > 0 ? 1 : -1)
      }

      setIsMoving((prevMoving) => (prevMoving !== moving ? moving : prevMoving))

      animationId = requestAnimationFrame(loop)
    }

    animationId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animationId)
  }, [])

  // Cycle through sprite frames only while moving
  useEffect(() => {
    if (!isMoving) {
      setFrame(0) // reset to idle/default frame ("m") when stopped
      return
    }
    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length)
    }, FRAME_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [isMoving, frames.length])

  const wrapperStyle: CSSProperties = {
    position: 'fixed',
    left: 0,
    top: 0,
    transform: `translate(${position.x}px, ${position.y}px) scaleX(${facing})`,
    willChange: 'transform',
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle}>
      <img
        src={frames[frame]}
        alt="character"
        draggable={false}
        style={{ imageRendering: 'pixelated', userSelect: 'none' }}
      />
    </div>
  )
}

export default Character