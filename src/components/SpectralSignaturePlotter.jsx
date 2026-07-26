import { useState, useEffect, useRef } from 'react';
import { Activity, Target, Crosshair } from 'lucide-react';

const WAVELENGTHS = [
  450, 490, 530, 570, 610, 650, 690, 730, 770, 810, 850, 900, 950, 1000,
  1100, 1200, 1350, 1500, 1650, 1800, 2000, 2100, 2200, 2300, 2400,
];

const MINERALS = [
  {
    name: 'Olivine',
    color: '#22c55e',
    active: true,
    description: 'Mg/Fe silicate. Strong absorption near 850–1300nm.',
    reflectance: [0.28, 0.32, 0.38, 0.44, 0.48, 0.50, 0.52, 0.56, 0.60, 0.62, 0.64, 0.60, 0.54, 0.48, 0.40, 0.35, 0.30, 0.28, 0.26, 0.24, 0.22, 0.20, 0.19, 0.18, 0.17],
  },
  {
    name: 'Pyroxene',
    color: '#6366f1',
    active: true,
    description: 'Chain silicate. Dual absorption at 1000nm and 2000nm.',
    reflectance: [0.14, 0.18, 0.22, 0.27, 0.32, 0.38, 0.43, 0.48, 0.55, 0.60, 0.62, 0.58, 0.50, 0.40, 0.32, 0.28, 0.24, 0.20, 0.18, 0.12, 0.10, 0.13, 0.15, 0.17, 0.16],
  },
  {
    name: 'Anorthosite',
    color: '#94a3b8',
    active: true,
    description: 'Plagioclase feldspar. High, flat reflectance baseline.',
    reflectance: [0.62, 0.65, 0.68, 0.70, 0.72, 0.73, 0.74, 0.75, 0.76, 0.77, 0.78, 0.79, 0.78, 0.77, 0.76, 0.74, 0.72, 0.70, 0.68, 0.66, 0.64, 0.63, 0.62, 0.61, 0.60],
  },
  {
    name: 'Ilmenite',
    color: '#f97316',
    active: false,
    description: 'Iron-titanium oxide. Very low, flat reflectance spectrum.',
    reflectance: [0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.13, 0.13, 0.14, 0.14, 0.13, 0.13, 0.12, 0.11, 0.11, 0.10, 0.10, 0.09, 0.08, 0.08, 0.08, 0.07, 0.07],
  },
  {
    name: 'Water Ice',
    color: '#38bdf8',
    active: false,
    description: 'H₂O ice. Strong absorptions at 1500nm and 2000nm.',
    reflectance: [0.85, 0.88, 0.90, 0.91, 0.92, 0.92, 0.91, 0.90, 0.88, 0.85, 0.80, 0.72, 0.60, 0.45, 0.35, 0.22, 0.18, 0.14, 0.10, 0.06, 0.04, 0.08, 0.10, 0.12, 0.11],
  },
];

function lerp(a, b, t) { return a + (b - a) * t; }

