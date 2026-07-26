import { useState } from 'react';
import { Satellite, FlaskConical, ChevronRight, Layers3, Brain, Map, Navigation, Activity, Shield } from 'lucide-react';
import PresentationDeck from './components/PresentationDeck';
import HyperspectralCubeViewer from './components/HyperspectralCubeViewer';
import SpectralSignaturePlotter from './components/SpectralSignaturePlotter';
import HybridAIEngine from './components/HybridAIEngine';
import GISMapOutputs from './components/GISMapOutputs';
import RoverNavigationSim from './components/RoverNavigationSim';

const MODES = {
  PRESENTATION: 'presentation',
  PROTOTYPE: 'prototype',
};

const PROTO_TABS = [
  { id: 'cube', label: 'Data Cube Explorer', icon: Layers3, color: '#00d4ff' },
  { id: 'spectral', label: 'Spectral Analyzer', icon: Activity, color: '#00ffaa' },
  { id: 'ai', label: 'Hybrid AI Engine', icon: Brain, color: '#8b5cf6' },
  { id: 'gis', label: 'GIS Output Suite', icon: Map, color: '#f59e0b' },
  { id: 'rover', label: 'Rover Navigation', icon: Navigation, color: '#f43f5e' },
];

export default function App() {
  const [mode, setMode] = useState(MODES.PRESENTATION);
  const [activeTab, setActiveTab] = useState('cube');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Scan line effect */}
      <div className="scanline" />

      {/* ─── Top Navigation Bar ─── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,8,22,0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,212,255,0.1)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
      }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, #0077aa, #00d4ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0,212,255,0.5)',
          }}>
            <Satellite size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em' }}>
              COSMO GUARDS
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              SIH25142 · Space Technology
            </div>
          </div>
        </div>

        {/* Mode Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,212,255,0.15)',
          borderRadius: '10px',
          padding: '3px',
          gap: '2px',
        }}>
          <button
            onClick={() => setMode(MODES.PRESENTATION)}
            className="btn btn-sm"
            style={{
              background: mode === MODES.PRESENTATION ? 'linear-gradient(135deg,#0055aa,#00d4ff)' : 'transparent',
              color: mode === MODES.PRESENTATION ? '#fff' : 'var(--clr-text-secondary)',
              border: 'none',
              padding: '6px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              gap: '6px',
            }}
          >
            <FlaskConical size={13} />
            Pitch Deck
          </button>
          <button
            onClick={() => setMode(MODES.PROTOTYPE)}
            className="btn btn-sm"
            style={{
              background: mode === MODES.PROTOTYPE ? 'linear-gradient(135deg,#5b21b6,#8b5cf6)' : 'transparent',
              color: mode === MODES.PROTOTYPE ? '#fff' : 'var(--clr-text-secondary)',
              border: 'none',
              padding: '6px 14px',
              fontFamily: 'var(--font-display)',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              gap: '6px',
            }}
          >
            <Shield size={13} />
            Live Prototype
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="pulse-dot" style={{ background: '#22c55e', width: 8, height: 8 }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--clr-neon-teal)', fontFamily: 'var(--font-mono)' }}>SYSTEM ONLINE</span>
          </div>
          <div className="badge badge-gold" style={{ fontSize: '0.6rem' }}>
            3D-CNN + ViT ACTIVE
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {mode === MODES.PRESENTATION ? (
          <PresentationDeck />
        ) : (
          <div style={{ display: 'flex', flex: 1 }}>
            {/* Prototype Sidebar */}
            <nav style={{
              width: '220px',
              flexShrink: 0,
              background: 'rgba(5,8,22,0.8)',
              borderRight: '1px solid rgba(0,212,255,0.08)',
              padding: '20px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--clr-text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>
                AI Modules
              </div>
              {PROTO_TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px',
                      border: isActive ? `1px solid ${tab.color}40` : '1px solid transparent',
                      background: isActive ? `${tab.color}12` : 'transparent',
                      color: isActive ? tab.color : 'var(--clr-text-secondary)',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      fontSize: '0.78rem', fontWeight: isActive ? 600 : 400,
                      transition: 'var(--transition-smooth)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <Icon size={15} style={{ flexShrink: 0 }} />
                    <span>{tab.label}</span>
                    {isActive && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
                  </button>
                );
              })}

              <div style={{ marginTop: 'auto', padding: '12px', background: 'rgba(0,212,255,0.04)', borderRadius: '8px', border: '1px solid rgba(0,212,255,0.08)' }}>
                <div style={{ fontSize: '0.6rem', color: 'var(--clr-neon-gold)', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 700 }}>
                  PRESENTER
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-primary)', fontWeight: 600 }}>Shaik Sowban</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>SIH25142 · Space Tech</div>
              </div>
            </nav>

            {/* Prototype Content */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {activeTab === 'cube' && <HyperspectralCubeViewer />}
              {activeTab === 'spectral' && <SpectralSignaturePlotter />}
              {activeTab === 'ai' && <HybridAIEngine />}
              {activeTab === 'gis' && <GISMapOutputs />}
              {activeTab === 'rover' && <RoverNavigationSim />}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
