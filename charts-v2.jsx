// Charts for v2 dashboard: LineChart (with hover tooltips), StackedBars, BarChart, CohortHeatmap

function LineChart({ width, height, series, xLabels, yTicks, showDots = true }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);
  const padL = 36, padR = 16, padT = 16, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = series[0] ? series[0].values.length : 0;
  if (n === 0) return null;
  const maxY = Math.max(...series.flatMap(s => s.values));
  const minY = 0;
  const px = i => padL + (innerW * i) / (n - 1);
  const py = v => padT + innerH * (1 - (v - minY) / (maxY - minY || 1));

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xInViewBox = x * (width / rect.width);
    const relX = Math.max(0, Math.min(innerW, xInViewBox - padL));
    const idx = Math.round((relX / innerW) * (n - 1));
    setHoverIdx(idx);
  };

  return (
    <div style={{ position:'relative' }}>
      <svg ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} width="100%"
        preserveAspectRatio="xMinYMid meet"
        style={{ display:'block', overflow:'visible' }}
        onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}>
        {yTicks && yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + innerW} y1={py(t)} y2={py(t)}
              stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3" opacity="0.6"/>
            <text x={padL - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">
              {typeof t === 'number' && t >= 1000 ? `$${(t/1000)}k` : t}
            </text>
          </g>
        ))}
        {hoverIdx !== null && (
          <line x1={px(hoverIdx)} x2={px(hoverIdx)} y1={padT} y2={padT + innerH}
            stroke="var(--ink-2)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" pointerEvents="none"/>
        )}
        {series.map((s, si) => {
          const d = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(v)}`).join(' ');
          return (
            <g key={si}>
              <path d={d} fill="none" stroke={s.color} strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray={s.dashed ? '3 4' : undefined}
                className={s.dashed ? '' : 'gl-draw'}
                style={{
                  filter: s.glow ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none',
                  animationDelay: `${300 + si*180}ms`,
                }}
                pointerEvents="none" />
              {showDots && s.values.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r={hoverIdx === i ? 4 : 2.6}
                  fill={hoverIdx === i ? s.color : 'var(--bg-field)'}
                  stroke={s.color} strokeWidth="1.5"
                  pointerEvents="none"
                  className="gl-fade"
                  style={{
                    transition:'r 120ms, fill 120ms',
                    animationDelay: `${1400 + i*20}ms`,
                  }} />
              ))}
            </g>
          );
        })}
        {xLabels && xLabels.map((l, i) => (
          <text key={i} x={px(i)} y={height - 6} textAnchor="middle" fontSize="10"
            fill="var(--ink-soft)" fontFamily="JetBrains Mono">{l}</text>
        ))}
      </svg>
      {hoverIdx !== null && svgRef.current && (
        <Tooltip
          hoverIdx={hoverIdx}
          series={series}
          xLabel={xLabels ? xLabels[hoverIdx] : ''}
          svg={svgRef.current}
          px={px}
          width={width}
        />
      )}
    </div>
  );
}

function Tooltip({ hoverIdx, series, xLabel, svg, px, width }) {
  const rect = svg.getBoundingClientRect();
  const scale = rect.width / width;
  const leftPx = px(hoverIdx) * scale;
  const isNearRight = leftPx > rect.width - 160;
  return (
    <div style={{
      position:'absolute',
      left: isNearRight ? 'auto' : leftPx + 10,
      right: isNearRight ? (rect.width - leftPx + 10) : 'auto',
      top: 10,
      background:'oklch(25% 0.01 170 / 0.92)',
      border:'1px solid oklch(100% 0 0 / 0.15)',
      borderRadius:10,
      padding:'8px 10px',
      minWidth:120,
      pointerEvents:'none',
      backdropFilter:'blur(10px)',
      fontSize:11,
      color:'oklch(98% 0.004 170)',
      zIndex:10,
    }}>
      <div className="mono" style={{ fontSize:10, opacity:0.7, marginBottom:4 }}>{xLabel}</div>
      {series.map((s, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, lineHeight:1.5 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:s.color }}/>
            {s.key}
          </span>
          <span className="mono" style={{ fontWeight:600 }}>
            {typeof s.values[hoverIdx] === 'number' && s.values[hoverIdx] >= 1000
              ? `$${(s.values[hoverIdx]/1000).toFixed(1)}k`
              : s.values[hoverIdx]}
          </span>
        </div>
      ))}
    </div>
  );
}

function StackedBars({ width, height, groups, stackKeys, xLabels, yTicks }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const svgRef = React.useRef(null);
  const padL = 40, padR = 10, padT = 16, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = groups.length;
  const groupW = innerW / n;
  const barW = Math.min(22, groupW * 0.55);
  const maxY = Math.max(...groups.map(g => stackKeys.reduce((a, k) => a + g.values[k.key], 0)));
  const py = v => padT + innerH * (1 - v / (maxY || 1));

  const handleMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (width / rect.width);
    const relX = Math.max(0, Math.min(innerW, x - padL));
    const idx = Math.min(n - 1, Math.floor(relX / groupW));
    setHoverIdx(idx);
  };

  return (
    <div style={{ position:'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} width="100%"
        preserveAspectRatio="xMinYMid meet" style={{ display:'block' }}
        onMouseMove={handleMove} onMouseLeave={() => setHoverIdx(null)}>
        {yTicks && yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={padL + innerW} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
            <text x={padL - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">${(t/1000)}k</text>
          </g>
        ))}
        {groups.map((g, i) => {
          const cx = padL + groupW * i + groupW / 2;
          let cum = 0;
          const isHover = hoverIdx === i;
          return (
            <g key={i} className="gl-grow" style={{
              transformBox:'fill-box', transformOrigin:'50% 100%',
              animationDelay: `${500 + i*40}ms`,
            }}>
              {stackKeys.map(k => {
                const v = g.values[k.key];
                const y1 = py(cum + v);
                const h = py(cum) - y1;
                cum += v;
                return (
                  <rect key={k.key} x={cx - barW/2} y={y1} width={barW} height={h}
                    fill={k.color} rx="2"
                    opacity={hoverIdx !== null && !isHover ? 0.4 : 1}
                    style={{ transition:'opacity 120ms' }} />
                );
              })}
            </g>
          );
        })}
        {xLabels && xLabels.map((l, i) => (
          <text key={i} x={padL + groupW * i + groupW / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">{l}</text>
        ))}
      </svg>
      {hoverIdx !== null && svgRef.current && (
        <StackedTooltip group={groups[hoverIdx]} stackKeys={stackKeys}
          label={xLabels[hoverIdx]}
          svg={svgRef.current} groupW={groupW} padL={padL} width={width} idx={hoverIdx} />
      )}
    </div>
  );
}

function StackedTooltip({ group, stackKeys, label, svg, groupW, padL, width, idx }) {
  const rect = svg.getBoundingClientRect();
  const scale = rect.width / width;
  const cx = (padL + groupW * idx + groupW / 2) * scale;
  const isNearRight = cx > rect.width - 160;
  const total = stackKeys.reduce((a, k) => a + group.values[k.key], 0);
  return (
    <div style={{
      position:'absolute',
      left: isNearRight ? 'auto' : cx + 10,
      right: isNearRight ? (rect.width - cx + 10) : 'auto',
      top: 10,
      background:'oklch(25% 0.01 170 / 0.92)',
      border:'1px solid oklch(100% 0 0 / 0.15)',
      borderRadius:10, padding:'8px 10px', minWidth:140,
      pointerEvents:'none', backdropFilter:'blur(10px)',
      fontSize:11, color:'oklch(98% 0.004 170)', zIndex:10,
    }}>
      <div className="mono" style={{ fontSize:10, opacity:0.7, marginBottom:4 }}>{label}</div>
      {stackKeys.map((k, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, lineHeight:1.5 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:k.color }}/>
            {k.key === 'new_' ? 'New' : k.key === 'ret' ? 'Returning' : k.key}
          </span>
          <span className="mono" style={{ fontWeight:600 }}>
            ${(group.values[k.key]/1000).toFixed(1)}k
          </span>
        </div>
      ))}
      <div style={{ borderTop:'1px solid oklch(100% 0 0 / 0.2)', marginTop:4, paddingTop:4,
        display:'flex', justifyContent:'space-between' }}>
        <span style={{ opacity:0.7 }}>Total</span>
        <span className="mono" style={{ fontWeight:600 }}>${(total/1000).toFixed(1)}k</span>
      </div>
    </div>
  );
}

function BarChart({ width, height, bins, values }) {
  const [hoverIdx, setHoverIdx] = React.useState(null);
  const padL = 40, padR = 10, padT = 16, padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = values.length;
  const groupW = innerW / n;
  const barW = groupW * 0.6;
  const maxY = Math.max(...values);
  const py = v => padT + innerH * (1 - v / (maxY || 1));
  const yTicks = [0, Math.round(maxY / 2), maxY];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%"
      preserveAspectRatio="xMinYMid meet" style={{ display:'block' }}
      onMouseLeave={() => setHoverIdx(null)}>
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={padL} x2={padL + innerW} y1={py(t)} y2={py(t)} stroke="var(--line)" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"/>
          <text x={padL - 6} y={py(t) + 3} textAnchor="end" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">{t}</text>
        </g>
      ))}
      {values.map((v, i) => {
        const cx = padL + groupW * i + groupW / 2;
        const y1 = py(v);
        const h = py(0) - y1;
        return (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} className="gl-grow" style={{
            cursor:'pointer',
            transformBox:'fill-box', transformOrigin:'50% 100%',
            animationDelay: `${500 + i*60}ms`,
          }}>
            <rect x={cx - barW/2} y={y1} width={barW} height={h}
              fill={hoverIdx === i ? 'var(--accent)' : 'oklch(85% 0.15 115 / 0.5)'}
              rx="3"
              style={{ transition:'fill 120ms', filter: hoverIdx === i ? 'drop-shadow(0 0 8px var(--accent-glow))' : 'none' }} />
            {hoverIdx === i && (
              <text x={cx} y={y1 - 6} textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight="600" fontFamily="JetBrains Mono">{v}</text>
            )}
          </g>
        );
      })}
      {bins.map((l, i) => (
        <text key={i} x={padL + groupW * i + groupW / 2} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--ink-soft)" fontFamily="JetBrains Mono">{l}</text>
      ))}
    </svg>
  );
}

function CohortHeatmap({ data }) {
  const maxMonths = Math.max(...data.map(d => d.months.length));
  const cellH = 40;
  const monthLabels = Array.from({length: maxMonths}, (_, i) => `M${i}`);

  const colorFor = (v) => {
    if (v === undefined || v === null) return 'transparent';
    const intensity = v / 100;
    return `oklch(${50 + intensity*40}% ${0.05 + intensity*0.15} 115 / ${0.3 + intensity*0.5})`;
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'grid', gridTemplateColumns:`76px repeat(${maxMonths}, 1fr)`, gap:4 }}>
        <div />
        {monthLabels.map((m, i) => (
          <div key={i} className="mono" style={{
            fontSize:10, color:'var(--ink-soft)', textAlign:'center',
            letterSpacing:1, fontWeight:600, paddingBottom:4,
          }}>{m}</div>
        ))}
      </div>
      {data.map((row, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:`76px repeat(${maxMonths}, 1fr)`, gap:4, alignItems:'center' }}>
          <div className="mono" style={{ fontSize:11, color:'var(--ink-2)', fontWeight:600, textAlign:'right', paddingRight:4 }}>
            {row.cohort}
          </div>
          {monthLabels.map((_, j) => {
            const v = row.months[j];
            return (
              <div key={j} className="mono gl-fade" style={{
                height:cellH, borderRadius:6,
                background: colorFor(v),
                border: v !== undefined ? '1px solid var(--line)' : '1px dashed var(--line)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, color:'var(--ink)', fontWeight:600,
                animationDelay: `${400 + (i*30) + (j*15)}ms`,
              }}>
                {v !== undefined ? `${v}%` : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { LineChart, StackedBars, BarChart, CohortHeatmap });
