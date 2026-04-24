// Galton v2 — Daily business health check dashboard
// Sage-glass + chartreuse aesthetic, left sidebar nav, KPI tiles + trend charts + insights.

const { useState, useEffect, useMemo, useRef } = React;

// ───── Data: Overview ─────────────────────────────────────────────
const KPIS = [
  { id:'mer',    label:'Blended MER', value:'5.8x',  delta:'+0.4x vs prior', trend:'up',   note:'Revenue / Ad Spend' },
  { id:'cmer',   label:'CMER',        value:'2.3x',  delta:'+0.2x vs prior', trend:'up',   note:'Contribution Margin / Spend', active:true },
  { id:'cm',     label:'Contribution Margin', value:'$142K', delta:'+12% vs prior', trend:'up',  note:'Revenue − COGS − Discounts' },
  { id:'spend',  label:'Total Ad Spend', value:'$61.9K', delta:'−3% vs prior', trend:'down', note:'Meta + Google + TikTok + Amazon' },
  { id:'orders', label:'Orders', value:'1,847', delta:'+8% vs prior', trend:'up' },
  { id:'aov',    label:'AOV', value:'$127', delta:'+$4 vs prior', trend:'up' },
  { id:'cac',    label:'New Customer CAC', value:'$48', delta:'−$6 vs prior', trend:'up' },
  { id:'ltvcac', label:'LTV : CAC', value:'3.2x', delta:'+0.3x vs prior', trend:'up', status:'Healthy' },
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
  { key:'Total Spend', color:'#fff', dashed:true,
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

// ───── Data: Channel Intelligence ────────────────────────────────
const CHANNEL_KPIS = [
  { id:'meta',   label:'Meta',        value:'3.1x',  delta:'+0.2x vs prior', trend:'up',   note:'iROAS (incremental)' },
  { id:'google', label:'Google Ads',  value:'1.2x',  delta:'−0.3x vs prior', trend:'down', note:'iROAS — near saturation' },
  { id:'tiktok', label:'TikTok',      value:'2.9x',  delta:'+0.8x vs prior', trend:'up',   note:'iROAS — underinvested', active:true },
  { id:'amazon', label:'Amazon Ads',  value:'1.8x',  delta:'+0.1x vs prior', trend:'up',   note:'iROAS' },
];
const CHANNEL_CONTRIB = WEEKS.map((w,i) => ({
  key:w,
  values:{
    meta:   14000 + Math.sin(i/2)*2000 + i*400,
    google:  9000 + Math.cos(i/3)*1500 + i*200,
    tiktok:  6000 + Math.sin(i/1.5)*1800 + i*500,
    amazon:  4000 + Math.cos(i/2.5)*800  + i*180,
  }
}));
const SATURATION_CURVES = [
  { key:'Meta',    color:'oklch(88% 0.03 170)',
    values:[0,0.5,0.95,1.4,1.8,2.2,2.5,2.8,3.0,3.1,3.15,3.18] },
  { key:'Google',  color:'oklch(62% 0.03 170)',
    values:[0,0.4,0.75,1.0,1.15,1.2,1.22,1.23,1.235,1.24,1.24,1.24] },
  { key:'TikTok',  color:'var(--accent)', glow:true,
    values:[0,0.5,1.0,1.5,2.0,2.5,2.8,2.9,2.95,2.98,3.0,3.0] },
];
const CHANNEL_INSIGHTS = [
  { tone:'good',  title:'TikTok is your best incremental channel.', body:'iROAS 2.9x with room to scale. Shift +$5K/mo from Google.' },
  { tone:'warn',  title:'Google Ads saturated.', body:'Marginal iROAS 1.2x — below CMER break-even (1.0x after margin).' },
  { tone:'info',  title:'Amazon has low attribution confidence.', body:'Set up GA4 for Amazon attribution tracking.' },
];

// ───── Data: Customer Health ─────────────────────────────────────
const CUSTOMER_KPIS = [
  { id:'ltv',       label:'Avg LTV (12mo)',   value:'$412', delta:'+$24 vs prior', trend:'up', note:'Predicted 12-month value' },
  { id:'ccac',      label:'CAC',              value:'$48',  delta:'−$6 vs prior',   trend:'up',   note:'New customer acquisition cost' },
  { id:'ltvcac2',   label:'LTV : CAC',        value:'8.6x', delta:'+1.1x vs prior', trend:'up', note:'> 3x is healthy', active:true },
  { id:'repeat',    label:'Repeat Rate',      value:'28%',  delta:'+3% vs prior',  trend:'up',   note:'Customers with 2+ orders' },
  { id:'new_share', label:'New Customer %',   value:'42%',  delta:'−2% vs prior',  trend:'down', note:'Revenue from new customers' },
  { id:'churn',     label:'90-day Churn',     value:'18%',  delta:'−2% vs prior',   trend:'up',  note:'Lower is better' },
  { id:'aov2',      label:'New Customer AOV', value:'$89',  delta:'+$4 vs prior',  trend:'up' },
  { id:'reord',     label:'Days to Reorder',  value:'47',   delta:'−3 days',        trend:'up' },
];
const LTV_DISTRIBUTION = {
  bins: ['$0', '$100', '$250', '$500', '$1K', '$2K', '$5K+'],
  values: [320, 520, 410, 280, 160, 80, 30],
};
const COHORT_RETENTION = [
  { cohort:'Jan', months:[100, 42, 28, 22, 18, 16, 14, 12] },
  { cohort:'Feb', months:[100, 45, 31, 25, 21, 18, 15] },
  { cohort:'Mar', months:[100, 48, 34, 27, 23, 20] },
  { cohort:'Apr', months:[100, 52, 38, 31, 26] },
  { cohort:'May', months:[100, 55, 41, 33] },
  { cohort:'Jun', months:[100, 58, 44] },
];
const CUSTOMER_INSIGHTS = [
  { tone:'good',  title:'LTV:CAC is exceptional.', body:'8.6x ratio puts you in the top decile. Room to spend more on acquisition.' },
  { tone:'info',  title:'Repeat rate trending up.', body:'3% increase over 90 days — retention initiatives are working.' },
  { tone:'warn',  title:'New customer % declining.', body:'Rebalance spend toward acquisition-focused channels if growth is the priority.' },
];

// ───── Data: Experiment Lab ──────────────────────────────────────
const EXP_KPIS = [
  { id:'active',  label:'Active Experiments', value:'3',    delta:'+1 vs prior', trend:'up', note:'Currently running' },
  { id:'complete',label:'Completed',          value:'12',   delta:'+4 vs prior', trend:'up', note:'Last 90 days' },
  { id:'lift',    label:'Avg Incremental Lift', value:'+18%', delta:'+3% vs prior', trend:'up', note:'Across completed tests', active:true },
  { id:'conf',    label:'Avg Confidence',     value:'92%',  delta:'stable',       trend:'up', note:'Statistical confidence' },
];
const EXPERIMENTS = [
  { name:'Meta ad killed (audience X)', pattern:'anchor', lift:-12, confidence:97, status:'complete',
    body:'Revenue dropped immediately and sustained. This ad was doing real work.' },
  { name:'Google brand pause', pattern:'waste', lift:+8, confidence:89, status:'complete',
    body:'Revenue went UP after killing. Branded traffic was cannibalizing organic.' },
  { name:'TikTok creative swap', pattern:'priming', lift:+4, confidence:81, status:'complete',
    body:'Short positive spike then normalized. Old creative was priming other channels.' },
  { name:'Amazon DSP launch', pattern:'delayed_drag', lift:-3, confidence:78, status:'complete',
    body:'Held flat for 2 weeks then dropped. Adstock carryover running out.' },
  { name:'Klaviyo flow A/B',    pattern:'irrelevant', lift:+1, confidence:42, status:'running',
    body:'No significant change yet. 2 weeks until enough data.' },
];
const SYNTHETIC_CONTROL = {
  actual:         [42, 45, 48, 46, 49, 52, 50, 48, 42, 38, 35, 32],
  counterfactual: [42, 45, 48, 46, 49, 52, 50, 48, 50, 51, 52, 53],
};
const EXP_INSIGHTS = [
  { tone:'good',  title:'Most recent test: Meta ad kill confirmed as anchor.', body:'Revenue dropped $4,200 against counterfactual. Keep the ad running.' },
  { tone:'warn',  title:'Google brand pause flagged as waste.', body:'Revenue rose after killing — consider permanently pausing.' },
  { tone:'info',  title:'1 experiment still collecting data.', body:'Klaviyo flow A/B needs 2 more weeks for significance.' },
];

// ───── Data: Connections ─────────────────────────────────────────
const CONNECTIONS = [
  { platform:'Shopify',    status:'connected', lastSync:'2 min ago',  dataPoints:'1,847 orders',  tier:'accent',   icon:'Sh' },
  { platform:'Meta Ads',   status:'connected', lastSync:'5 min ago',  dataPoints:'$18.2K spend',  tier:'sage-1',   icon:'M' },
  { platform:'Google Ads', status:'connected', lastSync:'6 min ago',  dataPoints:'$15.8K spend',  tier:'sage-2',   icon:'G' },
  { platform:'TikTok',     status:'connected', lastSync:'4 min ago',  dataPoints:'$12.4K spend',  tier:'accent',   icon:'T' },
  { platform:'GA4',        status:'connected', lastSync:'8 min ago',  dataPoints:'28,491 sessions', tier:'sage-1', icon:'GA' },
  { platform:'Amazon Ads', status:'error',     lastSync:'3 days ago', dataPoints:'Token expired',  tier:'sage-2',  icon:'Am' },
  { platform:'Klaviyo',    status:'disconnected', lastSync:'—',        dataPoints:'Not connected',  tier:'sage-3',  icon:'K' },
];

const PLATFORM_TILE_BG = {
  'accent':  'linear-gradient(135deg, oklch(94% 0.19 115), oklch(78% 0.16 115))',
  'sage-1':  'linear-gradient(135deg, oklch(88% 0.03 170), oklch(68% 0.03 170))',
  'sage-2':  'linear-gradient(135deg, oklch(75% 0.02 170), oklch(55% 0.02 170))',
  'sage-3':  'linear-gradient(135deg, oklch(60% 0.02 170), oklch(45% 0.01 170))',
};

const SIDEBAR = [
  { section:'GALTON', items:[
    { id:'overview', label:'Overview', icon:'grid' },
    { id:'channel',  label:'Channel Intelligence', icon:'channel' },
    { id:'customer', label:'Customer Health', icon:'health' },
    { id:'experiment', label:'Experiment Lab', icon:'flask' },
    { id:'connections', label:'Connections', icon:'link', badge:7 },
  ]},
  { section:'FINCH', items:[
    { id:'finch-dashboard', label:'Dashboard', icon:'home', disabled:true },
    { id:'finch-campaigns', label:'Campaigns', icon:'megaphone', disabled:true },
    { id:'finch-canvas', label:'Canvas', icon:'canvas', disabled:true },
    { id:'finch-analytics', label:'Analytics', icon:'chart', disabled:true },
  ]},
];

const VIEW_META = {
  overview:   { title:'Overview',              subtitle:'Daily business health check' },
  channel:    { title:'Channel Intelligence',  subtitle:'Incrementality, saturation & marginal ROAS' },
  customer:   { title:'Customer Health',       subtitle:'LTV, retention & cohort analysis' },
  experiment: { title:'Experiment Lab',        subtitle:'Causal impact analysis of interventions' },
  connections:{ title:'Connections',           subtitle:'Data source sync status' },
};

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
    x:        <><path d="M6 6l12 12M18 6L6 18" {...s}/></>,
    refresh:  <><path d="M21 12a9 9 0 1 1-3-6.7M21 3v6h-6" {...s}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>;
}

function AvatarDot({ initials='DP', size=32 }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      background:'linear-gradient(135deg, oklch(82% 0.03 170), oklch(60% 0.03 170))',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'oklch(22% 0.03 170)', fontSize:size*0.38, fontWeight:600,
      border:'1.5px solid oklch(95% 0.01 170 / 0.4)', flexShrink:0,
    }}>{initials}</div>
  );
}

