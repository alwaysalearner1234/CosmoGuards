import { useState, useEffect, useRef, useCallback } from 'react';
import { Map, Layers, Download, RefreshCw, Info } from 'lucide-react';

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

/* Generate pixel grid for each map type */
function generateMap(type, seed, selectedMineral) {
  const rand = seededRand(seed);
  const grid = [];
  for (let y = 0; y < SIZE; y++) {
    const row = [];
    for (let x = 0; x < SIZE; x++) {
      const r = rand();
      const r2 = rand();
      const r3 = rand();

      // Smooth spatial clustering
      const cluster = Math.sin(x * 0.4 + seed * 0.01) * Math.cos(y * 0.35 + seed * 0.007);
      const noise = r * 0.4 + cluster * 0.6;
      const mineralIdx = Math.floor(Math.abs(noise) * MINERALS.length) % MINERALS.length;
      const mineral = MINERALS[mineralIdx];

      let rgba;
      if (type === 'classification') {
        rgba = [...mineral.rgb, 220];
      } else if (type === 'abundance') {
        const targetIdx = selectedMineral;
        const abundance = mineralIdx === targetIdx ? (0.5 + r2 * 0.5) : r2 * 0.3;
        const hot = [
          Math.round(20 + abundance * 235),
          Math.round(20 + abundance * 100),
          Math.round(180 - abundance * 160),
          230
        ];
        rgba = hot;
      } else if (type === 'uncertainty') {
        const unc = r3;
        const g = Math.round(unc * 255);
        const rb = Math.round((1 - unc) * 180);
        rgba = [rb, g, rb, 200];
      } else {
        // GIS Probability
        const prob = mineralIdx === selectedMineral ? (0.6 + r * 0.4) : r * 0.4;
        rgba = [
          Math.round(prob * 30),
          Math.round(prob * 180),
          Math.round(200 + prob * 55),
          Math.round(150 + prob * 105)
        ];
      }
      row.push(rgba);
    }
    grid.push(row);
  }
  return grid;
}

/* Canvas renderer */
function MapCanvas({ type, seed, selectedMineral, onHover }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grid = generateMap(type, seed, selectedMineral);
    const CELL = Math.floor(canvas.width / SIZE);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    grid.forEach((row, y) => {
      row.forEach(([r, g, b, a], x) => {
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      });
    });
    // Grid overlay
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
    if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) {
      onHover({ x: px, y: py });
    }
  };

  return (
    <canvas
      ref={ref}
      width={320}
      height={320}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => onHover(null)}
      style={{
        display: 'block',
        width: '100%',
        imageRendering: 'pixelated',
        cursor: 'crosshair',
        borderRadius: 8,
      }}
    />
  );
}

/* Mineral abundance bar chart */
function AbundanceChart({ seed }) {
  const rand = seededRand(seed + 99);
  const totals = MINERALS.map((m) => ({ ...m, pct: Math.round(rand() * 40 + 5) }));
  const sum = totals.reduce((a, b) => a + b.pct, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {totals.map((m) => (
        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: m.color, flexShrink: 0, boxShadow: `0 0 6px ${m.color}80` }} />
          <span style={{ color: 'var(--clr-text-secondary)', width: '85px', flexShrink: 0 }}>{m.name}</span>
          <div className="progress-track" style={{ flex: 1 }}>
            <div className="progress-fill" style={{ width: `${(m.pct / sum) * 100}%`, background: m.color }} />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', color: m.color, width: '34px', textAlign: 'right' }}>
            {((m.pct / sum) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function GISMapOutputs() {
  const [activeMap, setActiveMap] = useState('classification');
  const [selectedMineral, setSelectedMineral] = useState(0);
  const [seed, setSeed] = useState(42);
  const [hovered, setHovered] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  const regenerate = () => {
    setRegenerating(true);
    setTimeout(() => {
      setSeed(s => s + 77);
      setRegenerating(false);
    }, 600);
  };

  const mapColors = { classification: '#00d4ff', abundance: '#f59e0b', uncertainty: '#00ffaa', probability: '#8b5cf6' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Map size={20} style={{ color: 'var(--clr-neon-gold)' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>GIS Output Suite</h2>
            <div className="badge badge-gold">AI GENERATED MAPS</div>
          </div>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
            Pixel-wise mineral classification maps, abundance heatmaps, uncertainty quantification, and GIS-ready probability layers.
          </p>
        </div>
        <button onClick={regenerate} disabled={regenerating} className="btn btn-secondary" style={{ gap: 8 }}>
          <RefreshCw size={14} className={regenerating ? 'spinner' : ''} />
          Regenerate
        </button>
      </div>

      {/* Map Type Tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {MAP_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveMap(t.id)}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '10px',
              border: activeMap === t.id ? `1px solid ${mapColors[t.id]}60` : '1px solid rgba(255,255,255,0.06)',
              background: activeMap === t.id ? `${mapColors[t.id]}12` : 'rgba(255,255,255,0.02)',
              color: activeMap === t.id ? mapColors[t.id] : 'var(--clr-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.25s',
              fontFamily: 'var(--font-body)',
              fontSize: '0.78rem',
              fontWeight: activeMap === t.id ? 700 : 400,
              textAlign: 'center',
            }}
          >
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
            <MapCanvas
              type={activeMap}
              seed={seed}
              selectedMineral={selectedMineral}
              onHover={setHovered}
            />
            {/* Axes */}
            <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
              Easting (m) →
            </div>
            <div style={{ position: 'absolute', top: '50%', left: -18, transform: 'translateY(-50%) rotate(-90deg)', fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
              Northing
            </div>
          </div>

          {/* Color scale bar */}
          <div style={{ marginTop: '28px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>Low</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, background: activeMap === 'classification'
              ? 'linear-gradient(90deg,#22c55e,#6366f1,#94a3b8,#f97316,#38bdf8,#78716c)'
              : activeMap === 'abundance'
              ? 'linear-gradient(90deg,#0a14b0,#00d4ff,#00ffaa,#f59e0b,#f43f5e)'
              : activeMap === 'uncertainty'
              ? 'linear-gradient(90deg,#142814,#22c55e,#f59e0b,#f43f5e)'
              : 'linear-gradient(90deg,#001a44,#0284c7,#00d4ff,#00ffff)'
            }} />
            <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>High</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Mineral Selector (for abundance/prob maps) */}
          {(activeMap === 'abundance' || activeMap === 'probability') && (
            <div className="glass-card p-4">
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                <Layers size={11} style={{ display: 'inline', marginRight: 6 }} />
                Target Mineral
              </div>
              {MINERALS.map((m, i) => (
                <button
                  key={m.name}
                  onClick={() => setSelectedMineral(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    width: '100%', padding: '7px 10px', marginBottom: '4px',
                    borderRadius: '7px', border: selectedMineral === i ? `1px solid ${m.color}50` : '1px solid transparent',
                    background: selectedMineral === i ? `${m.color}12` : 'transparent',
                    cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                    color: selectedMineral === i ? m.color : 'var(--clr-text-secondary)',
                    transition: 'all 0.2s', textAlign: 'left', fontWeight: selectedMineral === i ? 700 : 400,
                  }}
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                  {m.name}
                </button>
              ))}
            </div>
          )}

          {/* Legend (classification) */}
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

          {/* Output Stats */}
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
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between" style={{ marginBottom: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                <span style={{ color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Download Button (cosmetic) */}
          <button className="btn btn-secondary w-full" style={{ justifyContent: 'center', gap: 8 }}>
            <Download size={14} /> Export GIS Layers
          </button>
        </div>
      </div>
    </div>
  );
}
