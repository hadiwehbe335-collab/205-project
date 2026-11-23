import Ollie from './Ollie'

export default function OllieCompletion({ compact = false }) {
  return (
    <span className={`ollie-completion${compact ? ' ollie-completion-compact' : ''}`} aria-hidden="true">
      <span className="ollie-completion-ring" />
      <span className="ollie-completion-particles"><i /><i /><i /><i /><i /><i /></span>
      <Ollie expression="great-job" size={48} />
    </span>
  )
}
