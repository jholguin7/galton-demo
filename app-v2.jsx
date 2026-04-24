// Galton v2 — Daily business health check dashboard
// Sage-glass + chartreuse aesthetic, left sidebar nav, KPI tiles + trend charts + insights.

const { useState, useEffect, useMemo } = React;

// ───── Data ────────────────────────────────────────────────────────
const KPIS = [
  { label:'Blended MER', value:'5.8x',  delta:'+0.4x vs prior', trend:'up',   note:'Revenue / Ad Spend' },
  { label:'CMER',        value:'2.3x',  delta:'+0.2x vs prior', trend:'up',   note:'Contribution Margin / Spend', active:true },
  { label:'Contribution Margin', value:'$142K', delta:'+12% vs prior', trend:'up',  note:'Revenue − COGS − Discounts' },
  { label:'Total Ad Spend', value:'$61.9K', delta:'−3% vs prior', trend:'down', note:'Meta + Google + TikTok + Amazon' },
  { label:'Orders', value:'1,847', delta:'+8% vs prior', trend:'up' },
  { label:'AOV', value:'$127', delta:'+$4 vs prior', trend:'up' },
  { label:'New Customer CAC', value:'$48', delta:'−$6 vs prior', trend:'up' },
  { label:'LTV : CAC', value:'3.2x', delta:'+0.3x vs prior', trend:'up', status:'Healthy' },
];

const WEEKS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
const MER_SERIES = [
  { key:'Blended MER', color:'var(--accent)', glow:true,
    values:[4.8,5.1,5.0,5.4,5.3,5.5,5.6,5.7,5.5,5.8,5.9,5.8] },
  { key:'CMER', color:'var(--ink)',
    values:[1.9,2.0,2.1,2.0,2.1,2.2,2.1,2.3,2.2,2.3,2.4,2.3] },
];
const REV_SPEND = [
  { key:'Revenue', color:'var(--accent)', glow:true,
    values:[22000,28000,34000,38000,42000,45000,48000,52000,58000,62000,65000,70000] },
  { key:'Total Spend', color:'oklch(78% 0.03 40)', dashed:true,
    values:[14000,16000,18000,19000,20000,21000,22000,24000,25000,25500,26000,26500] },
];
const STACKED = WEEKS.map((w,i) => ({
  key:w,
  values:{
    ret: 24000 + Math.sin(i/2)*4000 + i*900,
    new_: 12000 + Math.cos(i/3)*3000 + i*700,
  }
}));

const INSIGHTS = [
  { tone:'good',  title:'CMER improving.', body:'Efficiency up 0.2x this period, driven by TikTok outperforming expectations.' },
  { tone:'warn',  title:'Google near saturation.', body:'Only $1,400/mo headroom before CMER hits 1.0x break-even.' },
  { tone:'info',  title:'TikTok underinvested.', body:'Marginal CMER 2.3x with $14K/mo headroom. Shift from Google.' },
];

const SIDEBAR = [
  { section:'GALTON', items:[
    { label:'Overview', icon:'grid', active:true },
    { label:'Channel Intelligence', icon:'channel' },
    { label:'Customer Health', icon:'health' },
    { label:'Experiment Lab', icon:'flask' },
    { label:'Connections', icon:'link', badge:5 },
  ]},
  { section:'FINCH', items:[
    { label:'Dashboard', icon:'home' },
    { label:'Campaigns', icon:'megaphone' },
    { label:'Canvas', icon:'canvas' },
    { label:'Analytics', icon:'chart' },
  ]},
];

