/** Gaussian beam parameters */
export interface BeamParams {
  /** Wavelength in meters */
  wavelength: number;
  /** Beam waist radius in meters */
  waistRadius: number;
  /** Refractive index of medium */
  n: number;
}

/** Rayleigh range: zR = π·w₀²·n / λ */
export function rayleighRange(p: BeamParams): number {
  return (Math.PI * p.waistRadius ** 2 * p.n) / p.wavelength;
}

/** Beam radius at distance z from waist: w(z) = w₀·√(1 + (z/zR)²) */
export function beamRadius(p: BeamParams, z: number): number {
  const zR = rayleighRange(p);
  return p.waistRadius * Math.sqrt(1 + (z / zR) ** 2);
}

/** Half-angle divergence (far field): θ = λ / (π·w₀·n) */
export function divergence(p: BeamParams): number {
  return p.wavelength / (Math.PI * p.waistRadius * p.n);
}

/** Complex beam parameter: q(z) = z + i·zR */
export function complexQ(p: BeamParams, z: number): { re: number; im: number } {
  return { re: z, im: rayleighRange(p) };
}

/** Extract beam radius from complex q: w² = -λ / (π·n·Im(1/q)) */
export function beamRadiusFromQ(q: { re: number; im: number }, wavelength: number, n: number): number {
  const denom = q.re ** 2 + q.im ** 2;
  const imInvQ = -q.im / denom;
  return Math.sqrt(-wavelength / (Math.PI * n * imInvQ));
}

/** Extract wavefront radius from complex q: R = 1 / Re(1/q) */
export function wavefrontRadius(q: { re: number; im: number }): number {
  const denom = q.re ** 2 + q.im ** 2;
  const reInvQ = q.re / denom;
  if (Math.abs(reInvQ) < 1e-30) return Infinity;
  return 1 / reInvQ;
}
