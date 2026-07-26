import { useState, useEffect, useRef, useCallback } from 'react';
import { Brain, Cpu, Eye, Shield, RefreshCw, CheckCircle, XCircle, Zap, AlertTriangle } from 'lucide-react';

/* ── Helpers ── */
function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateFeatureMap(seed, size = 8) {
  const rand = seededRand(seed);
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => rand())
  );
}

function generateAttentionMatrix(seed, size = 8) {
  const rand = seededRand(seed);
  const raw = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => rand())
  );
  // normalize rows (softmax-like)
  return raw.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    return row.map(v => v / sum);
  });
}

const MINERALS = [
  { name: 'Olivine', color: '#22c55e', conf: 0.87 },
  { name: 'Pyroxene', color: '#6366f1', conf: 0.73 },
  { name: 'Anorthosite', color: '#94a3b8', conf: 0.91 },
  { name: 'Ilmenite', color: '#f97316', conf: 0.65 },
  { name: 'Water Ice', color: '#38bdf8', conf: 0.82 },
];

const PHYSICS_RULES = [
  { rule: 'Olivine + Pyroxene co-occurrence ✓', pass: true },
  { rule: 'Water Ice detected in polar shadow region ✓', pass: true },
  { rule: 'Ilmenite abundance < 30% ✓', pass: true },
  { rule: 'Spectral slope geologically consistent ✓', pass: true },
  { rule: 'Thermal emission cross-check ✓', pass: true },
];