// ───── Icons ───────────────────────────────────────────────────────
function Icon({ name, size=16 }) {
  const s = { fill:'none', stroke:'currentColor', strokeWidth:1.5, strokeLinecap:'round', strokeLinejoin:'round' };
  const paths = {
    grid:     <><rect x="3" y="3" width="7" height="7" {...s}/><rect x="14" y="3" width="7" height="7" {...s}/><rect x="3" y="14" width="7" height="7" {...s}/><rect x="14" y="14" width="7" height="7" {...s}/></>,
    channel:  <><path d="M3 12h4l3-8 4 16 3-8h4" {...s}/></>,
    health:   <><path d="M3 12h4l2-4 3 8 2-6 2 2h5" {...s}/></>,
    flask:    <><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3" {...s}/></>,
    link:     <><path d="M10 14a4 4 0 0 1 0-6l3-3a4 4 0 0 1 6 6l-1 1M14 10a4 4 0 0 1 0 6l-3 3a4 4 0 0 1-6-6l1-1" {...s}/></>,
    home:     <><path d="M3 12l9-9 9 9M5 10v10h14V10" {...s}/></>,
    megaphone:<><path d="M3 11v2l14 5V6zM17 8v8M21 10v2" {...s}/></>,
    canvas:   <><rect x="3" y="3" width="18" height="18" rx="2" {...s}/><path d="M3 9h18M9 3v18" {...s}/></>,
    chart:    <><path d="M3 3v18h18M7 15l4-6 4 3 5-8" {...s}/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" {...s}/><path d="M3 9h18M8 3v4M16 3v4" {...s}/></>,
    caret:    <><path d="M6 9l6 6 6-6" {...s}/></>,
    check:    <><circle cx="12" cy="12" r="9" {...s}/><path d="M8 12l3 3 5-6" {...s}/></>,
    info:     <><circle cx="12" cy="12" r="9" {...s}/><path d="M12 8v1M12 12v4" {...s}/></>,
    warn:     <><path d="M12 3l10 18H2z" {...s}/><path d="M12 10v5M12 18v0.5" {...s}/></>,
    sparkle:  <><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" {...s}/></>,
    arrow_up: <><path d="M7 14l5-5 5 5" {...s}/></>,
    arrow_dn: <><path d="M7 10l5 5 5-5" {...s}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

function AvatarDot({ initials='DP', size=32, hue=120 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:`linear-gradient(135deg, oklch(78% 0.08 ${hue}), oklch(55% 0.05 ${hue}))`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'oklch(22% 0.03 120)', fontSize:size*0.38, fontWeight:600,
      border:'1.5px solid oklch(85% 0.02 120 / 0.6)', flexShrink:0,
    }}>{initials}</div>
  );
}

// ───── Sidebar ─────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="liquid-glass" style={{
      width:220, flexShrink:0,
      background:'var(--surface)',
      backdropFilter:'blur(30px)',
      border:'1px solid var(--line)',
      borderRadius:24,
      padding:'18px 14px',
      position:'sticky', top:20, alignSelf:'flex-start',
      height:'calc(100vh - 40px)',
    }}>
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:18, height:'100%' }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'4px 8px' }}>
        <svg width="32" height="32" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="lg2" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="oklch(80% 0.15 130)" />
            </linearGradient>
          </defs>
          <path d="M 6 32 C 6 18, 14 6, 28 6 L 34 6 C 34 20, 26 34, 12 34 L 6 34 Z" fill="url(#lg2)" />
          <circle cx="26" cy="14" r="2.4" fill="oklch(30% 0.05 115)" />
        </svg>
        <div>
          <div style={{ fontSize:16, fontWeight:600, letterSpacing:-0.3, lineHeight:1 }}>Galton</div>
          <div style={{ fontSize:10, color:'var(--ink-soft)', marginTop:3 }}>by Finch</div>
        </div>
      </div>

      {/* Sections */}
      {SIDEBAR.map(sec => (
        <div key={sec.section}>
          <div className="mono" style={{ fontSize:10, color:'var(--ink-soft)', letterSpacing:1.2, padding:'0 8px 6px', fontWeight:500 }}>
            {sec.section}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
            {sec.items.map(it => (
              <button key={it.label} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 10px', borderRadius:10, fontSize:13,
                background: it.active ? 'oklch(94% 0.015 125 / 0.7)' : 'transparent',
                color: it.active ? 'var(--ink)' : 'var(--ink-2)',
                fontWeight: it.active ? 600 : 400,
                textAlign:'left', width:'100%',
                border: it.active ? '1px solid var(--line)' : '1px solid transparent',
              }}>
                <Icon name={it.icon} size={15} />
                <span style={{ flex:1 }}>{it.label}</span>
                {it.badge && <span className="mono" style={{
                  fontSize:10, padding:'1px 6px', borderRadius:10,
                  background:'var(--surface-3)', color:'var(--ink-soft)',
                }}>{it.badge}</span>}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ flex:1 }} />

      {/* User */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px',
        borderTop:'1px solid var(--line)', paddingTop:14 }}>
        <AvatarDot initials="DP" hue={140} size={32} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:600 }}>Daniel P.</div>
          <div style={{ fontSize:10.5, color:'var(--ink-soft)' }}>Owner</div>
        </div>
        <Icon name="caret" size={14} />
      </div>
      </div>
    </aside>
  );
}