export default function SpectralSignaturePlotter() {
  const canvasRef = useRef(null);
  const [minerals, setMinerals] = useState(MINERALS);
  const [cursor, setCursor] = useState(null);
  const [selectedMineral, setSelectedMineral] = useState(null);

  const toggleMineral = (name) => {
    setMinerals(ms => ms.map(m => m.name === name ? { ...m, active: !m.active } : m));
  };

  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const PAD = { top: 20, right: 20, bottom: 40, left: 55 };
    const chartW = W - PAD.left - PAD.right;
    const chartH = H - PAD.top - PAD.bottom;

    // Background gradient
    const bg = ctx.createLinearGradient(PAD.left, PAD.top, PAD.left + chartW, PAD.top);
    bg.addColorStop(0, 'rgba(99,102,241,0.04)');
    bg.addColorStop(0.4, 'rgba(0,212,255,0.04)');
    bg.addColorStop(1, 'rgba(139,92,246,0.04)');
    ctx.fillStyle = bg;
    ctx.fillRect(PAD.left, PAD.top, chartW, chartH);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PAD.top + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
    }
    for (let i = 0; i < WAVELENGTHS.length; i += 4) {
      const x = PAD.left + (i / (WAVELENGTHS.length - 1)) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + chartH);
      ctx.stroke();
    }

    // VNIR / SWIR divider
    const vnirEnd = PAD.left + (13 / (WAVELENGTHS.length - 1)) * chartW;
    ctx.strokeStyle = 'rgba(0,255,170,0.2)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(vnirEnd, PAD.top);
    ctx.lineTo(vnirEnd, PAD.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,255,170,0.5)';
    ctx.font = '9px JetBrains Mono, monospace';
    ctx.fillText('VNIR', PAD.left + 4, PAD.top + 12);
    ctx.fillText('SWIR', vnirEnd + 4, PAD.top + 12);

    // Y axis labels
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const val = 1 - i / 5;
      const y = PAD.top + (i / 5) * chartH;
      ctx.fillText((val * 100).toFixed(0) + '%', PAD.left - 6, y + 4);
    }

    // X axis labels
    ctx.textAlign = 'center';
    [450, 650, 850, 1100, 1500, 2000, 2400].forEach(wl => {
      const idx = WAVELENGTHS.findIndex(w => w >= wl);
      if (idx < 0) return;
      const x = PAD.left + (idx / (WAVELENGTHS.length - 1)) * chartW;
      ctx.fillText(wl + 'nm', x, PAD.top + chartH + 14);
    });
    ctx.fillText('Wavelength (nm)', PAD.left + chartW / 2, PAD.top + chartH + 30);

    // Y axis title
    ctx.save();
    ctx.translate(14, PAD.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Reflectance', 0, 0);
    ctx.restore();

    // Draw spectral curves
    minerals.filter(m => m.active).forEach(m => {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = m.color;
      ctx.shadowBlur = selectedMineral === m.name ? 12 : 4;
      ctx.beginPath();
      m.reflectance.forEach((r, i) => {
        const x = PAD.left + (i / (WAVELENGTHS.length - 1)) * chartW;
        const y = PAD.top + chartH - r * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Area under curve
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      m.reflectance.forEach((r, i) => {
        const x = PAD.left + (i / (WAVELENGTHS.length - 1)) * chartW;
        const y = PAD.top + chartH - r * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.lineTo(PAD.left + chartW, PAD.top + chartH);
      ctx.lineTo(PAD.left, PAD.top + chartH);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // Cursor crosshair
    if (cursor) {
      const x = PAD.left + (cursor.idxFrac) * chartW;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, PAD.top);
      ctx.lineTo(x, PAD.top + chartH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots on each active curve
      minerals.filter(m => m.active).forEach(m => {
        const idx = Math.round(cursor.idxFrac * (WAVELENGTHS.length - 1));
        const r = m.reflectance[Math.min(idx, m.reflectance.length - 1)];
        const y = PAD.top + chartH - r * chartH;
        ctx.fillStyle = m.color;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });
    }
  };

  useEffect(() => { drawChart(); }, [minerals, cursor, selectedMineral]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const PAD = { left: 55, right: 20, top: 20, bottom: 40 };
    const chartW = canvas.width - PAD.left - PAD.right;
    const scaleX = canvas.width / rect.width;
    const px = (e.clientX - rect.left) * scaleX;
    const idxFrac = Math.max(0, Math.min(1, (px - PAD.left) / chartW));
    const wlIdx = Math.round(idxFrac * (WAVELENGTHS.length - 1));
    setCursor({ idxFrac, wl: WAVELENGTHS[wlIdx], wlIdx });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Activity size={20} style={{ color: 'var(--clr-neon-teal)' }} />
        <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>Spectral Fingerprint Analyzer</h2>
        <div className="badge badge-teal">LIVE COMPARISON</div>
      </div>
      <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem', marginTop: '-12px' }}>
        Real reflectance spectra for 5 key space minerals across VNIR (400–1000nm) and SWIR (1000–2500nm). Hover to compare values at any wavelength.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        {/* Chart */}
        <div className="glass-card p-4">
          <canvas
            ref={canvasRef}
            width={700}
            height={380}
            style={{ width: '100%', cursor: 'crosshair', display: 'block' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setCursor(null)}
          />

          {/* Cursor readout */}
          {cursor && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '12px', padding: '10px 14px', background: 'rgba(0,212,255,0.05)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-neon-cyan)' }}>
                <Crosshair size={11} style={{ display: 'inline', marginRight: 4 }} />
                <strong>{cursor.wl}nm</strong>
              </div>
              {minerals.filter(m => m.active).map(m => (
                <div key={m.name} style={{ fontSize: '0.75rem', color: m.color }}>
                  {m.name}: <strong style={{ fontFamily: 'var(--font-mono)' }}>{(m.reflectance[cursor.wlIdx] * 100).toFixed(1)}%</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Mineral Toggles */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
              <Target size={11} style={{ display: 'inline', marginRight: 6 }} />
              Mineral Overlay
            </div>
            {minerals.map((m) => (
              <div
                key={m.name}
                onClick={() => toggleMineral(m.name)}
                onMouseEnter={() => setSelectedMineral(m.name)}
                onMouseLeave={() => setSelectedMineral(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 10px', borderRadius: '8px', marginBottom: '6px',
                  background: m.active ? `${m.color}0e` : 'transparent',
                  border: m.active ? `1px solid ${m.color}40` : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  opacity: m.active ? 1 : 0.45,
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '3px', background: m.active ? m.color : 'rgba(255,255,255,0.1)', flexShrink: 0, transition: 'background 0.2s', boxShadow: m.active ? `0 0 8px ${m.color}80` : 'none' }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: m.active ? 700 : 400, color: m.active ? m.color : 'var(--clr-text-muted)' }}>{m.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', lineHeight: 1.3 }}>{m.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Identification Tip */}
          <div className="glass-card p-4" style={{ background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-neon-gold)', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              ⚡ Spectral Fingerprinting
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
              Each mineral has a unique spectral signature — like a fingerprint. Our 3D-CNN+ViT model matches pixel spectra against a library of 200+ reference signatures to achieve pixel-wise mineral identification.
            </div>
          </div>

          {/* Legend summary */}
          {cursor && (
            <div className="glass-card p-4">
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                At {cursor.wl}nm
              </div>
              {[...minerals].filter(m => m.active).sort((a, b) => b.reflectance[cursor.wlIdx] - a.reflectance[cursor.wlIdx]).map((m, i) => (
                <div key={m.name} className="flex justify-between" style={{ marginBottom: '6px', fontSize: '0.78rem' }}>
                  <span style={{ color: m.color }}>{i + 1}. {m.name}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-neon-gold)' }}>{(m.reflectance[cursor.wlIdx] * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