/* ── Canvas: Feature Map ── */
function FeatureMapCanvas({ seed, colorA, colorB, size = 8, label }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const map = generateFeatureMap(seed, size);
    const CELL = Math.floor(canvas.width / size);
    const hexToRgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
    const [r1,g1,b1] = hexToRgb(colorA || '#0a0a1a');
    const [r2,g2,b2] = hexToRgb(colorB || '#00d4ff');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    map.forEach((row, y) => {
      row.forEach((v, x) => {
        const r = Math.round(r1 + (r2 - r1) * v);
        const g = Math.round(g1 + (g2 - g1) * v);
        const b = Math.round(b1 + (b2 - b1) * v);
        ctx.fillStyle = `rgba(${r},${g},${b},${0.4 + v * 0.6})`;
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
      });
    });
  }, [seed, colorA, colorB, size]);
  return (
    <div style={{ textAlign: 'center' }}>
      <canvas ref={ref} width={120} height={120} style={{ imageRendering: 'pixelated', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)', display: 'block', width: 120, height: 120 }} />
      <div style={{ fontSize: '0.62rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ── Canvas: Attention Map ── */
function AttentionCanvas({ seed }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const mat = generateAttentionMatrix(seed, 8);
    const CELL = Math.floor(canvas.width / 8);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    mat.forEach((row, y) => {
      row.forEach((v, x) => {
        const intensity = Math.round(v * 255 * 6);
        const r = Math.min(255, intensity);
        const g = Math.min(255, Math.max(0, intensity - 128));
        const b = Math.max(0, 200 - intensity * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
        ctx.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
      });
    });
  }, [seed]);
  return (
    <canvas ref={ref} width={128} height={128}
      style={{ imageRendering: 'pixelated', borderRadius: 6, border: '1px solid rgba(139,92,246,0.3)', display: 'block', width: 128, height: 128 }} />
  );
}

/* ── Main Component ── */
export default function HybridAIEngine() {
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0); // 0=idle,1=cnn,2=vit,3=physics,4=done
  const [seed, setSeed] = useState(42);
  const [physicsPass, setPhysicsPass] = useState(true);
  const [uncertaintyHigh, setUncertaintyHigh] = useState(false);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const timerRef = useRef(null);

  const addLog = useCallback((msg, color = 'var(--clr-text-secondary)') => {
    setLog(l => [...l.slice(-12), { msg, color, ts: new Date().toLocaleTimeString('en', { hour12: false }) }]);
  }, []);

  const runInference = useCallback(() => {
    if (running) return;
    setRunning(true);
    setStage(1);
    setProgress(0);
    setLog([]);
    setSeed(s => s + 13);
    const newPhysicsPass = Math.random() > 0.2;
    const newUncHigh = Math.random() > 0.75;
    setPhysicsPass(newPhysicsPass);
    setUncertaintyHigh(newUncHigh);

    addLog('▸ Preprocessing hyperspectral input cube…', 'var(--clr-neon-cyan)');

    let p = 0;
    const interval = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p === 20) { setStage(1); addLog('▸ 3D-CNN: Extracting localized spectral-spatial features…', '#818cf8'); }
      if (p === 45) { setStage(2); addLog('▸ ViT: Computing multi-head self-attention across patches…', '#a78bfa'); }
      if (p === 70) { setStage(3); addLog('▸ Physics Consistency Check: Validating against spectral library…', 'var(--clr-neon-teal)'); }
      if (p === 85) {
        if (newPhysicsPass) {
          addLog('  ✓ All physics constraints satisfied.', 'var(--clr-neon-teal)');
        } else {
          addLog('  ✗ Physics constraint violation — recalibrating model…', 'var(--clr-neon-rose)');
        }
      }
      if (p === 95) {
        if (newUncHigh) {
          addLog('  ⚠ Uncertainty too high — requesting additional scan.', 'var(--clr-neon-gold)');
        } else {
          addLog('  ✓ Uncertainty within tolerance — maps approved.', 'var(--clr-neon-teal)');
        }
      }
      if (p >= 100) {
        clearInterval(interval);
        setStage(4);
        setRunning(false);
        addLog('▸ Inference complete. Mineral maps generated.', 'var(--clr-neon-gold)');
      }
    }, 60);
    timerRef.current = interval;
  }, [running, addLog]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const stageLabels = [
    { label: 'Idle', color: 'var(--clr-text-muted)' },
    { label: '3D-CNN Feature Extraction', color: '#818cf8' },
    { label: 'Vision Transformer Attention', color: '#a78bfa' },
    { label: 'Physics Consistency Check', color: 'var(--clr-neon-teal)' },
    { label: 'Complete ✓', color: 'var(--clr-neon-gold)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={20} style={{ color: 'var(--clr-neon-purple)' }} />
            <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>Hybrid AI Engine</h2>
            <div className="badge badge-purple">3D-CNN + ViT</div>
          </div>
          <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
            Real-time visualization of the hybrid model pipeline — from raw data cube to physics-validated mineral maps.
          </p>
        </div>
        <button onClick={runInference} disabled={running} className="btn btn-primary btn-lg" style={{ gap: 10 }}>
          {running ? <RefreshCw size={16} className="spinner" /> : <Zap size={16} />}
          {running ? 'Inferring…' : 'Run Inference'}
        </button>
      </div>

      {/* Progress Bar + Stage */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-2">
          <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pipeline Progress</span>
          <span style={{ fontSize: '0.8rem', color: stageLabels[stage].color, fontWeight: 700 }}>{stageLabels[stage].label}</span>
        </div>
        <div className="progress-track" style={{ height: 8 }}>
          <div className="progress-fill" style={{
            width: `${progress}%`,
            background: stage === 1 ? 'linear-gradient(90deg,#4f46e5,#818cf8)'
              : stage === 2 ? 'linear-gradient(90deg,#7c3aed,#a78bfa)'
              : stage === 3 ? 'linear-gradient(90deg,#059669,#00ffaa)'
              : stage === 4 ? 'linear-gradient(90deg,#b45309,#f59e0b)'
              : 'rgba(255,255,255,0.15)',
          }} />
        </div>
        <div className="flex justify-between mt-2">
          {['Input', '3D-CNN', 'ViT', 'Physics', 'Output'].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '0.62rem', color: stage > i ? stageLabels[Math.min(i + 1, 4)].color : 'var(--clr-text-muted)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage > i ? stageLabels[Math.min(i + 1, 4)].color : 'rgba(255,255,255,0.1)', margin: '0 auto 4px', boxShadow: stage > i ? `0 0 8px ${stageLabels[Math.min(i+1,4)].color}` : 'none' }} />
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

        {/* 3D-CNN Panel */}
        <div className="glass-card p-4" style={{ borderTop: '2px solid #6366f1', opacity: stage >= 1 ? 1 : 0.4, transition: 'opacity 0.5s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} style={{ color: '#818cf8' }} />
            <span style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.85rem' }}>3D-CNN Backbone</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Convolves over spectral + spatial dimensions simultaneously. Fixed-size local receptive fields capture fine mineralogical features.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[0, 1, 2, 3].map(i => (
              <FeatureMapCanvas
                key={i + seed}
                seed={seed * 3 + i * 17}
                colorA="#0d1133"
                colorB={['#6366f1','#818cf8','#4f46e5','#a78bfa'][i]}
                label={`Conv3D-${i+1}`}
                size={8}
              />
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Kernel Size', val: '3×3×7' },
              { label: 'Feature Maps', val: '256' },
              { label: 'Receptive Field', val: 'Local' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between" style={{ fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                <span style={{ color: '#818cf8', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Vision Transformer Panel */}
        <div className="glass-card p-4" style={{ borderTop: '2px solid #8b5cf6', opacity: stage >= 2 ? 1 : 0.4, transition: 'opacity 0.5s' }}>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} style={{ color: '#a78bfa' }} />
            <span style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.85rem' }}>Vision Transformer (ViT)</span>
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
            Flattened CNN feature patches attend to every other patch simultaneously. Unlimited global context for scene-wide mineral distribution modeling.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>Multi-Head Self-Attention Matrix (Head 1)</div>
            <AttentionCanvas seed={seed + 99} />
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <div style={{ flex: 1, height: 8, background: 'linear-gradient(90deg,#001a44,#8b5cf6,#ff6060)', borderRadius: 4 }} />
            </div>
            <div className="flex justify-between w-full" style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
              <span>Low attention</span><span>High attention</span>
            </div>
          </div>
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Attention Heads', val: '8' },
              { label: 'Patch Size', val: '4×4' },
              { label: 'Context Span', val: 'Global' },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between" style={{ fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                <span style={{ color: '#a78bfa', fontFamily: 'var(--font-mono)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physics Check + Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Physics Panel */}
          <div className="glass-card p-4" style={{ borderTop: `2px solid ${stage >= 3 ? (physicsPass ? '#00ffaa' : '#f43f5e') : '#333'}`, opacity: stage >= 3 ? 1 : 0.4, transition: 'all 0.5s' }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={15} style={{ color: stage >= 3 ? (physicsPass ? 'var(--clr-neon-teal)' : 'var(--clr-neon-rose)') : 'var(--clr-text-muted)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: stage >= 3 ? (physicsPass ? 'var(--clr-neon-teal)' : 'var(--clr-neon-rose)') : 'var(--clr-text-muted)' }}>
                Physics Consistency Check
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {PHYSICS_RULES.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: stage >= 3 ? 'var(--clr-text-secondary)' : 'var(--clr-text-muted)' }}>
                  {stage >= 3 ? (
                    r.pass && physicsPass
                      ? <CheckCircle size={11} style={{ color: 'var(--clr-neon-teal)', flexShrink: 0 }} />
                      : <XCircle size={11} style={{ color: 'var(--clr-neon-rose)', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                  )}
                  {r.rule.replace(' ✓', '')}
                </div>
              ))}
            </div>
            {stage >= 3 && !physicsPass && (
              <div style={{ marginTop: '10px', padding: '8px', background: 'rgba(244,63,94,0.08)', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)', fontSize: '0.7rem', color: 'var(--clr-neon-rose)' }}>
                ⚠ Constraint violated. Model recalibrated with updated priors.
              </div>
            )}
          </div>

          {/* Uncertainty Panel */}
          <div className="glass-card p-4" style={{ borderTop: `2px solid ${stage >= 4 ? (uncertaintyHigh ? '#f59e0b' : '#00ffaa') : '#333'}`, opacity: stage >= 4 ? 1 : 0.4, transition: 'all 0.5s' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} style={{ color: stage >= 4 ? (uncertaintyHigh ? 'var(--clr-neon-gold)' : 'var(--clr-neon-teal)') : 'var(--clr-text-muted)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: stage >= 4 ? (uncertaintyHigh ? 'var(--clr-neon-gold)' : 'var(--clr-neon-teal)') : 'var(--clr-text-muted)' }}>
                Uncertainty Tolerance
              </span>
            </div>
            {stage >= 4 && (
              <>
                <div style={{ fontSize: '0.72rem', color: uncertaintyHigh ? 'var(--clr-neon-gold)' : 'var(--clr-neon-teal)', marginBottom: '8px' }}>
                  {uncertaintyHigh ? '⚠ High uncertainty detected — requesting new acquisition.' : '✓ Uncertainty within tolerance — maps approved.'}
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: uncertaintyHigh ? '78%' : '22%', background: uncertaintyHigh ? 'var(--clr-neon-gold)' : 'var(--clr-neon-teal)' }} />
                </div>
                <div className="flex justify-between mt-1" style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)' }}>
                  <span>Low</span><span>Threshold</span><span>High</span>
                </div>
              </>
            )}
          </div>

          {/* Mineral Confidence Output */}
          <div className="glass-card p-4" style={{ opacity: stage >= 4 ? 1 : 0.35, transition: 'opacity 0.5s' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Classification Output
            </div>
            {MINERALS.map((m) => {
              const conf = stage >= 4 ? m.conf + (seededRand(seed + m.name.length)() - 0.5) * 0.1 : 0;
              const clamped = Math.max(0, Math.min(1, conf));
              return (
                <div key={m.name} style={{ marginBottom: '8px' }}>
                  <div className="flex justify-between" style={{ fontSize: '0.72rem', marginBottom: '3px' }}>
                    <span style={{ color: m.color }}>{m.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--clr-neon-gold)' }}>
                      {stage >= 4 ? `${(clamped * 100).toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${clamped * 100}%`, background: m.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* System Log */}
      <div className="glass-card p-4" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
        <div style={{ color: 'var(--clr-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.65rem' }}>
          System Log
        </div>
        <div style={{ minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {log.length === 0 ? (
            <div style={{ color: 'var(--clr-text-muted)', opacity: 0.5 }}>Click "Run Inference" to start the AI pipeline…</div>
          ) : log.map((entry, i) => (
            <div key={i} style={{ color: entry.color, display: 'flex', gap: '12px' }}>
              <span style={{ color: 'var(--clr-text-muted)', flexShrink: 0 }}>[{entry.ts}]</span>
              <span>{entry.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