// ───── Sidebar ─────────────────────────────────────────────────────
function Sidebar({ activeView, onNav }) {
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
              <stop offset="100%" stopColor="oklch(80% 0.15 115)" />
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
            {sec.items.map(it => {
              const isActive = activeView === it.id;
              return (
                <button key={it.id}
                  onClick={() => !it.disabled && onNav(it.id)}
                  disabled={it.disabled}
                  className="nav-item"
                  style={{
                    display:'flex', alignItems:'center', gap:10,
                    padding:'8px 10px', borderRadius:10, fontSize:13,
                    background: isActive ? 'oklch(94% 0.015 115 / 0.7)' : 'transparent',
                    color: isActive ? 'var(--ink)' : 'var(--ink-2)',
                    fontWeight: isActive ? 600 : 400,
                    textAlign:'left', width:'100%',
                    border: isActive ? '1px solid var(--line)' : '1px solid transparent',
                    opacity: it.disabled ? 0.5 : 1,
                    cursor: it.disabled ? 'not-allowed' : 'pointer',
                }}>
                  <Icon name={it.icon} size={15} />
                  <span style={{ flex:1 }}>{it.label}</span>
                  {it.badge && <span className="mono" style={{
                    fontSize:10, padding:'1px 6px', borderRadius:10,
                    background:'var(--surface-3)', color:'var(--ink-soft)',
                  }}>{it.badge}</span>}
                  {it.disabled && <span style={{ fontSize:9, color:'var(--ink-soft)' }}>soon</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ flex:1 }} />

      {/* User */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px',
        borderTop:'1px solid var(--line)', paddingTop:14 }}>
        <AvatarDot initials="DP" size={32} />
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

// ───── Popover (used for date picker, period dropdown) ─────────────
function Popover({ open, onClose, children, align='right' }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position:'fixed', inset:0, zIndex:40,
      }}/>
      <div className="liquid-glass" style={{
        position:'absolute', top:'calc(100% + 6px)', [align]:0, zIndex:41,
        background:'var(--surface-2)', border:'1px solid var(--line)',
        borderRadius:14, padding:8, minWidth:220, backdropFilter:'blur(30px)',
      }}>
        <div style={{ position:'relative', zIndex:1 }}>{children}</div>
      </div>
    </>
  );
}

