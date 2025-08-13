import React from 'react'

type Props = {
  size?: number // in pixels
  speedSec?: number // rotation duration in seconds
  className?: string
}

const ThreeDCube: React.FC<Props> = ({ size = 72, speedSec = 12, className = '' }) => {
  const half = size / 2
  const style: React.CSSProperties = {
    width: size,
    height: size,
    animationDuration: `${speedSec}s`,
  }

  const faceStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 10,
  }

  return (
    <div className={`r3d-scene ${className}`} style={{ perspective: 900 }}>
      <div className="r3d-cube" style={style}>
        <div className="r3d-face r3d-front from-sky-300 to-sky-500" style={{ ...faceStyle, transform: `translateZ(${half}px)` }} />
        <div className="r3d-face r3d-back from-indigo-300 to-indigo-600" style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${half}px)` }} />
        <div className="r3d-face r3d-right from-emerald-300 to-emerald-600" style={{ ...faceStyle, transform: `rotateY(90deg) translateZ(${half}px)` }} />
        <div className="r3d-face r3d-left from-violet-300 to-violet-600" style={{ ...faceStyle, transform: `rotateY(-90deg) translateZ(${half}px)` }} />
        <div className="r3d-face r3d-top from-rose-300 to-rose-600" style={{ ...faceStyle, transform: `rotateX(90deg) translateZ(${half}px)` }} />
        <div className="r3d-face r3d-bottom from-amber-300 to-amber-500" style={{ ...faceStyle, transform: `rotateX(-90deg) translateZ(${half}px)` }} />
      </div>
    </div>
  )
}

export default ThreeDCube