// ───── Header ──────────────────────────────────────────────────────
function Header() {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0 22px' }}>
      <div>
        <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.3, color:'#fff' }}>Overview</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', marginTop:2, fontWeight:400, letterSpacing:0 }}>Daily business health check</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <button style={{
          display:'flex', alignItems:'center', gap:8,
          background:'var(--surface-3)', border:'1px solid var(--line)',
          borderRadius:100, padding:'8px 14px', fontSize:12.5, fontWeight:500,
          backdropFilter:'blur(10px)',
          color:'#fff',
        }}>
          <Icon name="calendar" size={14} />
          Jan 15 – Apr 15, 2026
        </button>
        <button style={{
          display:'flex', alignItems:'center', gap:8,
          background:'var(--surface-3)', border:'1px solid var(--line)',
          borderRadius:100, padding:'8px 14px', fontSize:12.5, fontWeight:500,
          backdropFilter:'blur(10px)',
          color:'#fff',
        }}>
          vs. Prior period <Icon name="caret" size={12} />
        </button>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:'oklch(92% 0.20 115 / 0.15)', border:'1px solid oklch(92% 0.18 115 / 0.4)',
          borderRadius:100, padding:'8px 14px', fontSize:12.5, fontWeight:500,
        }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 6px var(--accent-glow)' }} />
          All 5 sources synced
        </div>
      </div>
    </div>
  );
}

// ───── KPI tile ────────────────────────────────────────────────────
function KPITile({ kpi }) {
  const isDown = kpi.trend === 'down';
  const deltaColor = (kpi.label === 'Total Ad Spend' && isDown) || (kpi.trend === 'up') ? 'var(--ink)' : 'var(--ink-soft)';
  return (
    <div className="liquid-glass" style={{
      background:'var(--surface-2)',
      backdropFilter:'blur(30px)',
      border: kpi.active ? '1.5px solid var(--accent)' : '1px solid var(--line)',
      boxShadow: kpi.active ? '0 0 0 3px var(--accent-glow), 0 8px 24px oklch(20% 0 0 / 0.1)' : 'none',
      borderRadius:20,
      padding:'16px 18px',
      position:'relative',
      minHeight:110,
    }}>
      <div style={{ position:'relative', zIndex:1 }}>
      <div className="mono" style={{ fontSize:10.5, color:'var(--ink-2)', letterSpacing:1.3, textTransform:'uppercase', fontWeight:600 }}>
        {kpi.label}
      </div>
      <div style={{ fontSize:30, fontWeight:300, letterSpacing:-1.2, marginTop:6, lineHeight:1 }}>
        {kpi.value}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8, fontSize:11, color:deltaColor, fontWeight:500 }}>
        <Icon name={isDown ? 'arrow_dn' : 'arrow_up'} size={12} />
        {kpi.delta}
      </div>
      {kpi.note && (
        <div style={{ fontSize:10.5, color:'var(--ink-soft)', marginTop:4 }}>{kpi.note}</div>
      )}
      {kpi.status && (
        <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:4, fontSize:11,
          color:'oklch(50% 0.12 140)' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'oklch(70% 0.15 140)' }} />
          {kpi.status}
        </div>
      )}
      </div>
    </div>
  );
}