// ───── Header ──────────────────────────────────────────────────────
const DATE_RANGES = [
  'Last 7 days', 'Last 30 days', 'Last 90 days', 'Last 6 months',
  'Last 12 months', 'Year to date', 'Custom range',
];
const COMPARE_OPTIONS = [
  'vs. Prior period', 'vs. Same period last year', 'vs. No comparison',
];

function Header({ viewMeta }) {
  const [dateOpen, setDateOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [dateRange, setDateRange] = useState('Jan 15 – Apr 15, 2026');
  const [compare, setCompare] = useState('vs. Prior period');

  return (
    <div className="gl-fade" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0 22px' }}>
      <div>
        <div style={{ fontSize:22, fontWeight:600, letterSpacing:-0.3, color:'#fff' }}>{viewMeta.title}</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.65)', marginTop:2, fontWeight:400, letterSpacing:0 }}>{viewMeta.subtitle}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Date range */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setDateOpen(o => !o)} className="pill-hover" style={{
            display:'flex', alignItems:'center', gap:8,
            background:'var(--surface-3)', border:'1px solid var(--line)',
            borderRadius:100, padding:'8px 14px', fontSize:12.5, fontWeight:500,
            backdropFilter:'blur(10px)', color:'#fff',
          }}>
            <Icon name="calendar" size={14} />
            {dateRange}
          </button>
          <Popover open={dateOpen} onClose={() => setDateOpen(false)}>
            <div className="mono" style={{ fontSize:9.5, color:'var(--ink-soft)', padding:'4px 10px 6px', letterSpacing:1 }}>DATE RANGE</div>
            {DATE_RANGES.map(r => (
              <button key={r} onClick={() => { setDateRange(r === 'Custom range' ? dateRange : r); setDateOpen(false); }}
                style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'8px 10px', borderRadius:8, fontSize:13,
                  background: r === dateRange ? 'oklch(94% 0.015 115 / 0.5)' : 'transparent',
                  color:'var(--ink)', fontWeight: r === dateRange ? 600 : 400,
                  cursor:'pointer',
                }}>
                {r}
              </button>
            ))}
          </Popover>
        </div>
        {/* Compare */}
        <div style={{ position:'relative' }}>
          <button onClick={() => setCompareOpen(o => !o)} className="pill-hover" style={{
            display:'flex', alignItems:'center', gap:8,
            background:'var(--surface-3)', border:'1px solid var(--line)',
            borderRadius:100, padding:'8px 14px', fontSize:12.5, fontWeight:500,
            backdropFilter:'blur(10px)', color:'#fff',
          }}>
            {compare} <Icon name="caret" size={12} />
          </button>
          <Popover open={compareOpen} onClose={() => setCompareOpen(false)}>
            <div className="mono" style={{ fontSize:9.5, color:'var(--ink-soft)', padding:'4px 10px 6px', letterSpacing:1 }}>COMPARE</div>
            {COMPARE_OPTIONS.map(o => (
              <button key={o} onClick={() => { setCompare(o); setCompareOpen(false); }}
                style={{
                  display:'block', width:'100%', textAlign:'left',
                  padding:'8px 10px', borderRadius:8, fontSize:13,
                  background: o === compare ? 'oklch(94% 0.015 115 / 0.5)' : 'transparent',
                  color:'var(--ink)', fontWeight: o === compare ? 600 : 400,
                  cursor:'pointer',
                }}>
                {o}
              </button>
            ))}
          </Popover>
        </div>
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
function KPITile({ kpi, selected, onClick, index=0 }) {
  const isDown = kpi.trend === 'down';
  const isActive = selected || kpi.active;
  const deltaColor = (kpi.label === 'Total Ad Spend' && isDown) || (kpi.trend === 'up') ? 'var(--ink)' : 'var(--ink-soft)';
  return (
    <div
      onClick={onClick}
      className={`liquid-glass gl-rise hover-raise-strong ${isActive ? 'kpi-active' : ''}`}
      style={{
      background:'var(--surface-2)',
      backdropFilter:'blur(30px)',
      border: isActive ? '1.5px solid var(--accent)' : '1px solid var(--line)',
      boxShadow: isActive ? '0 0 0 3px var(--accent-glow), 0 8px 24px oklch(20% 0 0 / 0.1)' : 'none',
      borderRadius:20,
      padding:'16px 18px',
      position:'relative',
      minHeight:110,
      cursor: onClick ? 'pointer' : 'default',
      transition:'border-color 180ms ease-out, box-shadow 240ms ease-out, transform 220ms cubic-bezier(0.22, 1, 0.36, 1), filter 220ms ease-out',
      animationDelay: `${index * 40}ms`,
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
          color:'var(--accent)' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--accent)',
            boxShadow:'0 0 6px var(--accent-glow)' }} />
          {kpi.status}
        </div>
      )}
      </div>
    </div>
  );
}

