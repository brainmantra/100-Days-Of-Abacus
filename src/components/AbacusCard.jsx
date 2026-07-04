/**
 * AbacusCard — Vertical column addition display.
 * Used for both Abacus (with physical tool) and Visual (mental) sections.
 *
 * Props:
 *   questionNum   : number   — Q label
 *   addends       : number[] — e.g. [91, 55, -35, 61]
 *   value         : string   — controlled input value
 *   onChange      : fn
 *   onSubmit      : fn       — called on Enter
 *   feedback      : null | 'correct' | 'incorrect'
 *   disabled      : bool
 */
export default function AbacusCard({ questionNum, addends = [], value, onChange, onSubmit, feedback, disabled }) {
  const handleKey = e => {
    if (e.key === 'Enter' && !disabled) onSubmit?.()
  }

  return (
    <div className="abacus-card animate-pop">
      <div className="abacus-card__title">Q{questionNum}</div>

      {addends.map((num, i) => {
        const isNeg = num < 0
        return (
          <div className="abacus-card__row" key={i}>
            <span className={`abacus-card__sign${isNeg ? ' neg' : ''}`}>
              {i === 0 ? (isNeg ? '−' : '+') : (isNeg ? '−' : '+')}
            </span>
            <span className="abacus-card__num">{Math.abs(num)}</span>
          </div>
        )
      })}

      <div className="abacus-card__divider" />

      <div className="abacus-card__answer-row">
        <span className="abacus-card__eq">=</span>
        <input
          className={`abacus-card__input${feedback ? ` ${feedback}` : ''}`}
          type="text"
          inputMode="numeric"
          placeholder="?"
          value={value}
          onChange={e => onChange?.(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
          autoFocus
          autoComplete="off"
        />
      </div>
    </div>
  )
}
