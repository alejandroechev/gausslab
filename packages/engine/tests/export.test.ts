import { describe, it, expect } from 'vitest';
import { toCSV, elementSummary } from '../src/export.js';
import { propagate, type OpticalElement } from '../src/propagation.js';
import { freeSpace, thinLens } from '../src/matrix.js';
import { type BeamParams } from '../src/beam.js';

const HeNe: BeamParams = { wavelength: 633e-9, waistRadius: 0.5e-3, n: 1 };

describe('E5: Export', () => {
  it('toCSV has correct header and rows', () => {
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift 50mm', matrix: freeSpace(0.05), length: 0.05, params: { d: 0.05 } },
    ];
    const result = propagate(HeNe, 0, elements, 0.01);
    const csv = toCSV(result);

    const lines = csv.split('\n');
    expect(lines[0]).toBe('z_m,w_m,R_m');
    expect(lines.length).toBeGreaterThan(2);
    // Each data line should have 3 columns
    const cols = lines[1].split(',');
    expect(cols).toHaveLength(3);
  });

  it('elementSummary lists all elements', () => {
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift 50mm', matrix: freeSpace(0.05), length: 0.05, params: { d: 0.05 } },
      { type: 'thin-lens', label: 'Lens f=100mm', matrix: thinLens(0.1), length: 0, params: { f: 0.1 } },
    ];
    const result = propagate(HeNe, 0, elements, 0.01);
    const summary = elementSummary(result);

    expect(summary).toContain('Drift 50mm');
    expect(summary).toContain('Lens f=100mm');
  });
});