// ───── Panel ──────────────────────────────────────────────────────
function Panel({ children, style, delay=0 }) {
  return (
    <div className="liquid-glass gl-rise hover-raise" style={{
      background:'var(--surface-2)',
      backdropFilter:'blur(30px)',
      border:'1px solid var(--line)',
      borderRadius:20,
      padding:20,
      position:'relative',
      animationDelay: `${delay}ms`,
      ...style,
    }}>
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
}

function PanelHeader({ title, subtitle, right }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
      <div>
        <div style={{ fontSize:15, fontWeight:600 }}>{title}</div>
        {subtitle && <div style={{ fontSize:11, color:'var(--ink-2)', marginTop:2 }} className="serif">{subtitle}</div>}
      </div>
      {right}
    </div>
  );
}

// ───── Chart legend with click-toggle ──────────────────────────────
function ChartLegend({ series, hidden, onToggle }) {
  return (
    <div style={{ display:'flex', gap:14, fontSize:11, flexWrap:'wrap' }}>
      {series.map(s => {
        const isHidden = hidden.has(s.key);
        return (
          <button key={s.key}
            onClick={() => onToggle(s.key)}
            className="legend-item"
            style={{
              display:'flex', alignItems:'center', gap:5,
              background:'transparent', padding:0, cursor:'pointer',
              opacity: isHidden ? 0.35 : 1,
              textDecoration: isHidden ? 'line-through' : 'none',
            }}>
            <span style={{
              width:14, height:2, background: s.color, borderRadius:1,
              boxShadow: s.glow ? '0 0 6px var(--accent-glow)' : 'none',
              backgroundImage: s.dashed ? `repeating-linear-gradient(90deg, ${s.color}, ${s.color} 3px, transparent 3px, transparent 6px)` : undefined,
            }}/>
            {s.key}
          </button>
        );
      })}
    </div>
  );
}

