// Cartoon turkey mascot (original drawing). `mood` changes the animation.
export function Turkey({ size = 96, mood = 'happy' }: { size?: number; mood?: 'happy' | 'alarm' | 'sleepy' }) {
  return (
    <svg className={`turkey turkey-${mood}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <g className="turkey-tail">
        {[
          ['#c0392b', -60], ['#e8742a', -36], ['#f2b632', -12], ['#e8742a', 12], ['#c0392b', 36], ['#8a4b2a', 60],
        ].map(([c, rot], i) => (
          <ellipse key={i} cx="60" cy="40" rx="13" ry="34" fill={c as string} stroke="#4a2c17" strokeWidth="3" transform={`rotate(${rot} 60 72)`} />
        ))}
      </g>
      <ellipse cx="60" cy="80" rx="30" ry="27" fill="#9b5a33" stroke="#4a2c17" strokeWidth="3" />
      <ellipse cx="60" cy="88" rx="17" ry="13" fill="#c98a55" />
      <g className="turkey-head">
        <circle cx="60" cy="52" r="17" fill="#b06a3c" stroke="#4a2c17" strokeWidth="3" />
        <circle cx="53" cy="49" r="5.5" fill="#fff" stroke="#4a2c17" strokeWidth="2" />
        <circle cx="67" cy="49" r="5.5" fill="#fff" stroke="#4a2c17" strokeWidth="2" />
        <circle className="turkey-pupil" cx="54" cy="50" r="2.6" fill="#2b1a0e" />
        <circle className="turkey-pupil" cx="66" cy="50" r="2.6" fill="#2b1a0e" />
        <path d="M54 57 L66 57 L60 66 Z" fill="#f2b632" stroke="#4a2c17" strokeWidth="2.5" strokeLinejoin="round" />
        <path className="turkey-wattle" d="M63 61 q6 4 3 12 q-5 -2 -5 -9" fill="#d63a3a" stroke="#4a2c17" strokeWidth="2" />
        <circle cx="48" cy="57" r="3" fill="#f08a8a" opacity=".7" />
        <circle cx="72" cy="57" r="3" fill="#f08a8a" opacity=".7" />
      </g>
      <path d="M50 105 l-4 9 M50 105 l0 10 M50 105 l4 9 M70 105 l-4 9 M70 105 l0 10 M70 105 l4 9" stroke="#e8a02a" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