// ───── Panels ──────────────────────────────────────────────────────
function Panel({ children, style }) {
  return (
    <div className="liquid-glass" style={{
      background:'var(--surface-2)',
      backdropFilter:'blur(30px)',
      border:'1px solid var(--line)',
      borderRadius:20,
      padding:20,
      position:'relative',
      ...style,
    }}>
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
}

function TrendPanel() {
  return (
    <Panel>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600 }}>MER & CMER Trend</div>
          <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }} className="serif">Last 12 weeks with comparison</div>
        </div>
        <div style={{ display:'flex', gap:14, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:14, height:2, background:'var(--accent)', borderRadius:1, boxShadow:'0 0 6px var(--accent-glow)' }}/>
            Blended MER
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:14, height:2, background:'var(--ink-2)', borderRadius:1 }}/>
            CMER
          </span>
        </div>
      </div>
      <LineChart width={640} height={230} series={MER_SERIES} xLabels={WEEKS} yTicks={[0,2,4,6]} />
    </Panel>
  );
}

function InsightsPanel() {
  const toneBg = { good:'oklch(94% 0.15 105 / 0.18)', warn:'oklch(80% 0.02 170 / 0.35)', info:'oklch(70% 0.015 180 / 0.3)' };
  const toneBd = { good:'oklch(94% 0.18 105 / 0.5)',  warn:'oklch(60% 0.015 170 / 0.4)', info:'oklch(55% 0.015 180 / 0.35)' };
  const toneIc = { good:'check', warn:'warn', info:'info' };
  return (
    <Panel>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:8, background:'var(--surface-3)',
          border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--accent)' }}>
          <Icon name="sparkle" size={13} />
        </div>
        <div style={{ fontSize:15, fontWeight:600 }}>Galton Insights</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {INSIGHTS.map((ins, i) => (
          <div key={i} style={{
            background:toneBg[ins.tone], border:`1px solid ${toneBd[ins.tone]}`,
            borderRadius:14, padding:'10px 12px',
            display:'flex', gap:10,
          }}>
            <div style={{ color:'var(--ink)', flexShrink:0, paddingTop:1 }}>
              <Icon name={toneIc[ins.tone]} size={14} />
            </div>
            <div style={{ fontSize:12, lineHeight:1.5 }}>
              <span style={{ fontWeight:600 }}>{ins.title}</span> <span style={{ color:'var(--ink-2)' }}>{ins.body}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function RevenuePanel() {
  return (
    <Panel>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600 }}>Revenue vs. Spend</div>
          <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }} className="serif">Weekly by channel — last 12 weeks</div>
        </div>
        <div style={{ display:'flex', gap:14, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:14, height:2, background:'var(--accent)', borderRadius:1 }}/>
            Revenue
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:14, height:2, background:'oklch(78% 0.03 40)', borderRadius:1, backgroundImage:'repeating-linear-gradient(90deg, oklch(78% 0.03 40), oklch(78% 0.03 40) 3px, transparent 3px, transparent 6px)' }}/>
            Total Spend
          </span>
        </div>
      </div>
      <LineChart width={640} height={230} series={REV_SPEND} xLabels={WEEKS} yTicks={[10000,30000,50000,70000]} />
    </Panel>
  );
}

