import { useEffect, useState } from 'react'
import Icon from './Icon'
import Ollie from './Ollie'

export default function OllieLoading({ children, compact = false, thinkingMessage }) {
  const [thinking, setThinking] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setThinking(true), 320)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className={`ollie-loading${compact ? ' ollie-loading-compact' : ''}${thinking ? ' ollie-loading-thinking' : ''}`}>
      <div className="ollie-loading-scene" aria-hidden="true">
        <span className="ollie-loading-glow" />
        <span className="ollie-loading-particles"><i /><i /><i /><i /><i /></span>
        <svg className="ollie-energy" viewBox="0 0 154 154" focusable="false">
          <circle className="ollie-energy-ring" cx="77" cy="77" r="58" pathLength="100" />
          <circle className="ollie-thinking-pulse" cx="77" cy="77" r="58" pathLength="100" />
          <g className="ollie-energy-trails">
            <circle cx="77" cy="77" r="58" pathLength="100" stroke="var(--sky)" strokeDasharray="19 81" />
            <circle cx="77" cy="77" r="58" pathLength="100" stroke="var(--sunny)" strokeDasharray="10 90" strokeDashoffset="-33" />
            <circle cx="77" cy="77" r="58" pathLength="100" stroke="var(--leaf)" strokeDasharray="14 86" strokeDashoffset="-65" />
          </g>
        </svg>
        {!compact && <div className="ollie-satellites">
          <span className="ollie-satellite ollie-satellite-book"><span><Icon name="courses" size={13} /></span></span>
          <span className="ollie-satellite ollie-satellite-star"><span><Icon name="spark" size={15} /></span></span>
          <span className="ollie-satellite ollie-satellite-dot" />
        </div>}
        <div className="ollie-loading-float">
          <Ollie expression="hi" className="ollie-arrival-face" size={96} />
          <Ollie expression="thinking" className="ollie-thinking-face" size={96} />
        </div>
      </div>
      <p>{thinking && thinkingMessage ? thinkingMessage : children}</p>
    </div>
  )
}
