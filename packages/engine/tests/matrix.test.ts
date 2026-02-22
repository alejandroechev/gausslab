import { describe, it, expect } from 'vitest';
import { freeSpace, thinLens, curvedMirror, flatInterface, curvedInterface, multiply, systemMatrix, type Matrix2x2 } from '../src/matrix.js';

describe('E2: ABCD matrices', () => {
  it('free space matrix', () => {
    const m = freeSpace(0.5);
    expect(m).toEqual([1, 0.5, 0, 1]);
  });

  it('thin lens matrix', () => {
    const m = thinLens(0.1);
    expect(m).toEqual([1, 0, -10, 1]);
  });

  it('curved mirror matrix', () => {
    const m = curvedMirror(0.5);
    expect(m).toEqual([1, 0, -4, 1]);
  });

  it('flat interface matrix', () => {
    const m = flatInterface(1.0, 1.5);
    expect(m[0]).toBe(1);
    expect(m[1]).toBe(0);
    expect(m[2]).toBe(0);
    expect(m[3]).toBeCloseTo(1.0 / 1.5, 10);
  });

  it('curved interface matrix', () => {
    const m = curvedInterface(1.0, 1.5, 0.1);
    expect(m[0]).toBe(1);
    expect(m[1]).toBe(0);
    expect(m[2]).toBeCloseTo((1.0 - 1.5) / (1.5 * 0.1), 10);
    expect(m[3]).toBeCloseTo(1.0 / 1.5, 10);
  });

  it('multiply identity gives same matrix', () => {
    const id: Matrix2x2 = [1, 0, 0, 1];
    const m = thinLens(0.2);
    expect(multiply(id, m)).toEqual(m);
    expect(multiply(m, id)).toEqual(m);
  });

  it('two free spaces multiply correctly', () => {
    const m = multiply(freeSpace(0.3), freeSpace(0.2));
    expect(m[0]).toBeCloseTo(1, 10);
    expect(m[1]).toBeCloseTo(0.5, 10);
    expect(m[2]).toBeCloseTo(0, 10);
    expect(m[3]).toBeCloseTo(1, 10);
  });

  it('telescope system: 4f system magnification', () => {
    // f1=100mm, f2=200mm, distance = f1+f2
    const f1 = 0.1, f2 = 0.2;
    const sys = systemMatrix([
      freeSpace(f1),
      thinLens(f1),
      freeSpace(f1 + f2),
      thinLens(f2),
      freeSpace(f2),
    ]);
    // A should be -f2/f1 = -2, D should be -f1/f2 = -0.5
    expect(sys[0]).toBeCloseTo(-f2 / f1, 6);
    expect(sys[3]).toBeCloseTo(-f1 / f2, 6);
    // B ≈ 0 for afocal system
    expect(sys[1]).toBeCloseTo(0, 6);
  });

  it('systemMatrix of empty list is identity', () => {
    expect(systemMatrix([])).toEqual([1, 0, 0, 1]);
  });

  it('systemMatrix of single element returns that element', () => {
    const m = thinLens(0.3);
    expect(systemMatrix([m])).toEqual(m);
  });

  it('ABCD matrix determinant is 1 for free space and thin lens', () => {
    const fs = freeSpace(0.5);
    expect(fs[0] * fs[3] - fs[1] * fs[2]).toBeCloseTo(1, 10);
    const tl = thinLens(0.2);
    expect(tl[0] * tl[3] - tl[1] * tl[2]).toBeCloseTo(1, 10);
  });
});
