import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, Layers, Download, RefreshCw, CloudUpload, CheckCircle, XCircle, Clock, Trash2, AlertTriangle, ExternalLink } from 'lucide-react';
import { exportGISLayer, fetchGISLayers, isSupabaseConfigured } from '../lib/supabase';

/* ── Seeded noise ── */
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const MINERALS = [
  { name: 'Olivine',      color: '#22c55e', rgb: [34, 197, 94] },
  { name: 'Pyroxene',     color: '#6366f1', rgb: [99, 102, 241] },
  { name: 'Anorthosite',  color: '#94a3b8', rgb: [148, 163, 184] },
  { name: 'Ilmenite',     color: '#f97316', rgb: [249, 115, 22] },
  { name: 'Water Ice',    color: '#38bdf8', rgb: [56, 189, 248] },
  { name: 'Basalt',       color: '#78716c', rgb: [120, 113, 108] },
];

const MAP_TYPES = [
  { id: 'classification', label: 'Classification Map',  icon: '🗺️' },
  { id: 'abundance',      label: 'Abundance Heatmap',   icon: '📊' },
  { id: 'uncertainty',    label: 'Uncertainty Map',     icon: '🎯' },
  { id: 'probability',    label: 'GIS Probability',     icon: '🌐' },
];

const SIZE = 32;

function generateMapGrid(type, seed, selectedMineral) {
  const rand = seededRand(seed);
  return Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      const r = rand(), r2 = rand(), r3 = rand();
      const cluster = Math.sin(x * 0.4 + seed * 0.01) * Math.cos(y * 0.35 + seed * 0.007);
      const noise = r * 0.4 + cluster * 0.6;
      const mineralIdx = Math.floor(Math.abs(noise) * MINERALS.length) % MINERALS.length;
      const mineral = MINERALS[mineralIdx];

      if (type === 'classification') return [...mineral.rgb, 220];
      if (type === 'abundance') {
        const ab = mineralIdx === selectedMineral ? 0.5 + r2 * 0.5 : r2 * 0.3;
        return [Math.round(20 + ab * 235), Math.round(20 + ab * 100), Math.round(180 - ab * 160), 230];
      }
      if (type === 'uncertainty') {
        const g = Math.round(r3 * 255);
        return [Math.round((1 - r3) * 180), g, Math.round((1 - r3) * 180), 200];
      }
      const prob = mineralIdx === selectedMineral ? 0.6 + r * 0.4 : r * 0.4;
      return [Math.round(prob * 30), Math.round(prob * 180), Math.round(200 + prob * 55), Math.round(150 + prob * 105)];
    })
  );
}

function getAbundanceBreakdown(seed) {
  const rand = seededRand(seed + 99);
  const raw = MINERALS.map(m => ({ name: m.name, pct: rand() * 40 + 5 }));
  const sum = raw.reduce((a, b) => a + b.pct, 0);
  return raw.map(m => ({ name: m.name, pct: parseFloat(((m.pct / sum) * 100).toFixed(1)) }));
}

function MapCanvas({ type, seed, selectedMineral, onHover }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grid = generateMapGrid(type, seed, selectedMineral);
    const CELL = Math.floor(canvas.width / SIZE);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, y) => row.forEach(([r, g, b, a], x) => {
      ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }));
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }
  }, [type, seed, selectedMineral]);

  const handleMouseMove = (e) => {
    const canvas = ref.current;
    const rect = canvas.getBoundingClientRect();
    const CELL = canvas.width / SIZE;
    const px = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width / CELL);
    const py = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height / CELL);
    if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) onHover({ x: px, y: py });
  };

  return (
    <canvas ref={ref} width={320} height={320}
      onMouseMove={handleMouseMove} onMouseLeave={() => onHover(null)}
      style={{ display: 'block', width: '100%', imageRendering: 'pixelated', cursor: 'crosshair', borderRadius: 8 }}
    />
  );
}

