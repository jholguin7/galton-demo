// Additional charts for v2 dashboard: LineChart (with dots), StackedBars

function LineChart({ width, height, series, xLabels, yTicks, showDots = true }) {
  // series: [{color, values:[], label, dashed?}]
  const padL = 36, padR = 16, padT = 16, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = series[0].values.length;
  const maxY = Math.max(...series.flatMap(s => s.values));
  const minY = 0;
  const px = i => padL + (innerW * i) / (n - 1);
  const py = v => padT + innerH * (1 - (v - minY) / (maxY - minY || 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMinYMid meet" style={{ display:'block', overflow:'visible' }}>
      {/* y-grid */}
      {yTicks && yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={padL + innerW} y1={py(t)} y2={py(t)}
            stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
          <text x={padL - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">
            {typeof t === 'number' && t >= 1000 ? `$${(t/1000)}k` : t}
          </text>
        </g>
      ))}
      {/* series */}
      {series.map((s, si) => {
        const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={s.color} strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray={s.dashed ? '3 4' : undefined}
              style={{ filter: s.glow ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none' }} />
            {showDots && s.values.map((v, i) => (
              <circle key={i} cx={px(i)} cy={py(v)} r="2.6" fill="var(--bg-field)" stroke={s.color} strokeWidth="1.5" />
            ))}
          </g>
        );
      })}
      {/* x-labels */}
      {xLabels && xLabels.map((l, i) => (
        <text key={i} x={px(i)} y={height - 6} textAnchor="middle" fontSize="10"
          fill="var(--ink-soft)" fontFamily="JetBrains Mono">{l}</text>
      ))}
    </svg>
  );
}

function StackedBars({ width, height, groups, stackKeys, xLabels, yTicks }) {
  // groups: [{key, values:{new:x, ret:y}}]
  const padL = 40, padR = 10, padT = 16, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = groups.length;
  const groupW = innerW / n;
  const barW = Math.min(22, groupW * 0.55);
  const maxY = Math.max(...groups.map(g => stackKeys.reduce((a, k) => a + g.values[k.key], 0)));
  const py = v => padT + innerH * (1 - v / (maxY || 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" preserveAspectRatio="xMinYMid meet" style={{ display:'block' }}>
      {yTicks && yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={padL + innerW} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
          <text x={padL - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">${(t/1000)}k</text>
        </g>
      ))}
      {groups.map((g, i) => {
        const cx = padL + groupW * i + groupW / 2;
        let cum = 0;
        return (
          <g key={i}>
            {stackKeys.map(k => {
              const v = g.values[k.key];
              const y1 = py(cum + v);
              const h = py(cum) - y1;
              cum += v;
              return (
                <rect key={k.key} x={cx - barW/2} y={y1} width={barW} height={h}
                  fill={k.color} rx="2" />
              );
            })}
          </g>
        );
      })}
      {xLabels && xLabels.map((l, i) => (
        <text key={i} x={padL + groupW * i + groupW / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">{l}</text>
      ))}
    </svg>
  );
}

Object.assign(window, { LineChart, StackedBars });