// ───── Overview view ──────────────────────────────────────────────
function OverviewView({ selectedKpi, setSelectedKpi }) {
  const [hiddenMer, setHiddenMer] = useState(new Set());
  const [hiddenRev, setHiddenRev] = useState(new Set());
  const toggleSet = (set, setSet) => key => {
    const next = new Set(set);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSet(next);
  };
  const visibleMer = MER_SERIES.filter(s => !hiddenMer.has(s.key));
  const visibleRev = REV_SPEND.filter(s => !hiddenRev.has(s.key));

  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {KPIS.map((k, i) => <KPITile key={k.id} kpi={k} index={i}
          selected={selectedKpi === k.id}
          onClick={() => setSelectedKpi(selectedKpi === k.id ? null : k.id)} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:14, marginTop:14 }}>
        <Panel delay={340}>
          <PanelHeader title="MER & CMER Trend" subtitle="Last 12 weeks with comparison"
            right={<ChartLegend series={MER_SERIES} hidden={hiddenMer} onToggle={toggleSet(hiddenMer, setHiddenMer)} />} />
          <LineChart width={640} height={230} series={visibleMer} xLabels={WEEKS} yTicks={[0,2,4,6]} />
        </Panel>
        <InsightsPanel insights={INSIGHTS} delay={400} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
        <Panel delay={460}>
          <PanelHeader title="Revenue vs. Spend" subtitle="Weekly by channel — last 12 weeks"
            right={<ChartLegend series={REV_SPEND} hidden={hiddenRev} onToggle={toggleSet(hiddenRev, setHiddenRev)} />} />
          <LineChart width={640} height={230} series={visibleRev} xLabels={WEEKS} yTicks={[10000,30000,50000,70000]} />
        </Panel>
        <Panel delay={520}>
          <PanelHeader title="New vs. Returning Revenue" subtitle="Weekly split"
            right={<div style={{ display:'flex', gap:14, fontSize:11 }}>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:10, height:10, background:'var(--accent)', borderRadius:2 }}/>New</span>
              <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:10, height:10, background:'var(--ink-2)', opacity:0.5, borderRadius:2 }}/>Returning</span>
            </div>} />
          <StackedBars width={640} height={230} groups={STACKED}
            stackKeys={[{ key:'ret', color:'var(--ink)' }, { key:'new_', color:'var(--accent)' }]}
            xLabels={WEEKS} yTicks={[10000,30000,50000,70000]} />
        </Panel>
      </div>
    </>
  );
}

