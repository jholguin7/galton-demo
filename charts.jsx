// Reusable chart primitives for the Galton dashboard.
// TickField: vertical tick-mark "bars" (main signal).
// GlowLine: smoothed line overlaid on the tick field.
// MiniBars: compact colored bars for CSAT Over Time.
// ArcGauge: thin-stroke arc used for CSAT / Response Rate.
// PredictionArc: the large bottom-right arc.

const { useMemo } = React;

// smooth Catmull-Rom -> Bezier path through points
function smoothPath(pts) {
  if (pts.length < 2) return '';
  const d = [`M ${pts[0][0]} ${pts[0][1]}`];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d.push(`C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2[0]} ${p2[1]}`);
  }
  return d.join(' ');
}

// Primary tick-field chart used in the hero All Calls card.
// Props: width, height, bars (array of {a: answered 0..1, m: missed 0..1}),
// line (array of 0..1 for prediction overlay), highlightIndex (int)
function TickField({ width, height, bars, line, highlightIndex, onTickHover }) {
  const padY = 8;
  const innerH = height - padY * 2;
  // each column: 2 ticks (answered on top, missed below) vs single full tick
  const cols = bars.length;
  const colW = width / cols;
  const tickW = 2;

  // Line path points (normalized -> screen)
  const linePts = useMemo(() => {
    return line.map((v, i) => [
      colW * i + colW / 2,
      padY + innerH * (1 - v),
    ]);
  }, [line, colW, innerH]);

  const linePath = useMemo(() => smoothPath(linePts), [linePts]);

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
          <stop offset="50%" stopColor="var(--accent)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.5" />
        </linearGradient>
        <filter id="lineGlow" x="-10%" y="-30%" width="120%" height="160%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Tick bars */}
      {bars.map((b, i) => {
        const x = colW * i + colW / 2 - tickW / 2;
        const aH = innerH * 0.55 * b.a; // upper segment (answered)
        const mH = innerH * 0.45 * b.m; // lower segment (missed)
        const midY = padY + innerH * 0.55;
        const isHi = i === highlightIndex;
        const col = isHi ? 'var(--accent)' : 'var(--tick)';
        const col2 = isHi ? 'var(--accent)' : 'var(--tick-dim)';
        return (
          <g key={i} onMouseEnter={() => onTickHover && onTickHover(i)}>
            {/* invisible hitbox */}
            <rect x={colW * i} y={padY} width={colW} height={innerH} fill="transparent" />
            <rect x={x} y={midY - aH} width={tickW} height={aH} fill={col} rx="1" />
            <rect x={x} y={midY + 2} width={tickW} height={mH} fill={col2} rx="1" />
          </g>
        );
      })}

      {/* Prediction line */}
      <path
        d={linePath}
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        filter="url(#lineGlow)"
      />

      {/* highlight marker */}
      {highlightIndex != null && linePts[highlightIndex] && (
        <g>
          <line
            x1={linePts[highlightIndex][0]}
            x2={linePts[highlightIndex][0]}
            y1={padY}
            y2={height - padY}
            stroke="var(--ink)"
            strokeWidth="1"
            strokeDasharray="2 3"
            opacity="0.5"
          />
          <circle
            cx={linePts[highlightIndex][0]}
            cy={linePts[highlightIndex][1]}
            r="5"
            fill="var(--accent)"
            stroke="var(--bg-field)"
            strokeWidth="2"
          />
        </g>
      )}
    </svg>
  );
}

// Compact mini bar chart (CSAT Over Time)
function MiniBars({ width, height, series, labels }) {
  // series: [{color, values:[0..1]}]
  const n = series[0].values.length;
  const padX = 4;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2 - 14;
  const groupW = innerW / n;
  const barW = 2;
  const gap = 1;
  const totalBars = series.length;

  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {Array.from({ length: n }).map((_, i) => {
        const gx = padX + groupW * i + groupW / 2;
        return (
          <g key={i}>
            {series.map((s, si) => {
              const v = s.values[i];
              const h = innerH * v;
              const x = gx - ((totalBars * (barW + gap)) / 2) + si * (barW + gap);
              return (
                <rect
                  key={si}
                  x={x}
                  y={padY + innerH - h}
                  width={barW}
                  height={h}
                  fill={s.color}
                  rx="1"
                />
              );
            })}
          </g>
        );
      })}
      {labels && labels.map((l, i) => (
        <text
          key={i}
          x={padX + groupW * i + groupW / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize="10"
          fill="var(--ink-soft)"
          fontFamily="Inter"
        >{l}</text>
      ))}
    </svg>
  );
}

// Thin-stroke arc gauge. value 0..1
function ArcGauge({ size = 180, value = 0.98, label, sublabel }) {
  const cx = size / 2;
  const cy = size * 0.72;
  const r = size * 0.42;
  const startA = Math.PI; // 180deg
  const endA = 2 * Math.PI; // 360deg -> half circle
  const sweep = endA - startA;
  const vA = startA + sweep * value;

  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [sx, sy] = p(startA);
  const [ex, ey] = p(endA);
  const [vx, vy] = p(vA);

  const trackPath = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;
  const valuePath = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${vx} ${vy}`;

  return (
    <svg width={size} height={size * 0.72 + 8} style={{ display: 'block' }}>
      <path d={trackPath} stroke="var(--line-2)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <path d={valuePath} stroke="var(--accent)" strokeWidth="4" fill="none" strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px var(--accent-glow))' }} />
      {label && (
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fill="var(--ink-2)" fontFamily="Inter">{label}</text>
      )}
    </svg>
  );
}

// Large prediction arc for bottom-right tile
function PredictionArc({ width = 260, height = 130, value = 0.72 }) {
  const cx = width / 2;
  const cy = height + 20;
  const r = width * 0.48;
  const startA = Math.PI;
  const endA = 2 * Math.PI;
  const sweep = endA - startA;
  const vA = startA + sweep * value;
  const p = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  const [sx, sy] = p(startA);
  const [ex, ey] = p(endA);
  const [vx, vy] = p(vA);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`} stroke="var(--line-2)" strokeWidth="1" fill="none" />
      <path d={`M ${sx} ${sy} A ${r} ${r} 0 0 1 ${vx} ${vy}`} stroke="var(--tick)" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

Object.assign(window, { TickField, MiniBars, ArcGauge, PredictionArc, smoothPath });
