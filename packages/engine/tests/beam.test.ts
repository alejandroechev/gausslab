import { describe, it, expect } from 'vitest';
import { rayleighRange, beamRadius, divergence, complexQ, beamRadiusFromQ, wavefrontRadius, type BeamParams } from '../src/beam.js';

const HeNe: BeamParams = { wavelength: 633e-9, waistRadius: 0.5e-3, n: 1 };

describe('E1: Gaussian beam parameters', () => {
  it('computes Rayleigh range zR = πw₀²n/λ', () => {
    const zR = rayleighRange(HeNe);
    const expected = Math.PI * (0.5e-3) ** 2 / 633e-9;
    expect(zR).toBeCloseTo(expected, 6);
    expect(zR).toBeCloseTo(1.2408, 3); // ~1.24 m for HeNe 0.5mm waist
  });

  it('beam radius at waist is w₀', () => {
    expect(beamRadius(HeNe, 0)).toBeCloseTo(0.5e-3, 10);
  });

  it('beam radius at z = zR is w₀√2', () => {
    const zR = rayleighRange(HeNe);
    expect(beamRadius(HeNe, zR)).toBeCloseTo(0.5e-3 * Math.SQRT2, 10);
  });

  it('beam radius symmetric about waist', () => {
    const w1 = beamRadius(HeNe, 0.5);
    const w2 = beamRadius(HeNe, -0.5);
    expect(w1).toBeCloseTo(w2, 10);
  });

  it('divergence θ = λ/(πw₀n)', () => {
    const theta = divergence(HeNe);
    expect(theta).toBeCloseTo(633e-9 / (Math.PI * 0.5e-3), 10);
  });

  it('complex q at waist: q(0) = i·zR', () => {
    const q = complexQ(HeNe, 0);
    expect(q.re).toBe(0);
    expect(q.im).toBeCloseTo(rayleighRange(HeNe), 10);
  });

  it('beamRadiusFromQ recovers w₀ at waist', () => {
    const q = complexQ(HeNe, 0);
    const w = beamRadiusFromQ(q, HeNe.wavelength, HeNe.n);
    expect(w).toBeCloseTo(HeNe.waistRadius, 10);
  });

  it('beamRadiusFromQ matches beamRadius at arbitrary z', () => {
    const z = 0.3;
    const q = complexQ(HeNe, z);
    const wDirect = beamRadius(HeNe, z);
    const wFromQ = beamRadiusFromQ(q, HeNe.wavelength, HeNe.n);
    expect(wFromQ).toBeCloseTo(wDirect, 10);
  });

  it('wavefront radius at waist is infinite', () => {
    const q = complexQ(HeNe, 0);
    expect(wavefrontRadius(q)).toBe(Infinity);
  });

  it('wavefront radius at large z ≈ z', () => {
    const z = 100;
    const q = complexQ(HeNe, z);
    const R = wavefrontRadius(q);
    expect(R).toBeCloseTo(z, 1);
  });

  it('works with non-unity refractive index', () => {
    const glass: BeamParams = { wavelength: 633e-9, waistRadius: 0.5e-3, n: 1.5 };
    const zR = rayleighRange(glass);
    expect(zR).toBeCloseTo(Math.PI * (0.5e-3) ** 2 * 1.5 / 633e-9, 6);
  });
});
