import { useState, useEffect, useRef, useCallback } from 'react';
import { Navigation, Play, Pause, RotateCcw, Zap, Target, Fuel } from 'lucide-react';

/* ── Constants ── */
const GRID = 24;
const CELL = 22;
const W = GRID * CELL;
const H = GRID * CELL;

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const MINERAL_DEPOSITS = [
  { mineral: 'Olivine',     color: '#22c55e', x: 18, y: 5,  purity: 92, radius: 3 },
  { mineral: 'Water Ice',   color: '#38bdf8', x: 3,  y: 3,  purity: 88, radius: 2.5 },
  { mineral: 'Ilmenite',    color: '#f97316', x: 20, y: 18, purity: 76, radius: 2 },
  { mineral: 'Pyroxene',    color: '#6366f1', x: 8,  y: 20, purity: 85, radius: 2.5 },
  { mineral: 'Anorthosite', color: '#94a3b8', x: 14, y: 14, purity: 70, radius: 2 },
];

const ROVER_START = { x: 12, y: 22 };

function generateTerrain(seed) {
  const rand = seededRand(seed);
  return Array.from({ length: GRID }, (_, y) =>
    Array.from({ length: GRID }, (_, x) => {
      const r = rand();
      const cluster = Math.sin(x * 0.5 + seed * 0.02) * Math.cos(y * 0.4);
      return Math.abs(r * 0.5 + cluster * 0.5);
    })
  );
}

// Simple A* for shortest path on grid (avoids high-elevation cells)
function aStar(terrain, start, end) {
  const key = (x, y) => `${x},${y}`;
  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

  const open = [{ ...start, g: 0, f: heuristic(start, end), path: [start] }];
  const closed = new Set();

  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === end.x && cur.y === end.y) return cur.path;
    if (closed.has(key(cur.x, cur.y))) continue;
    closed.add(key(cur.x, cur.y));

    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[-1,1],[1,-1],[-1,-1]]) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      if (closed.has(key(nx, ny))) continue;
      const elevation = terrain[ny][nx];
      // Hard obstacles above 0.85
      if (elevation > 0.85) continue;
      const stepCost = 1 + elevation * 3;
      const g = cur.g + stepCost;
      open.push({ x: nx, y: ny, g, f: g + heuristic({ x: nx, y: ny }, end), path: [...cur.path, { x: nx, y: ny }] });
    }
    if (open.length > 5000) break;
  }
  return [];
}

/* ── Elevation color ── */
function elevColor(v) {
  if (v > 0.85) return [60, 40, 30, 255];         // obstacle / crater rim
  if (v > 0.7)  return [80, 64, 52, 255];          // high rock
  if (v > 0.5)  return [55, 50, 48, 240];          // mid rock
  if (v > 0.3)  return [35, 36, 42, 230];          // regolith
  return [22, 24, 36, 220];                         // flat plain
}