function NewReturningPanel() {
  return (
    <Panel>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div>
          <div style={{ fontSize:15, fontWeight:600 }}>New vs. Returning Revenue</div>
          <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }} className="serif">Weekly split</div>
        </div>
        <div style={{ display:'flex', gap:14, fontSize:11 }}>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:10, height:10, background:'var(--accent)', borderRadius:2 }}/>New
          </span>
          <span style={{ display:'flex', alignItems:'center', gap:5 }}>
            <span style={{ width:10, height:10, background:'var(--ink-2)', opacity:0.5, borderRadius:2 }}/>Returning
          </span>
        </div>
      </div>
      <StackedBars width={640} height={230}
        groups={STACKED}
        stackKeys={[
          { key:'ret',  color:'var(--ink)'  },
          { key:'new_', color:'var(--accent)' },
        ]}
        xLabels={WEEKS}
        yTicks={[10000,30000,50000,70000]}
      />
    </Panel>
  );
}

// ───── Root ────────────────────────────────────────────────────────
function App() {
  const [tweaks, setTweaks] = (window.useTweaks || ((d) => [d, () => {}]))(
    /*EDITMODE-BEGIN*/{
      "accentHue": 115,
      "surfaceHue": 170,
      "surfaceOpacity": 45,
      "bgHue": 155,
      "bgLightness": 64,
      "bgChroma": 25,
      "inkMode": "light",
      "liquidGlass": true,
      "liquidGlassIntensity": 17,
      "liquidGlassTint": 0,
      "liquidGlassBlur": 2,
      "liquidGlassSheen": 6,
      "liquidGlassSheenAngle": -55
    }/*EDITMODE-END*/
  );

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', `oklch(94% 0.19 ${tweaks.accentHue})`);
    r.setProperty('--accent-glow', `oklch(94% 0.19 ${tweaks.accentHue} / 0.35)`);
    r.setProperty('--accent-ink', `oklch(30% 0.10 ${tweaks.accentHue})`);
    r.setProperty('--surface', `oklch(78% 0.012 ${tweaks.surfaceHue} / ${tweaks.surfaceOpacity/100})`);
    r.setProperty('--surface-2', `oklch(82% 0.01 ${tweaks.surfaceHue} / ${Math.max(0.15, tweaks.surfaceOpacity/100 - 0.1)})`);
    r.setProperty('--surface-3', `oklch(86% 0.008 ${tweaks.surfaceHue} / ${Math.max(0.1, tweaks.surfaceOpacity/100 - 0.15)})`);
    r.setProperty('--bg-outer', `oklch(${tweaks.bgLightness}% ${tweaks.bgChroma/1000} ${tweaks.bgHue})`);
    r.setProperty('--bg-field', `oklch(${Math.max(20, tweaks.bgLightness-4)}% ${tweaks.bgChroma/1000} ${tweaks.bgHue})`);
    r.setProperty('--lg-intensity', String(tweaks.liquidGlassIntensity / 100));
    r.setProperty('--lg-tint', String(tweaks.liquidGlassTint / 100));
    r.setProperty('--lg-blur', `${tweaks.liquidGlassBlur}px`);
    r.setProperty('--lg-sheen', String(tweaks.liquidGlassSheen / 100));
    r.setProperty('--lg-sheen-angle', `${tweaks.liquidGlassSheenAngle}deg`);
    document.documentElement.dataset.lg = tweaks.liquidGlass ? 'on' : 'off';
    // Ink mode: flip text + line/dot/label colors between dark (default) and white
    if (tweaks.inkMode === 'light') {
      r.setProperty('--ink', 'oklch(98% 0.004 230)');
      r.setProperty('--ink-2', 'oklch(92% 0.005 230)');
      r.setProperty('--ink-soft', 'oklch(88% 0.005 230 / 0.85)');
      r.setProperty('--tick', 'oklch(98% 0.004 200 / 0.9)');
      r.setProperty('--tick-dim', 'oklch(98% 0.004 200 / 0.45)');
      r.setProperty('--line', 'oklch(95% 0.004 200 / 0.25)');
      r.setProperty('--line-2', 'oklch(95% 0.004 200 / 0.45)');
    } else {
      r.setProperty('--ink', 'oklch(22% 0.01 230)');
      r.setProperty('--ink-2', 'oklch(32% 0.01 230)');
      r.setProperty('--ink-soft', 'oklch(42% 0.01 230 / 0.95)');
      r.setProperty('--tick', 'oklch(94% 0.004 200 / 0.85)');
      r.setProperty('--tick-dim', 'oklch(94% 0.004 200 / 0.4)');
      r.setProperty('--line', 'oklch(55% 0.008 200 / 0.22)');
      r.setProperty('--line-2', 'oklch(55% 0.008 200 / 0.4)');
    }
  }, [tweaks]);

  const T = window.TweaksPanel;
  const TS = window.TweakSection;
  const TSl = window.TweakSlider;
  const TRa = window.TweakRadio;

  return (
    <div style={{
      minHeight:'100vh',
      background:`
        radial-gradient(ellipse 900px 600px at 80% 20%, oklch(70% 0.025 105 / 0.35), transparent 60%),
        radial-gradient(ellipse 700px 500px at 15% 90%, oklch(65% 0.02 170 / 0.3), transparent 60%),
        var(--bg-outer)
      `,
      padding:20,
      display:'flex', gap:20,
    }} data-screen-label="Galton Overview">
      <Sidebar />
      <main style={{ flex:1, minWidth:0 }}>
        <Header />
        {/* KPI grid: 4 cols x 2 rows */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
          {KPIS.map(k => <KPITile key={k.label} kpi={k} />)}
        </div>
        {/* Trend + Insights */}
        <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:14, marginTop:14 }}>
          <TrendPanel />
          <InsightsPanel />
        </div>
        {/* Revenue + New/Returning */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
          <RevenuePanel />
          <NewReturningPanel />
        </div>
      </main>

      {T && (
        <T title="Tweaks">
          <TS label="Color">
            <TSl label="Accent hue" value={tweaks.accentHue} min={40} max={320} step={5} onChange={(v) => setTweaks('accentHue', v)} />
            <TSl label="Surface hue" value={tweaks.surfaceHue} min={60} max={260} step={5} onChange={(v) => setTweaks('surfaceHue', v)} />
            <TSl label="Surface opacity" value={tweaks.surfaceOpacity} min={20} max={90} onChange={(v) => setTweaks('surfaceOpacity', v)} />
          </TS>
          <TS label="Background">
            <TSl label="Hue" value={tweaks.bgHue} min={0} max={360} step={5} onChange={(v) => setTweaks('bgHue', v)} />
            <TSl label="Lightness" value={tweaks.bgLightness} min={8} max={96} onChange={(v) => setTweaks('bgLightness', v)} />
            <TSl label="Saturation" value={tweaks.bgChroma} min={0} max={200} onChange={(v) => setTweaks('bgChroma', v)} />
          </TS>
          <TS label="Liquid glass">
            {window.TweakToggle && <window.TweakToggle label="Enabled" value={tweaks.liquidGlass} onChange={(v) => setTweaks('liquidGlass', v)} />}
            <TSl label="Intensity" value={tweaks.liquidGlassIntensity} min={0} max={100} onChange={(v) => setTweaks('liquidGlassIntensity', v)} />
            <TSl label="Opacity" value={tweaks.liquidGlassTint} min={0} max={80} onChange={(v) => setTweaks('liquidGlassTint', v)} />
            <TSl label="Frost" value={tweaks.liquidGlassBlur} min={0} max={40} unit="px" onChange={(v) => setTweaks('liquidGlassBlur', v)} />
            <TSl label="Sheen" value={tweaks.liquidGlassSheen} min={0} max={90} onChange={(v) => setTweaks('liquidGlassSheen', v)} />
            <TSl label="Sheen angle" value={tweaks.liquidGlassSheenAngle} min={-180} max={180} step={5} unit="°" onChange={(v) => setTweaks('liquidGlassSheenAngle', v)} />
          </TS>
          <TS label="Text & graph ink">
            {TRa && <TRa label="Ink mode" value={tweaks.inkMode} options={['dark','light']} onChange={(v) => setTweaks('inkMode', v)} />}
          </TS>
        </T>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
