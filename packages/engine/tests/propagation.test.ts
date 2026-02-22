import { describe, it, expect } from 'vitest';
import { transformQ, propagate, type OpticalElement } from '../src/propagation.js';
import { freeSpace, thinLens } from '../src/matrix.js';
import { type BeamParams, rayleighRange, complexQ, beamRadiusFromQ } from '../src/beam.js';

const HeNe: BeamParams = { wavelength: 633e-9, waistRadius: 0.5e-3, n: 1 };

describe('E3: Beam propagation', () => {
  it('transformQ through identity preserves q', () => {
    const q = { re: 0.1, im: 1.24 };
    const q2 = transformQ(q, [1, 0, 0, 1]);
    expect(q2.re).toBeCloseTo(q.re, 10);
    expect(q2.im).toBeCloseTo(q.im, 10);
  });

  it('transformQ through free space adds distance to Re(q)', () => {
    const q = complexQ(HeNe, 0);
    const d = 0.5;
    const q2 = transformQ(q, freeSpace(d));
    expect(q2.re).toBeCloseTo(d, 10);
    expect(q2.im).toBeCloseTo(q.im, 10);
  });

  it('single lens focusing produces smaller waist', () => {
    const f = 0.1; // 100mm focal length
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift 50mm', matrix: freeSpace(0.05), length: 0.05, params: { d: 0.05 } },
      { type: 'thin-lens', label: 'Lens f=100mm', matrix: thinLens(f), length: 0, params: { f } },
      { type: 'free-space', label: 'Drift 200mm', matrix: freeSpace(0.2), length: 0.2, params: { d: 0.2 } },
    ];

    const result = propagate(HeNe, 0, elements, 0.001);

    expect(result.points.length).toBeGreaterThan(10);
    expect(result.outputBeam.waistRadius).toBeLessThan(HeNe.waistRadius);
    expect(result.outputBeam.waistRadius).toBeGreaterThan(0);
    expect(result.elements).toHaveLength(3);
  });

  it('free space only preserves beam parameters', () => {
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift 100mm', matrix: freeSpace(0.1), length: 0.1, params: { d: 0.1 } },
    ];

    const result = propagate(HeNe, 0, elements, 0.01);

    // Output waist should be same as input
    expect(result.outputBeam.waistRadius).toBeCloseTo(HeNe.waistRadius, 6);
    // System matrix is just free space
    expect(result.systemMatrix[0]).toBeCloseTo(1, 10);
    expect(result.systemMatrix[1]).toBeCloseTo(0.1, 6);
  });

  it('propagation with waist not at origin', () => {
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift', matrix: freeSpace(0.2), length: 0.2, params: { d: 0.2 } },
    ];

    const result = propagate(HeNe, 0.1, elements, 0.01);
    // At z=0, beam should already be expanding (waist at z=0.1)
    expect(result.points[0].w).toBeGreaterThan(HeNe.waistRadius);
  });

  it('returns correct system matrix for lens+space', () => {
    const f = 0.2;
    const d = 0.3;
    const elements: OpticalElement[] = [
      { type: 'thin-lens', label: 'Lens', matrix: thinLens(f), length: 0, params: { f } },
      { type: 'free-space', label: 'Drift', matrix: freeSpace(d), length: d, params: { d } },
    ];

    const result = propagate(HeNe, 0, elements, 0.01);

    // System matrix = freeSpace(d) × thinLens(f)
    expect(result.systemMatrix[0]).toBeCloseTo(1 - d / f, 6);
    expect(result.systemMatrix[1]).toBeCloseTo(d, 6);
  });
});

describe('E4: Output beam parameters', () => {
  it('magnification = output_w0 / input_w0', () => {
    const f = 0.1;
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift', matrix: freeSpace(0.05), length: 0.05, params: { d: 0.05 } },
      { type: 'thin-lens', label: 'Lens', matrix: thinLens(f), length: 0, params: { f } },
      { type: 'free-space', label: 'Drift', matrix: freeSpace(0.2), length: 0.2, params: { d: 0.2 } },
    ];

    const result = propagate(HeNe, 0, elements);
    expect(result.outputBeam.magnification).toBeCloseTo(
      result.outputBeam.waistRadius / HeNe.waistRadius,
      10,
    );
  });

  it('output divergence consistent with output waist', () => {
    const elements: OpticalElement[] = [
      { type: 'free-space', label: 'Drift', matrix: freeSpace(0.1), length: 0.1, params: { d: 0.1 } },
      { type: 'thin-lens', label: 'Lens', matrix: thinLens(0.05), length: 0, params: { f: 0.05 } },
      { type: 'free-space', label: 'Drift', matrix: freeSpace(0.15), length: 0.15, params: { d: 0.15 } },
    ];

    const result = propagate(HeNe, 0, elements);
    const expectedDiv = HeNe.wavelength / (Math.PI * result.outputBeam.waistRadius * HeNe.n);
    expect(result.outputBeam.divergence).toBeCloseTo(expectedDiv, 10);
  });
});