export default function RoverNavigationSim() {
  const canvasRef = useRef(null);
  const [seed] = useState(57);
  const [terrain] = useState(() => generateTerrain(57));
  const [selectedDeposit, setSelectedDeposit] = useState(0);
  const [path, setPath] = useState([]);
  const [roverPos, setRoverPos] = useState(ROVER_START);
  const [pathIdx, setPathIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [fuel, setFuel] = useState(100);
  const [distTraveled, setDistTraveled] = useState(0);
  const animRef = useRef(null);

  /* Plan path when deposit changes */
  useEffect(() => {
    const target = MINERAL_DEPOSITS[selectedDeposit];
    const newPath = aStar(terrain, ROVER_START, { x: target.x, y: target.y });
    setPath(newPath);
    setRoverPos(ROVER_START);
    setPathIdx(0);
    setRunning(false);
    setArrived(false);
    setFuel(100);
    setDistTraveled(0);
  }, [selectedDeposit, terrain]);

  /* Draw */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    // Terrain
    terrain.forEach((row, y) => {
      row.forEach((v, x) => {
        const [r, g, b, a] = elevColor(v);
        ctx.fillStyle = `rgba(${r},${g},${b},${a/255})`;
        ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
      });
    });

    // Grid overlay
    ctx.strokeStyle = 'rgba(0,212,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(W, i * CELL); ctx.stroke();
    }

    // Planned path
    if (path.length > 1) {
      ctx.strokeStyle = 'rgba(0,212,255,0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      path.forEach((p, i) => {
        const px = p.x * CELL + CELL / 2;
        const py = p.y * CELL + CELL / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Visited path (solid line)
    if (pathIdx > 1) {
      ctx.strokeStyle = 'rgba(245,158,11,0.7)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      path.slice(0, pathIdx + 1).forEach((p, i) => {
        const px = p.x * CELL + CELL / 2;
        const py = p.y * CELL + CELL / 2;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    // Mineral deposits
    MINERAL_DEPOSITS.forEach((dep, i) => {
      const cx = dep.x * CELL + CELL / 2;
      const cy = dep.y * CELL + CELL / 2;
      const radius = dep.radius * CELL * 0.8;

      // Glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, dep.color + '55');
      grad.addColorStop(1, dep.color + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = dep.color;
      ctx.shadowColor = dep.color;
      ctx.shadowBlur = i === selectedDeposit ? 18 : 6;
      ctx.beginPath();
      ctx.arc(cx, cy, i === selectedDeposit ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = dep.color;
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(dep.mineral[0], cx, cy + 3);
    });

    // Rover
    const rx = roverPos.x * CELL + CELL / 2;
    const ry = roverPos.y * CELL + CELL / 2;
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(rx, ry, 7, 0, Math.PI * 2);
    ctx.fill();

    // Rover body rectangle
    ctx.fillStyle = '#fbbf24';
    ctx.shadowBlur = 0;
    ctx.fillRect(rx - 5, ry - 3, 10, 6);
    // Rover wheels
    ctx.fillStyle = '#92400e';
    ctx.fillRect(rx - 6, ry - 5, 4, 3);
    ctx.fillRect(rx + 2, ry - 5, 4, 3);
    ctx.fillRect(rx - 6, ry + 2, 4, 3);
    ctx.fillRect(rx + 2, ry + 2, 4, 3);

    // Start marker
    ctx.fillStyle = '#00d4ff';
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ROVER_START.x * CELL + CELL / 2, ROVER_START.y * CELL + CELL / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [terrain, path, roverPos, pathIdx, selectedDeposit]);

  useEffect(() => { draw(); }, [draw]);

  /* Animation loop */
  useEffect(() => {
    if (!running) return;
    if (pathIdx >= path.length - 1) {
      setRunning(false);
      setArrived(true);
      return;
    }
    const timeout = setTimeout(() => {
      setPathIdx(i => {
        const next = i + 1;
        if (next < path.length) {
          setRoverPos(path[next]);
          setFuel(f => Math.max(0, f - (100 / path.length)));
          setDistTraveled(d => d + 30);
        }
        return next;
      });
    }, 80);
    return () => clearTimeout(timeout);
  }, [running, pathIdx, path]);

  const handleStart = () => {
    if (arrived || path.length === 0) return;
    setRunning(r => !r);
  };

  const handleReset = () => {
    setRunning(false);
    setRoverPos(ROVER_START);
    setPathIdx(0);
    setArrived(false);
    setFuel(100);
    setDistTraveled(0);
  };

  const target = MINERAL_DEPOSITS[selectedDeposit];
  const progress = path.length > 0 ? (pathIdx / (path.length - 1)) * 100 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Navigation size={20} style={{ color: 'var(--clr-neon-rose)' }} />
          <h2 style={{ fontSize: '1.3rem', color: '#fff' }}>Autonomous Rover Navigation</h2>
          <div className="badge badge-rose">ISRU PATHFINDER</div>
        </div>
        <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.85rem' }}>
          AI confidence maps feed directly into the rover path planner. Select a mineral deposit and watch the rover autonomously navigate the lunar surface using A* pathfinding.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* Canvas */}
        <div className="glass-card p-4">
          <div className="flex justify-between items-center mb-3">
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
              LUNAR SURFACE — {GRID}×{GRID} km
            </div>
            <div className="flex gap-2">
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem' }}>
                <div style={{ width: 10, height: 2, background: 'rgba(0,212,255,0.5)' }} /> Planned path
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem' }}>
                <div style={{ width: 10, height: 2, background: '#f59e0b' }} /> Traveled
              </div>
            </div>
          </div>
          <div style={{ overflow: 'auto', borderRadius: 8, border: '1px solid rgba(0,212,255,0.12)' }}>
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              style={{ display: 'block', maxWidth: '100%' }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-3 mt-4 items-center">
            <button
              onClick={handleStart}
              disabled={path.length === 0 || arrived}
              className={`btn ${running ? 'btn-secondary' : 'btn-primary'}`}
              style={{ gap: 8 }}
            >
              {running ? <Pause size={14} /> : <Play size={14} />}
              {arrived ? 'Arrived!' : running ? 'Pause' : 'Launch Rover'}
            </button>
            <button onClick={handleReset} className="btn btn-ghost" style={{ gap: 8 }}>
              <RotateCcw size={14} /> Reset
            </button>

            <div style={{ flex: 1 }}>
              <div className="flex justify-between mb-1" style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>
                <span>Mission Progress</span>
                <span style={{ color: 'var(--clr-neon-gold)' }}>{progress.toFixed(0)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#00d4ff,#f59e0b)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Deposit Selector */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              <Target size={11} style={{ display: 'inline', marginRight: 6 }} />
              Target Deposit
            </div>
            {MINERAL_DEPOSITS.map((dep, i) => (
              <button
                key={i}
                onClick={() => setSelectedDeposit(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  width: '100%', padding: '8px 10px', marginBottom: '4px',
                  borderRadius: '8px',
                  border: selectedDeposit === i ? `1px solid ${dep.color}50` : '1px solid transparent',
                  background: selectedDeposit === i ? `${dep.color}10` : 'transparent',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '0.8rem',
                  color: selectedDeposit === i ? dep.color : 'var(--clr-text-secondary)',
                  transition: 'all 0.2s', textAlign: 'left',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: dep.color, boxShadow: selectedDeposit === i ? `0 0 8px ${dep.color}` : 'none' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: selectedDeposit === i ? 700 : 400 }}>{dep.mineral}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>Purity: {dep.purity}% · ({dep.x},{dep.y})</div>
                </div>
                {selectedDeposit === i && <Zap size={11} />}
              </button>
            ))}
          </div>

          {/* Mission Stats */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
              Mission Stats
            </div>
            {[
              { label: 'Target', val: target.mineral, color: target.color },
              { label: 'Purity', val: `${target.purity}%`, color: 'var(--clr-neon-gold)' },
              { label: 'Path Steps', val: `${path.length}`, color: 'var(--clr-neon-cyan)' },
              { label: 'Distance', val: `${distTraveled}m`, color: 'var(--clr-text-primary)' },
              { label: 'Status', val: arrived ? '✓ ARRIVED' : running ? '🚗 MOVING' : '⏸ STANDBY', color: arrived ? 'var(--clr-neon-teal)' : running ? 'var(--clr-neon-gold)' : 'var(--clr-text-muted)' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex justify-between" style={{ marginBottom: '7px', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--clr-text-muted)' }}>{label}</span>
                <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Fuel gauge */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3" style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              <Fuel size={11} /> Fuel Reserve
            </div>
            <div style={{ position: 'relative', height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 8,
                width: `${fuel}%`,
                background: fuel > 50 ? 'linear-gradient(90deg,#059669,#00ffaa)' : fuel > 25 ? 'linear-gradient(90deg,#b45309,#f59e0b)' : 'linear-gradient(90deg,#9f1239,#f43f5e)',
                transition: 'width 0.3s',
              }} />
            </div>
            <div className="flex justify-between mt-1" style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>
              <span>0%</span>
              <span style={{ color: fuel > 50 ? 'var(--clr-neon-teal)' : fuel > 25 ? 'var(--clr-neon-gold)' : 'var(--clr-neon-rose)', fontWeight: 700 }}>{fuel.toFixed(0)}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Legend */}
          <div className="glass-card p-4">
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Terrain Legend
            </div>
            {[
              { color: '#141820', label: 'Flat regolith' },
              { color: '#373430', label: 'Rocky terrain' },
              { color: '#3c2820', label: 'Crater rim (obstacle)' },
              { color: '#f59e0b', label: 'Rover' },
              { color: '#00d4ff', label: 'Start position' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', fontSize: '0.72rem', color: 'var(--clr-text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Arrived Banner */}
      {arrived && (
        <div style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg,rgba(0,255,170,0.1),rgba(0,212,255,0.1))',
          border: '1px solid rgba(0,255,170,0.3)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: '16px',
        }}>
          <div style={{ fontSize: '2rem' }}>🎯</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--clr-neon-teal)', fontSize: '1rem', marginBottom: '4px' }}>
              Target Reached — {target.mineral} Deposit
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)' }}>
              Rover successfully navigated {distTraveled}m across the lunar surface. Purity: <strong style={{ color: 'var(--clr-neon-gold)' }}>{target.purity}%</strong>. Ready for ISRU extraction.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