function AbundanceChart({ seed }) {
  const breakdown = getAbundanceBreakdown(seed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {breakdown.map((m) => {
        const mineral = MINERALS.find(x => x.name === m.name);
        return (
          <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: mineral.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--clr-text-secondary)', width: '85px', flexShrink: 0 }}>{m.name}</span>
            <div className="progress-track" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${m.pct}%`, background: mineral.color }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', color: mineral.color, width: '38px', textAlign: 'right' }}>{m.pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Supabase Setup Banner ── */
function SetupBanner() {
  return (
    <div style={{
      padding: '14px 18px',
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.3)',
      borderRadius: 10,
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <AlertTriangle size={18} style={{ color: 'var(--clr-neon-gold)', flexShrink: 0, marginTop: 2 }} />
      <div style={{ fontSize: '0.8rem' }}>
        <div style={{ color: 'var(--clr-neon-gold)', fontWeight: 700, marginBottom: 6 }}>
          Supabase Not Configured — Export Disabled
        </div>
        <div style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>
          To enable GIS export, add your credentials to{' '}
          <code style={{ color: 'var(--clr-neon-cyan)', background: 'rgba(0,212,255,0.1)', padding: '1px 5px', borderRadius: 3 }}>.env</code>:
        </div>
        <pre style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(0,0,0,0.4)', borderRadius: 8, fontSize: '0.72rem', color: 'var(--clr-neon-teal)', lineHeight: 1.6, overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key`}
        </pre>
        <div style={{ marginTop: 8, color: 'var(--clr-text-muted)', fontSize: '0.72rem' }}>
          Then run the SQL schema from{' '}
          <code style={{ color: '#94a3b8' }}>src/lib/supabase.js</code> in your Supabase SQL Editor.{' '}
          <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer"
            style={{ color: 'var(--clr-neon-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            Open Dashboard <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── Export History Row ── */
function HistoryRow({ layer, onDelete }) {
  const mapType = MAP_TYPES.find(t => t.id === layer.map_type);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(0,212,255,0.03)',
      border: '1px solid rgba(0,212,255,0.08)',
      fontSize: '0.75rem',
    }}>
      <span style={{ fontSize: '1rem' }}>{mapType?.icon || '🗺️'}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {layer.layer_name}
        </div>
        <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.65rem' }}>
          {layer.map_type} · {layer.dominant_mineral} · {layer.confidence_pct}%
        </div>
      </div>
      <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>
        {new Date(layer.created_at).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <button onClick={() => onDelete(layer.id)}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', padding: 4, borderRadius: 4, transition: 'color 0.2s' }}
        onMouseEnter={e => e.target.style.color = 'var(--clr-neon-rose)'}
        onMouseLeave={e => e.target.style.color = 'var(--clr-text-muted)'}
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

/* ── Main Component ── */
export default function GISMapOutputs() {
  const [activeMap, setActiveMap] = useState('classification');
  const [selectedMineral, setSelectedMineral] = useState(0);
  const [seed, setSeed] = useState(42);
  const [hovered, setHovered] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // null | 'success' | 'error'
  const [exportMessage, setExportMessage] = useState('');
  const [lastExportId, setLastExportId] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const mapColors = { classification: '#00d4ff', abundance: '#f59e0b', uncertainty: '#00ffaa', probability: '#8b5cf6' };

  const regenerate = () => {
    setRegenerating(true);
    setExportStatus(null);
    setTimeout(() => { setSeed(s => s + 77); setRegenerating(false); }, 600);
  };

  const loadHistory = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingHistory(true);
    const { data, error } = await fetchGISLayers();
    if (!error && data) setHistory(data);
    setLoadingHistory(false);
  }, []);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  const handleExport = async () => {
    if (!isSupabaseConfigured) return;
    setExporting(true);
    setExportStatus(null);

    const breakdown = getAbundanceBreakdown(seed);
    const dominantMineral = breakdown.sort((a, b) => b.pct - a.pct)[0]?.name || 'Anorthosite';
    const targetMineral = activeMap === 'abundance' || activeMap === 'probability'
      ? MINERALS[selectedMineral].name : null;

    const layerName = `${MAP_TYPES.find(t => t.id === activeMap)?.label} — Seed ${seed} — ${new Date().toLocaleTimeString()}`;

    // Generate compact pixel data (sampled 8x8 for storage efficiency)
    const SAMPLE = 8;
    const grid = generateMapGrid(activeMap, seed, selectedMineral);
    const step = Math.floor(SIZE / SAMPLE);
    const sampledGrid = Array.from({ length: SAMPLE }, (_, y) =>
      Array.from({ length: SAMPLE }, (_, x) => grid[y * step]?.[x * step]?.slice(0, 3) || [0, 0, 0])
    );

    const { data, error } = await exportGISLayer({
      layerName,
      mapType: activeMap,
      mineral: targetMineral,
      seed,
      pixelData: sampledGrid,
      abundanceBreakdown: breakdown,
      dominantMineral,
    });

    setExporting(false);
    if (error) {
      setExportStatus('error');
      setExportMessage(typeof error === 'string' ? error : (error.message || 'Export failed'));
    } else {
      setExportStatus('success');
      setExportMessage(`Saved as "${layerName}"`);
      setLastExportId(data?.id);
      if (showHistory) loadHistory();
    }
  };

  const handleDeleteFromHistory = (id) => {
    setHistory(h => h.filter(l => l.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map size={20} style={{ color: 'var(--clr-neon-gold)' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>GIS Output Suite</h2>
            <div className="badge badge-gold">AI GENERATED MAPS</div>
            {isSupabaseConfigured && <div className="badge badge-teal">SUPABASE CONNECTED</div>}
          </div>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
            Pixel-wise mineral classification maps, abundance heatmaps, uncertainty quantification, and GIS-ready probability layers — exportable to Supabase.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={regenerate} disabled={regenerating} className="btn btn-secondary" style={{ gap: 8 }}>
            <RefreshCw size={14} className={regenerating ? 'spinner' : ''} />
            Regenerate
          </button>
          {isSupabaseConfigured && (
            <button
              onClick={() => { setShowHistory(h => !h); }}
              className={`btn ${showHistory ? 'btn-secondary' : 'btn-ghost'}`}
              style={{ gap: 8 }}
            >
              <Clock size={14} />
              History
            </button>
          )}
        </div>
      </div>

      {/* Supabase setup banner if not configured */}
      {!isSupabaseConfigured && <SetupBanner />}

      {/* Map Type Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {MAP_TYPES.map(t => (
          <button key={t.id} onClick={() => setActiveMap(t.id)} style={{
            flex: 1, padding: '10px 8px', borderRadius: '10px',
            border: activeMap === t.id ? `1px solid ${mapColors[t.id]}60` : '1px solid rgba(255,255,255,0.06)',
            background: activeMap === t.id ? `${mapColors[t.id]}12` : 'rgba(255,255,255,0.02)',
            color: activeMap === t.id ? mapColors[t.id] : 'var(--clr-text-muted)',
            cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'var(--font-body)',
            fontSize: '0.78rem', fontWeight: activeMap === t.id ? 700 : 400, textAlign: 'center',
          }}>
            <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{t.icon}</div>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Map Canvas */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-3">
            <div style={{ fontSize: '0.8rem', color: mapColors[activeMap], fontWeight: 700 }}>
              {MAP_TYPES.find(t => t.id === activeMap)?.label}
            </div>
            {hovered && (
              <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                Pixel ({hovered.x}, {hovered.y})
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <MapCanvas type={activeMap} seed={seed} selectedMineral={selectedMineral} onHover={setHovered} />
            <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
              Easting (m) →
            </div>
            <div style={{ position: 'absolute', top: '50%', left: -18, transform: 'translateY(-50%) rotate(-90deg)', fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
              Northing
            </div>
          </div>
          <div style={{ marginTop: '28px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>Low</span>
            <div style={{
              flex: 1, height: 8, borderRadius: 4,
              background: activeMap === 'classification'
                ? 'linear-gradient(90deg,#22c55e,#6366f1,#94a3b8,#f97316,#38bdf8,#78716c)'
                : activeMap === 'abundance'
                ? 'linear-gradient(90deg,#0a14b0,#00d4ff,#00ffaa,#f59e0b,#f43f5e)'
                : activeMap === 'uncertainty'
                ? 'linear-gradient(90deg,#142814,#22c55e,#f59e0b,#f43f5e)'
                : 'linear-gradient(90deg,#001a44,#0284c7,#00d4ff,#00ffff)',
            }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>High</span>
          </div>

          {/* Export status */}
          {exportStatus && (
            <div style={{
              marginTop: 12, padding: '10px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
              background: exportStatus === 'success' ? 'rgba(0,255,170,0.08)' : 'rgba(244,63,94,0.08)',
              border: `1px solid ${exportStatus === 'success' ? 'rgba(0,255,170,0.3)' : 'rgba(244,63,94,0.3)'}`,
            }}>
              {exportStatus === 'success'
                ? <CheckCircle size={16} style={{ color: 'var(--clr-neon-teal)', flexShrink: 0 }} />
                : <XCircle size={16} style={{ color: 'var(--clr-neon-rose)', flexShrink: 0 }} />}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: exportStatus === 'success' ? 'var(--clr-neon-teal)' : 'var(--clr-neon-rose)' }}>
                  {exportStatus === 'success' ? 'Exported to Supabase ✓' : 'Export Failed'}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{exportMessage}</div>
                {exportStatus === 'success' && lastExportId && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    ID: {lastExportId}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Mineral Selector */}
          {(activeMap === 'abundance' || activeMap === 'probability') && (
            <div className="glass-card p-4">
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                <Layers size={11} style={{ display: 'inline', marginRight: 6 }} />
                Target Mineral
              </div>
              {MINERALS.map((m, i) => (
                <button key={m.name} onClick={() => setSelectedMineral(i)} style={{
                  display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
                  padding: '7px 10px', marginBottom: '4px', borderRadius: '7px',
                  border: selectedMineral === i ? `1px solid ${m.color}50` : '1px solid transparent',
                  background: selectedMineral === i ? `${m.color}12` : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  color: selectedMineral === i ? m.color : 'var(--clr-text-secondary)',
                  transition: 'all 0.2s', textAlign: 'left', fontWeight: selectedMineral === i ? 700 : 400,
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* Classification Legend */}
          {activeMap === 'classification' && (
            <div className="glass-card p-4">
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                Mineral Legend
              </div>
              {MINERALS.map(m => (
                <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)' }}>{m.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Abundance Chart */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Scene Mineral Abundance
            </div>
            <AbundanceChart seed={seed} />
          </div>

          {/* Map Statistics */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Map Statistics
            </div>
            {[
              { label: 'Resolution', val: '30m/pixel' },
              { label: 'Total Pixels', val: `${SIZE}×${SIZE}` },
              { label: 'Coord System', val: 'Lunar IAU 2015' },
              { label: 'Export Format', val: 'GeoTIFF / KML' },
              { label: 'Confidence', val: '97.3%' },
              { label: 'Seed ID', val: `#${seed}` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between" style={{ marginBottom: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Export to Supabase Button */}
          <button
            onClick={handleExport}
            disabled={exporting || !isSupabaseConfigured}
            className={`btn w-full ${isSupabaseConfigured ? 'btn-primary' : 'btn-ghost'}`}
            style={{ justifyContent: 'center', gap: 8, opacity: !isSupabaseConfigured ? 0.5 : 1 }}
          >
            {exporting
              ? <><RefreshCw size={14} className="spinner" /> Exporting…</>
              : <><CloudUpload size={14} /> Export to Supabase</>}
          </button>

          {/* Local download (always works) */}
          <button
            onClick={() => {
              const breakdown = getAbundanceBreakdown(seed);
              const data = { mapType: activeMap, seed, mineral: MINERALS[selectedMineral]?.name, abundance: breakdown, generatedAt: new Date().toISOString(), presenter: 'Lidiya', missionId: 'SIH25142' };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = `cosmoguards_gis_${activeMap}_seed${seed}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn btn-secondary w-full"
            style={{ justifyContent: 'center', gap: 8 }}
          >
            <Download size={14} /> Download as JSON
          </button>
        </div>
      </div>

      {/* Export History Panel */}
      {showHistory && isSupabaseConfigured && (
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-3">
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-neon-gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Clock size={12} style={{ display: 'inline', marginRight: 6 }} />
              Exported Layers — Supabase
            </div>
            <button onClick={loadHistory} className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
              <RefreshCw size={12} className={loadingHistory ? 'spinner' : ''} /> Refresh
            </button>
          </div>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
              <RefreshCw size={14} className="spinner" style={{ display: 'inline', marginRight: 6 }} />
              Loading from Supabase…
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--clr-text-muted)', fontSize: '0.8rem' }}>
              No exported layers yet. Click "Export to Supabase" to save your first GIS layer.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
              {history.map(layer => (
                <HistoryRow key={layer.id} layer={layer} onDelete={handleDeleteFromHistory} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
