import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  type BeamParams,
  type OpticalElement,
  type PropagationResult,
  freeSpace,
  thinLens,
  curvedMirror,
  flatInterface,
  propagate,
} from '@gausslab/engine';
import { BeamInput } from './BeamInput.js';
import { SystemBuilder } from './SystemBuilder.js';
import { BeamDiagram } from './BeamDiagram.js';
import { ResultsPanel } from './ResultsPanel.js';
import { FeedbackModal } from './FeedbackModal.js';
import { SAMPLES } from './samples/index.js';

type ElementDef = { type: string; param: number; param2?: number };

const PRESETS: Record<string, number> = {
  '532 nm (Nd:YAG 2ω)': 532e-9,
  '633 nm (HeNe)': 633e-9,
  '1064 nm (Nd:YAG)': 1064e-9,
};

const DEFAULT_ELEMENTS: ElementDef[] = [
  { type: 'free-space', param: 0.1 },
  { type: 'thin-lens', param: 0.1 },
  { type: 'free-space', param: 0.2 },
];

const STORAGE_KEY = 'gausslab-state';

interface SavedState {
  wavelength: number;
  waistRadius: number;
  waistPosition: number;
  elementDefs: ElementDef[];
}

function loadSavedState(): SavedState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch { return null; }
}

function getInitialTheme(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem('gausslab-theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'light';
}

function buildOpticalElement(def: ElementDef): OpticalElement {
  switch (def.type) {
    case 'free-space':
      return { type: 'free-space', label: `Free space ${(def.param * 1e3).toFixed(0)} mm`, matrix: freeSpace(def.param), length: def.param, params: { d: def.param } };
    case 'thin-lens':
      return { type: 'thin-lens', label: `Lens f=${(def.param * 1e3).toFixed(0)} mm`, matrix: thinLens(def.param), length: 0, params: { f: def.param } };
    case 'curved-mirror':
      return { type: 'curved-mirror', label: `Mirror R=${(def.param * 1e3).toFixed(0)} mm`, matrix: curvedMirror(def.param), length: 0, params: { R: def.param } };
    case 'flat-interface':
      return { type: 'flat-interface', label: `Interface n=${def.param.toFixed(2)}→${(def.param2 ?? 1).toFixed(2)}`, matrix: flatInterface(def.param, def.param2 ?? 1), length: 0, params: { n1: def.param, n2: def.param2 ?? 1 } };
    default:
      return { type: 'free-space', label: 'Unknown', matrix: freeSpace(0), length: 0, params: {} };
  }
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);
  const savedState = loadSavedState();
  const [wavelength, setWavelength] = useState(savedState?.wavelength ?? 633e-9);
  const [waistRadius, setWaistRadius] = useState(savedState?.waistRadius ?? 0.5e-3);
  const [waistPosition, setWaistPosition] = useState(savedState?.waistPosition ?? 0);
  const [elementDefs, setElementDefs] = useState<ElementDef[]>(savedState?.elementDefs ?? DEFAULT_ELEMENTS);
  const openFileRef = useRef<HTMLInputElement>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Debounced persistence
  useEffect(() => {
    const timer = setTimeout(() => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ wavelength, waistRadius, waistPosition, elementDefs })); } catch { /* noop */ }
    }, 500);
    return () => clearTimeout(timer);
  }, [wavelength, waistRadius, waistPosition, elementDefs]);

  const beam: BeamParams = useMemo(() => ({ wavelength, waistRadius, n: 1 }), [wavelength, waistRadius]);

  const elements = useMemo(() => elementDefs.map(buildOpticalElement), [elementDefs]);

  const result: PropagationResult | null = useMemo(() => {
    try {
      return propagate(beam, waistPosition, elements, 0.0005);
    } catch {
      return null;
    }
  }, [beam, waistPosition, elements]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('gausslab-theme', next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handlePreset = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = PRESETS[e.target.value];
    if (val) setWavelength(val);
  }, []);

  const handleSample = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const sample = SAMPLES.find((s) => s.id === e.target.value);
    if (!sample) return;
    setWavelength(sample.data.wavelength);
    setWaistRadius(sample.data.beamWaist);
    setWaistPosition(sample.data.waistPosition);
    setElementDefs(sample.data.elements);
    e.target.value = '';
  }, []);

  const handleNew = useCallback(() => {
    setWavelength(633e-9);
    setWaistRadius(0.5e-3);
    setWaistPosition(0);
    setElementDefs([...DEFAULT_ELEMENTS]);
  }, []);

  const handleOpenFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const config = JSON.parse(ev.target?.result as string) as SavedState;
        if (config.wavelength) setWavelength(config.wavelength);
        if (config.waistRadius) setWaistRadius(config.waistRadius);
        if (config.waistPosition !== undefined) setWaistPosition(config.waistPosition);
        if (config.elementDefs) setElementDefs(config.elementDefs);
      } catch { alert('Invalid JSON config file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleSave = useCallback(() => {
    const config: SavedState = { wavelength, waistRadius, waistPosition, elementDefs };
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gausslab-config.json'; a.click();
    URL.revokeObjectURL(url);
  }, [wavelength, waistRadius, waistPosition, elementDefs]);

  return (
    <div className="app" data-theme={theme}>
      <div className="toolbar">
        <h1>🔬 GaussLab</h1>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>Gaussian Beam Propagation</span>
        <button data-testid="new-btn" onClick={handleNew}>📄 New</button>
        <button data-testid="open-btn" onClick={() => openFileRef.current?.click()}>📂 Open</button>
        <input ref={openFileRef} type="file" accept=".json" style={{ display: 'none' }}
          onChange={handleOpenFile} data-testid="open-file-input" />
        <select onChange={handleSample} defaultValue="">
          <option value="" disabled>📂 Samples</option>
          {SAMPLES.map((s) => (
            <option key={s.id} value={s.id} title={s.description}>{s.name}</option>
          ))}
        </select>
        <button data-testid="save-btn" onClick={handleSave}>💾 Save</button>
        <select onChange={handlePreset} defaultValue="">
          <option value="" disabled>Wavelength presets</option>
          {Object.keys(PRESETS).map((k) => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <div className="spacer" />
        <button onClick={() => window.open('/intro.html', '_blank')} title="Domain guide">📖 Guide</button>
        <button onClick={() => setShowFeedback(true)} title="Feedback">💬 Feedback</button>
        <a href="https://github.com/alejandroechev/gausslab" target="_blank" rel="noopener" className="github-link">GitHub</a>
        <button onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
      </div>
      <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)} product="GaussLab" />
      <div className="main-layout">
        <div className="panel">
          <BeamInput
            wavelength={wavelength}
            waistRadius={waistRadius}
            waistPosition={waistPosition}
            onWavelengthChange={setWavelength}
            onWaistRadiusChange={setWaistRadius}
            onWaistPositionChange={setWaistPosition}
          />
          <SystemBuilder elements={elementDefs} onChange={setElementDefs} />
        </div>
        <div className="diagram-container">
          {result && <BeamDiagram result={result} theme={theme} />}
        </div>
        <div className="panel">
          {result && <ResultsPanel result={result} beam={beam} />}
        </div>
      </div>
    </div>
  );
}
