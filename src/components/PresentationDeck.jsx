import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Satellite, Zap, Brain, Database, BarChart3, Globe, Shield, AlertTriangle } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    title: 'Cosmo Guards',
    subtitle: 'Hyperspectral Imaging for Space Mineral Exploration',
    tag: 'SIH25142 · Space Technology',
    content: 'slide-title',
  },
  {
    id: 2,
    title: 'The Problem & Data Challenge',
    content: 'slide-problem',
  },
  {
    id: 3,
    title: 'Our Innovation — The Hybrid AI Model',
    content: 'slide-model',
  },
  {
    id: 4,
    title: 'System Architecture & Workflow',
    content: 'slide-architecture',
  },
  {
    id: 5,
    title: 'Outputs & Deployment',
    content: 'slide-outputs',
  },
  {
    id: 6,
    title: 'Impact & Future Scope',
    content: 'slide-impact',
  },
];

/* ── Slide Components ── */

function SlideTitleContent() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '32px' }}>
      {/* Animated planet graphic */}
      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div style={{
          width: 200, height: 200,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 35% 30%, #0099cc, #003366 60%, #000a1a)',
          boxShadow: '0 0 60px rgba(0,212,255,0.5), 0 0 120px rgba(0,212,255,0.2)',
          position: 'absolute',
        }} />
        {/* Ring */}
        <svg style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', overflow: 'visible' }} width="260" height="80" viewBox="-30 -20 260 80">
          <ellipse cx="100" cy="30" rx="130" ry="22" fill="none" stroke="#00ffaa" strokeWidth="2" opacity="0.7" />
          <ellipse cx="100" cy="30" rx="130" ry="22" fill="none" stroke="#00ffaa" strokeWidth="8" opacity="0.08" />
        </svg>
        {/* Rover dot */}
        <div style={{
          position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)',
          width: 12, height: 12, borderRadius: '50%', background: '#f59e0b',
          boxShadow: '0 0 16px #f59e0b',
          animation: 'float 3s ease-in-out infinite',
        }} />
      </div>

      <div>
        <div className="badge badge-gold" style={{ marginBottom: '16px', fontSize: '0.75rem' }}>SIH25142 · Space Technology</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 900, letterSpacing: '0.06em', lineHeight: 1.1, marginBottom: '12px' }}>
          <span className="text-glow-cyan">COSMO</span>{' '}
          <span style={{ color: '#fff' }}>GUARDS</span>
        </h1>
        <p style={{ fontSize: 'clamp(0.95rem,2vw,1.3rem)', color: 'var(--clr-text-secondary)', maxWidth: '700px', margin: '0 auto 16px' }}>
          Hyperspectral Imaging for Space Mineral Exploration
        </p>
        <p style={{ fontSize: '1.05rem', color: 'var(--clr-neon-gold)', fontWeight: 600 }}>
          3D-CNN + Vision Transformers
        </p>
      </div>

      <div className="flex gap-4" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        <div className="glass-card p-4" style={{ textAlign: 'left', minWidth: '160px' }}>
          <div className="text-xs opacity-50 mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Presenter</div>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem' }}>Lidiya</div>
        </div>
        <div className="glass-card p-4" style={{ textAlign: 'left', minWidth: '160px' }}>
          <div className="text-xs opacity-50 mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Problem ID</div>
          <div style={{ fontWeight: 700, color: 'var(--clr-neon-cyan)', fontSize: '1.1rem' }}>SIH25142</div>
        </div>
        <div className="glass-card p-4" style={{ textAlign: 'left', minWidth: '160px' }}>
          <div className="text-xs opacity-50 mb-1" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Theme</div>
          <div style={{ fontWeight: 700, color: 'var(--clr-neon-gold)', fontSize: '1.1rem' }}>Space Technology</div>
        </div>
      </div>
    </div>
  );
}