function InsightsPanel({ insights, delay=0 }) {
  const toneBg = { good:'oklch(94% 0.15 115 / 0.18)', warn:'oklch(80% 0.02 170 / 0.35)', info:'oklch(70% 0.015 170 / 0.3)' };
  const toneBd = { good:'oklch(94% 0.18 115 / 0.5)',  warn:'oklch(60% 0.015 170 / 0.4)', info:'oklch(55% 0.015 170 / 0.35)' };
  const toneIc = { good:'check', warn:'warn', info:'info' };
  return (
    <Panel delay={delay}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <div style={{ width:24, height:24, borderRadius:8, background:'var(--surface-3)',
          border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center',
          color:'var(--accent)' }}>
          <Icon name="sparkle" size={13} />
        </div>
        <div style={{ fontSize:15, fontWeight:600 }}>Galton Insights</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {insights.map((ins, i) => (
          <div key={i} className="insight-card gl-fade" style={{
            background:toneBg[ins.tone], border:`1px solid ${toneBd[ins.tone]}`,
            borderRadius:14, padding:'10px 12px',
            display:'flex', gap:10,
            animationDelay: `${delay + 100 + i*80}ms`,
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

// ───── Channel Intelligence view ──────────────────────────────────
function ChannelView({ selectedKpi, setSelectedKpi }) {
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {CHANNEL_KPIS.map((k, i) => <KPITile key={k.id} kpi={k} index={i}
          selected={selectedKpi === k.id}
          onClick={() => setSelectedKpi(selectedKpi === k.id ? null : k.id)} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="Channel Contribution" subtitle="Weekly spend allocation — last 12 weeks"
            right={<div style={{ display:'flex', gap:12, fontSize:11, flexWrap:'wrap' }}>
              {[
                {k:'meta',   c:'oklch(88% 0.03 170)', l:'Meta'},
                {k:'google', c:'oklch(72% 0.03 170)', l:'Google'},
                {k:'tiktok', c:'var(--accent)',       l:'TikTok'},
                {k:'amazon', c:'oklch(52% 0.02 170)', l:'Amazon'},
              ].map(s => (
                <span key={s.k} style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, background:s.c, borderRadius:2 }}/>{s.l}</span>
              ))}
            </div>} />
          <StackedBars width={640} height={230} groups={CHANNEL_CONTRIB}
            stackKeys={[
              { key:'meta',   color:'oklch(88% 0.03 170)' },
              { key:'google', color:'oklch(72% 0.03 170)' },
              { key:'tiktok', color:'var(--accent)' },
              { key:'amazon', color:'oklch(52% 0.02 170)' },
            ]}
            xLabels={WEEKS} yTicks={[10000,30000,50000,70000]} />
        </Panel>
        <InsightsPanel insights={CHANNEL_INSIGHTS} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="Saturation Curves" subtitle="iROAS as spend increases — where each channel tops out"
            right={<ChartLegend series={SATURATION_CURVES} hidden={new Set()} onToggle={() => {}} />} />
          <LineChart width={1280} height={240} series={SATURATION_CURVES}
            xLabels={['$0','$5k','$10k','$15k','$20k','$25k','$30k','$35k','$40k','$45k','$50k','$55k']}
            yTicks={[0,1,2,3]} />
        </Panel>
      </div>
    </>
  );
}

// ───── Customer Health view ───────────────────────────────────────
function CustomerView({ selectedKpi, setSelectedKpi }) {
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {CUSTOMER_KPIS.map((k, i) => <KPITile key={k.id} kpi={k} index={i}
          selected={selectedKpi === k.id}
          onClick={() => setSelectedKpi(selectedKpi === k.id ? null : k.id)} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.7fr 1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="LTV Distribution" subtitle="Predicted 12-month value per customer bucket" />
          <BarChart width={640} height={230} bins={LTV_DISTRIBUTION.bins} values={LTV_DISTRIBUTION.values} />
        </Panel>
        <InsightsPanel insights={CUSTOMER_INSIGHTS} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="Cohort Retention" subtitle="% of customers active by month since first purchase" />
          <CohortHeatmap data={COHORT_RETENTION} />
        </Panel>
      </div>
    </>
  );
}

// ───── Experiment Lab view ────────────────────────────────────────
function ExperimentView({ selectedKpi, setSelectedKpi }) {
  const patternColors = {
    anchor:       'var(--accent)',
    delayed_drag: 'oklch(75% 0.06 70)',
    waste:        'oklch(88% 0.03 170)',
    priming:      'oklch(90% 0.12 115)',
    irrelevant:   'var(--ink-soft)',
  };
  const patternLabel = { anchor:'Anchor', delayed_drag:'Delayed drag', waste:'Waste', priming:'Priming', irrelevant:'Irrelevant' };
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14 }}>
        {EXP_KPIS.map((k, i) => <KPITile key={k.id} kpi={k} index={i}
          selected={selectedKpi === k.id}
          onClick={() => setSelectedKpi(selectedKpi === k.id ? null : k.id)} />)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="Synthetic Control: Meta Ad Killed" subtitle="Actual vs. counterfactual revenue ($k)"
            right={<ChartLegend
              series={[
                { key:'Actual', color:'var(--accent)', glow:true },
                { key:'Counterfactual', color:'#fff', dashed:true },
              ]}
              hidden={new Set()} onToggle={() => {}}
            />} />
          <LineChart width={640} height={230}
            series={[
              { key:'Actual', color:'var(--accent)', glow:true, values:SYNTHETIC_CONTROL.actual },
              { key:'Counterfactual', color:'#fff', dashed:true, values:SYNTHETIC_CONTROL.counterfactual },
            ]}
            xLabels={WEEKS} yTicks={[0,20,40,60]} />
          <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:8, textAlign:'center' }} className="serif">
            Ad killed at W8 — revenue dropped while counterfactual held
          </div>
        </Panel>
        <InsightsPanel insights={EXP_INSIGHTS} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:14, marginTop:14 }}>
        <Panel>
          <PanelHeader title="Recent Experiments" subtitle="Causal impact of interventions — classified by pattern" />
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {EXPERIMENTS.map((exp, i) => (
              <div key={i} className="exp-row gl-fade" style={{
                display:'grid', gridTemplateColumns:'1.5fr 120px 80px 80px 1.8fr',
                gap:12, alignItems:'center',
                padding:'12px 14px', borderRadius:12,
                background:'var(--surface-3)', border:'1px solid var(--line)',
                cursor:'pointer',
                animationDelay: `${600 + i*60}ms`,
              }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{exp.name}</div>
                  <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>{exp.body}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11 }}>
                  <span style={{ width:8, height:8, borderRadius:'50%', background:patternColors[exp.pattern] }}/>
                  <span style={{ fontWeight:600 }}>{patternLabel[exp.pattern]}</span>
                </div>
                <div className="mono" style={{ fontSize:13, fontWeight:600,
                  color: exp.lift > 0 ? 'var(--accent)' : exp.lift < 0 ? 'oklch(75% 0.06 70)' : 'var(--ink-soft)' }}>
                  {exp.lift > 0 ? '+' : ''}{exp.lift}%
                </div>
                <div className="mono" style={{ fontSize:12, color:'var(--ink-2)' }}>{exp.confidence}%</div>
                <div style={{ fontSize:11, color:exp.status === 'complete' ? 'var(--accent)' : 'var(--ink-soft)' }}>
                  {exp.status === 'complete' ? '✓ Complete' : '⏳ Running'}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

// ───── Connections view ───────────────────────────────────────────
function ConnectionsView() {
  const statusColors = {
    connected:    { bg:'oklch(94% 0.15 115 / 0.18)', bd:'oklch(94% 0.18 115 / 0.5)', ink:'var(--accent)',   dot:'var(--accent)' },
    error:        { bg:'oklch(75% 0.06 70 / 0.25)',  bd:'oklch(75% 0.08 70 / 0.55)', ink:'oklch(88% 0.06 70)', dot:'oklch(75% 0.08 70)' },
    disconnected: { bg:'oklch(82% 0.01 170 / 0.25)', bd:'oklch(60% 0.01 170 / 0.4)', ink:'var(--ink-soft)', dot:'var(--ink-soft)' },
  };
  return (
    <>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14 }}>
        {CONNECTIONS.map((c, i) => {
          const s = statusColors[c.status];
          return (
            <div key={c.platform} className="liquid-glass gl-rise hover-raise-strong" style={{
              background:'var(--surface-2)', border:'1px solid var(--line)',
              borderRadius:20, padding:20, position:'relative',
              backdropFilter:'blur(30px)',
              animationDelay: `${i * 50}ms`,
            }}>
              <div style={{ position:'relative', zIndex:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:40, height:40, borderRadius:10,
                      background: PLATFORM_TILE_BG[c.tier] || PLATFORM_TILE_BG['sage-2'],
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'oklch(22% 0.03 170)', fontSize:14, fontWeight:700,
                      border:'1.5px solid oklch(95% 0.01 170 / 0.4)',
                    }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize:15, fontWeight:600 }}>{c.platform}</div>
                      <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>{c.dataPoints}</div>
                    </div>
                  </div>
                  <div style={{
                    display:'flex', alignItems:'center', gap:5,
                    background:s.bg, border:`1px solid ${s.bd}`,
                    borderRadius:100, padding:'4px 10px', fontSize:10.5, fontWeight:600,
                    color:s.ink, textTransform:'capitalize',
                  }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} />
                    {c.status}
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, paddingTop:14,
                  borderTop:'1px solid var(--line)' }}>
                  <div style={{ fontSize:11, color:'var(--ink-2)' }}>
                    Last synced: <span style={{ fontWeight:600, color:'var(--ink)' }}>{c.lastSync}</span>
                  </div>
                  <button className="pill-hover" style={{
                    display:'flex', alignItems:'center', gap:5,
                    fontSize:11, color:'var(--ink)', padding:'4px 10px', borderRadius:100,
                    background:'var(--surface-3)', border:'1px solid var(--line)', cursor:'pointer',
                  }}>
                    <Icon name={c.status === 'connected' ? 'refresh' : 'link'} size={11} />
                    {c.status === 'connected' ? 'Sync now' : c.status === 'error' ? 'Reconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ───── Root ────────────────────────────────────────────────────────
function App() {
  const [activeView, setActiveView] = useState('overview');
  const [selectedKpi, setSelectedKpi] = useState(null);

  // Reset KPI selection when switching views
  useEffect(() => { setSelectedKpi(null); }, [activeView]);

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
    if (tweaks.inkMode === 'light') {
      r.setProperty('--ink', 'oklch(98% 0.004 170)');
      r.setProperty('--ink-2', 'oklch(92% 0.005 170)');
      r.setProperty('--ink-soft', 'oklch(88% 0.005 170 / 0.85)');
      r.setProperty('--tick', 'oklch(98% 0.004 170 / 0.9)');
      r.setProperty('--tick-dim', 'oklch(98% 0.004 170 / 0.45)');
      r.setProperty('--line', 'oklch(95% 0.004 170 / 0.25)');
      r.setProperty('--line-2', 'oklch(95% 0.004 170 / 0.45)');
    } else {
      r.setProperty('--ink', 'oklch(22% 0.01 170)');
      r.setProperty('--ink-2', 'oklch(32% 0.01 170)');
      r.setProperty('--ink-soft', 'oklch(42% 0.01 170 / 0.95)');
      r.setProperty('--tick', 'oklch(94% 0.004 170 / 0.85)');
      r.setProperty('--tick-dim', 'oklch(94% 0.004 170 / 0.4)');
      r.setProperty('--line', 'oklch(55% 0.008 170 / 0.22)');
      r.setProperty('--line-2', 'oklch(55% 0.008 170 / 0.4)');
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
        radial-gradient(ellipse 900px 600px at 80% 20%, oklch(70% 0.025 115 / 0.35), transparent 60%),
        radial-gradient(ellipse 700px 500px at 15% 90%, oklch(65% 0.02 170 / 0.3), transparent 60%),
        var(--bg-outer)
      `,
      padding:20,
      display:'flex', gap:20,
    }} data-screen-label={`Galton ${VIEW_META[activeView].title}`}>
      <Sidebar activeView={activeView} onNav={setActiveView} />
      <main style={{ flex:1, minWidth:0 }}>
        <Header viewMeta={VIEW_META[activeView]} />
        {activeView === 'overview'    && <OverviewView    selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
        {activeView === 'channel'     && <ChannelView     selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
        {activeView === 'customer'    && <CustomerView    selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
        {activeView === 'experiment'  && <ExperimentView  selectedKpi={selectedKpi} setSelectedKpi={setSelectedKpi} />}
        {activeView === 'connections' && <ConnectionsView />}
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
