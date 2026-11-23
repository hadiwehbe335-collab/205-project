import OllieGaze from './OllieGaze'
import hi from '../assets/ollie/hi.png'
import greatJob from '../assets/ollie/great-job.png'
import tip from '../assets/ollie/tip.png'
import whoa from '../assets/ollie/whoa.png'
import thinking from '../assets/ollie/thinking.png'
import rest from '../assets/ollie/break.png'

const expressions = { hi, 'great-job': greatJob, tip, whoa, thinking, rest }

// Eye bounds are in the official artwork's shared 174 × 212 coordinate space.
const eyes = {
  hi: [[49, 109, 27, 27], [98, 109, 26, 27]],
  whoa: [[49, 109, 27, 27], [98, 109, 26, 27]],
  tip: [[49, 109, 27, 27], [94, 113, 34, 20]],
  thinking: [[55, 103, 27, 27], [104, 103, 27, 27]],
  'great-job': [[46, 113, 34, 20], [94, 113, 34, 20]],
  rest: [[45, 114, 34, 18], [94, 114, 34, 18]],
}

export default function Ollie({ expression, size = 48, className = '', followPointer = false }) {
  return (
    <span className={`ollie ${className}`} data-expression={expression} style={{ '--ollie-size': `${size}px` }} aria-hidden="true">
      <img src={expressions[expression]} alt="" />
      {followPointer && expression === 'whoa' && <OllieGaze />}
      <svg className="ollie-blink" viewBox="0 0 174 212" focusable="false">
        {eyes[expression].map(([x, y, width, height], index) => {
          const centerX = x + width / 2
          const centerY = y + height / 2
          const curve = expression === 'rest' ? 5 : -5
          return <g key={x}>
            <rect x={x} y={y} width={width} height={height} rx={5} fill={index === 0 ? '#7bd88f' : '#7bc6ff'} />
            <path d={`M ${centerX - 8} ${centerY} q 8 ${curve} 16 0`} fill="none" stroke="#1b1f3b" strokeWidth="4" strokeLinecap="round" />
          </g>
        })}
      </svg>
    </span>
  )
}
