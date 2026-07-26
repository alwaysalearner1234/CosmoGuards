import { useState, useEffect, useRef, useCallback } from 'react';
import { Layers3, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';

/* Mineral spectral colors across bands */
const MINERALS = [
  { name: 'Olivine', color: '#22c55e', bands: [0.3, 0.5, 0.8, 0.9, 0.7, 0.5, 0.35, 0.2, 0.15] },
  { name: 'Pyroxene', color: '#6366f1', bands: [0.2, 0.4, 0.75, 0.85, 0.9, 0.6, 0.4, 0.25, 0.15] },
  { name: 'Anorthosite', color: '#94a3b8', bands: [0.7, 0.75, 0.8, 0.82, 0.78, 0.72, 0.65, 0.6, 0.55] },
  { name: 'Ilmenite', color: '#f97316', bands: [0.1, 0.15, 0.2, 0.25, 0.28, 0.22, 0.18, 0.14, 0.12] },
  { name: 'Water Ice', color: '#38bdf8', bands: [0.85, 0.9, 0.88, 0.3, 0.15, 0.1, 0.08, 0.85, 0.9] },
];

const BAND_LABELS = [
  '450nm', '550nm', '650nm', '750nm', '900nm',
  '1200nm', '1600nm', '2000nm', '2400nm',
];

const VNIR_BANDS = 5; // first 5 bands are VNIR

/* Generates a synthetic 12x12 pixel tile for a given band */
function generateTile(band, seed = 42) {
  const SIZE = 12;
  const tile = [];
  for (let y = 0; y < SIZE; y++) {
    const row = [];
    for (let x = 0; x < SIZE; x++) {
      // deterministic noise
      const hash = Math.sin(seed * 127 + x * 31 + y * 17 + band * 97) * 0.5 + 0.5;
      const mineralIdx = Math.floor(Math.sin(x * 0.5 + y * 0.3 + seed) * 2.5 + 2.5);
      const mineral = MINERALS[Math.min(mineralIdx, MINERALS.length - 1)];
      const intensity = mineral.bands[band] * (0.7 + hash * 0.3);
      row.push({ color: mineral.color, intensity, mineral: mineral.name });
    }
    tile.push(row);
  }
  return tile;
}

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function intensityToRgba(color, intensity) {
  const [r, g, b] = hexToRgb(color);
  const black = [0, 5, 20];
  return `rgba(${lerp(black[0], r, intensity)},${lerp(black[1], g, intensity)},${lerp(black[2], b, intensity)},1)`;
}

export default function HyperspectralCubeViewer() {
  const canvasRef = useRef(null);
  const [activeBand, setActiveBand] = useState(0);
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(3);
  const [showInfo, setShowInfo] = useState(false);

  const TILE_SIZE = 12;
  const CELL = zoom * 3;

  const tile = generateTile(activeBand);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = TILE_SIZE * CELL;
    const H = TILE_SIZE * CELL;
    canvas.width = W;
    canvas.height = H;

    tile.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx.fillStyle = intensityToRgba(cell.color, cell.intensity);
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);

        // grid lines
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * CELL, y * CELL, CELL, CELL);
      });
    });

    // Highlight hovered cell
    if (hovered) {
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 8;
      ctx.strokeRect(hovered.x * CELL, hovered.y * CELL, CELL, CELL);
    }
  }, [activeBand, hovered, zoom, tile, CELL]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = Math.floor(((e.clientX - rect.left) * scaleX) / CELL);
    const py = Math.floor(((e.clientY - rect.top) * scaleY) / CELL);
    if (px >= 0 && px < TILE_SIZE && py >= 0 && py < TILE_SIZE) {
      setHovered({ x: px, y: py, ...tile[py][px] });
    } else {
      setHovered(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Layers3 size={20} style={{ color: 'var(--clr-neon-cyan)' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>Hyperspectral Data Cube Explorer</h2>
            <div className="badge badge-cyan">{BAND_LABELS[activeBand]}</div>
            <div className={`badge ${activeBand < VNIR_BANDS ? 'badge-teal' : 'badge-purple'}`}>
              {activeBand < VNIR_BANDS ? 'VNIR' : 'SWIR'}
            </div>
          </div>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
            Scrub through {BAND_LABELS.length} spectral bands (VNIR 400–1000nm → SWIR 1000–2500nm). Each pixel shows its spectral reflectance at the selected wavelength.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setZoom(z => Math.max(z - 1, 1))} className="btn btn-ghost btn-icon"><ZoomOut size={15} /></button>
          <button onClick={() => setZoom(z => Math.min(z + 1, 5))} className="btn btn-ghost btn-icon"><ZoomIn size={15} /></button>
          <button onClick={() => { setActiveBand(0); setZoom(3); }} className="btn btn-ghost btn-icon"><RotateCcw size={15} /></button>
          <button onClick={() => setShowInfo(i => !i)} className={`btn btn-icon ${showInfo ? 'btn-secondary' : 'btn-ghost'}`}><Info size={15} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>
        {/* Canvas Area */}
        <div className="glass-card p-4" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Band Scrubber */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>400nm (UV-Visible)</span>
              <span style={{ fontWeight: 700, color: 'var(--clr-neon-cyan)', fontSize: '0.8rem' }}>
                Band {activeBand + 1}/9 — {BAND_LABELS[activeBand]}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>2400nm (SWIR)</span>
            </div>
            <input
              type="range"
              min={0}
              max={BAND_LABELS.length - 1}
              value={activeBand}
              onChange={(e) => setActiveBand(Number(e.target.value))}
            />
            {/* Band labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              {BAND_LABELS.map((b, i) => (
                <button
                  key={i}
                  onClick={() => setActiveBand(i)}
                  style={{
                    background: i === activeBand ? 'rgba(0,212,255,0.2)' : 'transparent',
                    border: i === activeBand ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent',
                    color: i < VNIR_BANDS ? (i === activeBand ? '#00d4ff' : '#00ffaa80') : (i === activeBand ? '#8b5cf6' : '#8b5cf660'),
                    cursor: 'pointer', borderRadius: '4px',
                    padding: '2px 4px', fontSize: '0.6rem',
                    fontFamily: 'var(--font-mono)',
                    transition: 'all 0.2s',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Pixel Canvas */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 0 30px rgba(0,212,255,0.08)' }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', imageRendering: 'pixelated', cursor: 'crosshair', width: '100%', maxWidth: '500px' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHovered(null)}
              />
            </div>

            {/* Pixel Tooltip */}
            {hovered && (
              <div style={{
                position: 'absolute', top: 8, left: 8,
                background: 'rgba(0,0,20,0.95)', border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '8px', padding: '10px 14px', fontSize: '0.75rem',
              }}>
                <div style={{ color: 'var(--clr-text-muted)', marginBottom: '4px' }}>Pixel ({hovered.x}, {hovered.y})</div>
                <div style={{ color: hovered.color, fontWeight: 700, fontSize: '0.9rem' }}>{hovered.mineral}</div>
                <div style={{ color: 'var(--clr-text-secondary)', marginTop: '2px' }}>
                  Reflectance: <span style={{ color: 'var(--clr-neon-gold)', fontFamily: 'var(--font-mono)' }}>{(hovered.intensity * 100).toFixed(1)}%</span>
                </div>
                <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.7rem' }}>Band: {BAND_LABELS[activeBand]}</div>
              </div>
            )}
          </div>

          {/* Wavelength range indicator */}
          <div style={{ display: 'flex', gap: '3px', borderRadius: '4px', overflow: 'hidden', height: '8px' }}>
            {['#7c3aed','#4f46e5','#2563eb','#0284c7','#0891b2','#059669','#65a30d','#ca8a04','#dc2626'].map((c, i) => (
              <div key={i} style={{ flex: 1, background: c, opacity: i === activeBand ? 1 : 0.3, transition: 'opacity 0.3s' }} />
            ))}
          </div>
        </div>

        {/* Sidebar: Mineral Legend + Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Spectral Legend */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Mineral Color Map
            </div>
            {MINERALS.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: 14, height: 14, borderRadius: '3px', background: m.color, flexShrink: 0, boxShadow: `0 0 8px ${m.color}60` }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600 }}>{m.name}</div>
                  <div className="progress-track" style={{ marginTop: '4px' }}>
                    <div className="progress-fill" style={{ width: `${m.bands[activeBand] * 100}%`, background: m.color }} />
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: m.color, width: '36px', textAlign: 'right' }}>
                  {(m.bands[activeBand] * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>

          {/* Band Info Card */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Current Band Info
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div className="flex justify-between">
                <span style={{ color: 'var(--clr-text-muted)' }}>Wavelength</span>
                <span style={{ color: 'var(--clr-neon-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{BAND_LABELS[activeBand]}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--clr-text-muted)' }}>Region</span>
                <span style={{ color: activeBand < VNIR_BANDS ? 'var(--clr-neon-teal)' : 'var(--clr-neon-purple)', fontWeight: 700 }}>
                  {activeBand < VNIR_BANDS ? 'VNIR' : 'SWIR'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--clr-text-muted)' }}>Band Index</span>
                <span style={{ color: 'var(--clr-text-primary)', fontFamily: 'var(--font-mono)' }}>{activeBand + 1} / {BAND_LABELS.length}</span>
              </div>
              <div style={{ marginTop: '4px', padding: '8px', background: 'rgba(0,212,255,0.05)', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                {activeBand < VNIR_BANDS
                  ? '🟢 VNIR region. Primary mineral absorption features for Olivine and Pyroxene visible here.'
                  : '🔵 SWIR region. Water ice and hydroxyl signatures dominate. Strong Ilmenite absorption here.'}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px' }}>
              Scene Statistics
            </div>
            {[
              { label: 'Total Pixels', value: '144', unit: '(12×12)' },
              { label: 'Spectral Bands', value: '9', unit: 'simulated' },
              { label: 'Dominant Mineral', value: 'Anorthosite', unit: '' },
            ].map((s, i) => (
              <div key={i} className="flex justify-between" style={{ marginBottom: '8px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{s.label}</span>
                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{s.value} <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.65rem' }}>{s.unit}</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