function SlideProblemContent() {
  const problems = [
    {
      icon: '🔴',
      title: 'The RGB Limitation',
      color: '#f43f5e',
      points: [
        'Traditional cameras capture only Red, Green & Blue',
        'Misses critical geological data for deep space exploration',
        'Cannot differentiate minerals with similar visual appearance',
      ],
    },
    {
      icon: '🌈',
      title: 'The Hyperspectral Advantage',
      color: '#00d4ff',
      points: [
        'Captures hundreds of wavelengths per pixel',
        'Creates a unique "spectral fingerprint" for every surface',
        'Reveals VNIR (400–1000nm) and SWIR (1000–2500nm) data',
      ],
    },
    {
      icon: '⚡',
      title: 'The Computational Bottleneck',
      color: '#f59e0b',
      points: [
        'Hyperspectral data suffers from extreme high dimensionality',
        'Strong spectral redundancy challenges standard algorithms',
        'Rare minerals are visually near-identical in standard datasets',
      ],
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', flex: 1 }}>
        {problems.map((p, i) => (
          <div key={i} className="glass-card p-6 fade-in" style={{ animationDelay: `${i * 0.15}s`, opacity: 0, borderTop: `3px solid ${p.color}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '2.5rem' }}>{p.icon}</div>
            <h3 style={{ color: p.color, fontSize: '1.1rem' }}>{p.title}</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {p.points.map((pt, j) => (
                <li key={j} style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', color: 'var(--clr-text-secondary)', alignItems: 'flex-start' }}>
                  <span style={{ color: p.color, flexShrink: 0, marginTop: '2px' }}>▸</span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Data Cube Visualization Strip */}
      <div className="glass-card p-4" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {['#7c3aed','#4f46e5','#2563eb','#0284c7','#0891b2','#059669','#65a30d','#ca8a04','#dc2626'].map((c, i) => (
            <div key={i} style={{ width: 28, height: 60, background: c, borderRadius: '3px', opacity: 0.8 + i * 0.02 }} />
          ))}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--clr-neon-cyan)', marginBottom: '4px' }}>Hyperspectral Data Cube</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)' }}>Each column = one wavelength band. Every pixel stores hundreds of reflectance values — the complete spectral fingerprint of a material.</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, color: 'var(--clr-neon-gold)' }}>400+</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Spectral Bands</div>
        </div>
      </div>
    </div>
  );
}

function SlideModelContent() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1 }}>
        {/* Left: Architecture Diagram */}
        <div className="glass-card p-6" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 className="text-glow-purple" style={{ fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hybrid Architecture</h3>

          {/* Input */}
          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,212,255,0.08)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.2)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-neon-cyan)', fontWeight: 700 }}>INPUT</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginTop: '2px' }}>Hyperspectral Data Cube (H×W×B)</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--clr-neon-cyan)', fontSize: '1.2rem' }}>↓</div>

          {/* 3D-CNN */}
          <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.12)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div style={{ fontWeight: 700, color: '#818cf8', fontSize: '0.9rem', marginBottom: '6px' }}>🧊 3D-CNN Backbone</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)' }}>
              Extracts fine localized spectral-spatial features from the 3D data cube using convolutional filters across all dimensions.
            </div>
          </div>

          <div style={{ textAlign: 'center', color: '#8b5cf6', fontSize: '1.2rem' }}>↓ Feature Maps</div>

          {/* ViT */}
          <div style={{ padding: '12px 16px', background: 'rgba(139,92,246,0.12)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ fontWeight: 700, color: '#a78bfa', fontSize: '0.9rem', marginBottom: '6px' }}>🔭 Vision Transformer (ViT)</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-secondary)' }}>
              Self-attention mechanism captures global context and long-range spatial dependencies across the full scene.
            </div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--clr-neon-teal)', fontSize: '1.2rem' }}>↓</div>

          {/* Physics */}
          <div style={{ padding: '10px 16px', background: 'rgba(0,255,170,0.08)', borderRadius: '8px', border: '1px solid rgba(0,255,170,0.25)' }}>
            <div style={{ fontWeight: 700, color: 'var(--clr-neon-teal)', fontSize: '0.85rem' }}>🌡️ Physics Consistency Check</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-secondary)', marginTop: '4px' }}>Ensures predictions are geologically viable</div>
          </div>

          <div style={{ textAlign: 'center', color: 'var(--clr-neon-gold)', fontSize: '1.2rem' }}>↓</div>

          <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--clr-neon-gold)', fontWeight: 700 }}>OUTPUT — Mineral Maps</div>
          </div>
        </div>

        {/* Right: Feature Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { title: 'Best of Both Worlds', icon: Zap, color: '#00d4ff', desc: 'Integrated hybrid framework combining 3D-CNN spatial-spectral detail extraction with ViT long-range global attention.' },
            { title: 'Overcoming Receptive Field Limits', icon: Brain, color: '#8b5cf6', desc: 'Traditional 3D-CNNs use fixed receptive fields. ViT heads unlock unlimited contextual span across the full mineral map.' },
            { title: 'Physics-Guided Predictions', icon: Shield, color: '#00ffaa', desc: 'Unlike standard AI, our model is constrained by real-world spectral physics — every mineral prediction is geologically viable.' },
            { title: 'End-to-End Trainable', icon: Database, color: '#f59e0b', desc: 'The full 3D-CNN + ViT pipeline is trained end-to-end on labeled hyperspectral ground truth from Apollo and Chandrayaan missions.' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="glass-card p-4 fade-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: `${item.color}18`, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color: item.color }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: item.color, fontSize: '0.9rem', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--clr-text-secondary)', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SlideArchitectureContent() {
  const steps = [
    { num: '01', title: 'Data Acquisition', color: '#00d4ff', desc: 'Capturing and merging VNIR (400–1000nm) with SWIR (1000–2500nm) hyperspectral data from onboard spectrometers.' },
    { num: '02', title: 'Preprocessing Pipeline', color: '#8b5cf6', desc: 'Noise removal, atmospheric correction, radiometric calibration, and dimensionality reduction via PCA/KPCA.' },
    { num: '03', title: '3D-CNN Feature Extraction', color: '#6366f1', desc: 'The preprocessed data cube feeds the 3D-CNN backbone, generating dense local spectral-spatial feature representations.' },
    { num: '04', title: 'Vision Transformer', color: '#a78bfa', desc: 'Patch-based ViT processes the feature maps, applying multi-head self-attention to model global mineral-distribution context.' },
    { num: '05', title: 'Physics Consistency Check', color: '#00ffaa', desc: 'Predicted mineral probabilities are validated against known spectral library constraints. Violations trigger automatic model recalibration.' },
    { num: '06', title: 'GIS Output Generation', color: '#f59e0b', desc: 'Final output: pixel-wise classification maps, abundance heatmaps, uncertainty maps, and GIS-ready probability layers.' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Pipeline Flow */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {steps.map((s, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <div className="glass-card" style={{
              padding: '14px 10px', textAlign: 'center',
              borderTop: `2px solid ${s.color}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
              height: '100%',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: s.color, opacity: 0.4 }}>{s.num}</div>
              <div style={{ fontWeight: 700, fontSize: '0.72rem', color: s.color, lineHeight: 1.2 }}>{s.title}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}>{s.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', color: s.color, fontSize: '1rem', zIndex: 10 }}>→</div>
            )}
          </div>
        ))}
      </div>

      {/* Key Decision Loops */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="glass-card p-5" style={{ borderLeft: '3px solid #00ffaa' }}>
          <div style={{ fontWeight: 700, color: 'var(--clr-neon-teal)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} /> Physics Consistency Check
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(0,255,170,0.08)', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--clr-neon-teal)', fontWeight: 700 }}>✓ PASS</div>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>Output maps generated → Deploy</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(244,63,94,0.08)', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--clr-neon-rose)', fontWeight: 700 }}>✗ FAIL</div>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>Auto-recalibrate model → Re-infer</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontWeight: 700, color: 'var(--clr-neon-gold)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> Uncertainty Tolerance Check
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(245,158,11,0.08)', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--clr-neon-gold)', fontWeight: 700 }}>LOW Uncertainty</div>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>Approve → Geological DB + Rover nav</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(244,63,94,0.08)', borderRadius: '8px', flex: 1 }}>
              <div style={{ color: 'var(--clr-neon-rose)', fontWeight: 700 }}>HIGH Uncertainty</div>
              <div style={{ color: 'var(--clr-text-muted)', fontSize: '0.7rem', marginTop: '4px' }}>Fine-tune model or request new scan</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideOutputsContent() {
  const outputs = [
    { label: 'Pixel-wise Mineral Classification Map', icon: '🗺️', color: '#00d4ff', desc: 'Every pixel classified into one of 12+ mineral categories at full spatial resolution.' },
    { label: 'Mineral Abundance Maps', icon: '📊', color: '#00ffaa', desc: 'Per-mineral percentage abundance rendered as continuous heatmaps for ISRU planning.' },
    { label: 'Uncertainty & Probability Maps', icon: '🎯', color: '#8b5cf6', desc: 'Bayesian uncertainty quantification exported as GIS-ready probability rasters.' },
    { label: 'GIS-Ready Exports', icon: '🌐', color: '#f59e0b', desc: 'All outputs in GeoTIFF / KML / ENVI formats for direct import into geological platforms.' },
  ];

  const deployments = [
    { title: 'Real-Time Decision Support', icon: '⚡', desc: 'Onboard processing for instant mineral identification during orbital or surface traversal.' },
    { title: 'Geological Database Integration', icon: '🗄️', desc: 'Seamless sync with planetary geological archives and mission databases.' },
    { title: 'Live Rover Navigation', icon: '🚗', desc: 'Confidence maps feed directly into rover path planner for autonomous high-value targeting.' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {outputs.map((o, i) => (
          <div key={i} className="glass-card p-5 fade-in" style={{ animationDelay: `${i * 0.1}s`, opacity: 0, textAlign: 'center', borderTop: `2px solid ${o.color}` }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{o.icon}</div>
            <div style={{ fontWeight: 700, color: o.color, fontSize: '0.82rem', marginBottom: '8px' }}>{o.label}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{o.desc}</div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5" style={{ borderLeft: '3px solid #00ffaa' }}>
        <div style={{ fontWeight: 700, color: 'var(--clr-neon-teal)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem' }}>
          <Satellite size={14} /> Deployment Scenarios
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {deployments.map((d, i) => (
            <div key={i} style={{ padding: '12px', background: 'rgba(0,255,170,0.05)', borderRadius: '10px', border: '1px solid rgba(0,255,170,0.12)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{d.icon}</div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>{d.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>{d.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-4" style={{ display: 'flex', alignItems: 'center', gap: '24px', background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-neon-gold)' }}>{'<'}2ms</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Per-pixel inference</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-neon-cyan)' }}>97.3%</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Classification accuracy</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-neon-teal)' }}>400+</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Spectral bands processed</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color: 'var(--clr-neon-purple)' }}>12+</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>Mineral classes</div>
        </div>
      </div>
    </div>
  );
}

function SlideImpactContent() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', flex: 1 }}>
        {[
          {
            icon: Zap, color: '#00d4ff', title: 'Speed & Precision',
            points: [
              'Instant pixel-wise mineral maps from raw hyperspectral cubes',
              'Hybrid CNN+ViT balances local detail with global context',
              '97.3% classification accuracy on benchmark datasets',
              'Real-time onboard processing for live rover guidance',
            ]
          },
          {
            icon: Globe, color: '#00ffaa', title: 'Planetary Scalability',
            points: [
              'Deployable on Earth, Moon, Mars, or asteroid surfaces',
              'Enables In-Situ Resource Utilization (ISRU) anywhere',
              'Physics-guided AI works universally across planetary bodies',
              'Compatible with all hyperspectral sensor platforms (EO-1, AVIRIS)',
            ]
          },
          {
            icon: BarChart3, color: '#f59e0b', title: 'Atmanirbhar Bharat',
            points: [
              'Major leap for India\'s space technology sovereignty',
              'Supports ISRO Chandrayaan and Gaganyaan mission goals',
              'Enables autonomous mineral survey without foreign dependence',
              'Empowers next-gen Indian space explorers and scientists',
            ]
          },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="glass-card p-6 fade-in" style={{ animationDelay: `${i * 0.15}s`, opacity: 0, borderTop: `3px solid ${item.color}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: 42, height: 42, borderRadius: '12px', background: `${item.color}18`, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} style={{ color: item.color }} />
                </div>
                <h3 style={{ color: item.color, fontSize: '1rem' }}>{item.title}</h3>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {item.points.map((pt, j) => (
                  <li key={j} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', alignItems: 'flex-start', lineHeight: 1.4 }}>
                    <span style={{ color: item.color, flexShrink: 0, marginTop: '2px' }}>◆</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Future Roadmap */}
      <div className="glass-card p-5" style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(139,92,246,0.05))' }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 'clamp(1rem,2vw,1.4rem)', color: '#fff', marginBottom: '16px' }}>
          🚀 Future Scope
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
          {[
            { year: '2025', label: 'SIH Deployment', color: '#00d4ff' },
            { year: '2026', label: 'ISRO Mission Integration', color: '#00ffaa' },
            { year: '2027', label: 'Lunar Surface Trials', color: '#f59e0b' },
            { year: '2028+', label: 'Mars ISRU Operations', color: '#8b5cf6' },
          ].map((t, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.3rem', color: t.color }}>{t.year}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: '4px' }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Presentation Deck ── */
export default function PresentationDeck() {
  const [current, setCurrent] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const total = SLIDES.length;

  const goNext = () => setCurrent(c => Math.min(c + 1, total - 1));
  const goPrev = () => setCurrent(c => Math.max(c - 1, 0));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(f => !f);
  };

  const slide = SLIDES[current];

  const slideContentMap = {
    'slide-title': <SlideTitleContent />,
    'slide-problem': <SlideProblemContent />,
    'slide-model': <SlideModelContent />,
    'slide-architecture': <SlideArchitectureContent />,
    'slide-outputs': <SlideOutputsContent />,
    'slide-impact': <SlideImpactContent />,
  };

  return (
    <div ref={containerRef} style={{
      display: 'flex', flexDirection: 'column', flex: 1,
      background: isFullscreen ? '#00020d' : 'transparent',
      minHeight: 'calc(100vh - 60px)',
    }}>
      {/* Slide Area */}
      <div style={{ flex: 1, padding: '32px 40px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Slide Header */}
        {slide.content !== 'slide-title' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                Slide {slide.id} of {total}
              </div>
              <h2 style={{ color: '#fff', fontSize: 'clamp(1.1rem,2.5vw,1.6rem)' }}>{slide.title}</h2>
            </div>
            <div className="flex gap-2 items-center">
              <div className="badge badge-cyan">{slide.id === 2 ? 'PROBLEM' : slide.id === 3 ? 'SOLUTION' : slide.id === 4 ? 'ARCHITECTURE' : slide.id === 5 ? 'OUTPUT' : 'IMPACT'}</div>
              <button onClick={toggleFullscreen} className="btn btn-ghost btn-icon">
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </div>
        )}

        {/* Slide Content */}
        <div style={{ flex: 1 }}>
          {slideContentMap[slide.content]}
        </div>
      </div>

      {/* Controls Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        padding: '16px 40px 24px',
        borderTop: '1px solid rgba(0,212,255,0.08)',
      }}>
        <button onClick={goPrev} disabled={current === 0} className="btn btn-secondary btn-sm" style={{ opacity: current === 0 ? 0.3 : 1 }}>
          <ChevronLeft size={16} /> Prev
        </button>

        {/* Dot indicators */}
        <div className="flex gap-2 items-center">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? 24 : 8, height: 8,
                borderRadius: '4px',
                background: i === current ? 'var(--clr-neon-cyan)' : 'rgba(0,212,255,0.2)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: i === current ? '0 0 10px rgba(0,212,255,0.6)' : 'none',
              }}
            />
          ))}
        </div>

        <button onClick={goNext} disabled={current === total - 1} className="btn btn-primary btn-sm" style={{ opacity: current === total - 1 ? 0.3 : 1 }}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
