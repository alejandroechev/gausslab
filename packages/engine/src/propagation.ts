import { type Matrix2x2, freeSpace, systemMatrix, multiply } from './matrix.js';
import { type BeamParams, complexQ, beamRadiusFromQ, wavefrontRadius, rayleighRange, divergence } from './beam.js';

/** An optical element with its ABCD matrix and physical length along z */
export interface OpticalElement {
  type: 'free-space' | 'thin-lens' | 'curved-mirror' | 'flat-interface' | 'curved-interface';
  label: string;
  matrix: Matrix2x2;
  length: number; // physical extent along z (0 for thin elements)
  params: Record<string, number>;
}

export interface PropagationPoint {
  z: number;
  w: number;
  R: number;
}

export interface PropagationResult {
  points: PropagationPoint[];
  systemMatrix: Matrix2x2;
  outputBeam: OutputBeamParams;
  elements: { z: number; element: OpticalElement }[];
}

export interface OutputBeamParams {
  waistRadius: number;
  waistPosition: number;
  rayleighRange: number;
  divergence: number;
  magnification: number;
}

/** Transform complex q through ABCD matrix: q' = (A·q + B) / (C·q + D) */
export function transformQ(
  q: { re: number; im: number },
  m: Matrix2x2,
): { re: number; im: number } {
  const [A, B, C, D] = m;
  // (A·q + B) / (C·q + D) with complex arithmetic
  const numRe = A * q.re + B;
  const numIm = A * q.im;
  const denRe = C * q.re + D;
  const denIm = C * q.im;
  const denMag2 = denRe ** 2 + denIm ** 2;
  return {
    re: (numRe * denRe + numIm * denIm) / denMag2,
    im: (numIm * denRe - numRe * denIm) / denMag2,
  };
}

/** Propagate beam through a sequence of optical elements, sampling at given step size */
export function propagate(
  beam: BeamParams,
  waistPosition: number,
  elements: OpticalElement[],
  stepSize: number = 0.001,
): PropagationResult {
  const points: PropagationPoint[] = [];
  const elementPositions: { z: number; element: OpticalElement }[] = [];

  // Initial q at z = 0 (which is at distance -waistPosition from waist)
  const q0 = complexQ(beam, -waistPosition);
  let currentQ = q0;
  let z = 0;

  // Record initial point
  const w0 = beamRadiusFromQ(currentQ, beam.wavelength, beam.n);
  const R0 = wavefrontRadius(currentQ);
  points.push({ z, w: w0, R: R0 });

  // Track cumulative matrix for system matrix computation
  const matrices: Matrix2x2[] = [];

  for (const el of elements) {
    elementPositions.push({ z, element: el });

    if (el.length > 0) {
      // Extended element (free space): sample along it
      const nSteps = Math.max(1, Math.round(el.length / stepSize));
      const dz = el.length / nSteps;
      const stepMatrix = freeSpace(dz);

      for (let i = 0; i < nSteps; i++) {
        currentQ = transformQ(currentQ, stepMatrix);
        z += dz;
        const w = beamRadiusFromQ(currentQ, beam.wavelength, beam.n);
        const R = wavefrontRadius(currentQ);
        points.push({ z, w, R });
      }
      matrices.push(el.matrix);
    } else {
      // Thin element: apply matrix at this point
      currentQ = transformQ(currentQ, el.matrix);
      matrices.push(el.matrix);
      const w = beamRadiusFromQ(currentQ, beam.wavelength, beam.n);
      const R = wavefrontRadius(currentQ);
      points.push({ z, w, R });
    }
  }

  const sysMat = matrices.length > 0 ? systemMatrix(matrices) : ([1, 0, 0, 1] as Matrix2x2);

  // Compute output beam parameters from final q
  const finalQ = currentQ;
  const outputW = beamRadiusFromQ(finalQ, beam.wavelength, beam.n);
  const outputZR = Math.abs(finalQ.im);
  const outputWaist = Math.sqrt((beam.wavelength * outputZR) / (Math.PI * beam.n));
  const outputWaistPos = z - finalQ.re; // waist is at z - Re(q) from current position

  const outputBeam: OutputBeamParams = {
    waistRadius: outputWaist,
    waistPosition: outputWaistPos,
    rayleighRange: outputZR,
    divergence: beam.wavelength / (Math.PI * outputWaist * beam.n),
    magnification: outputWaist / beam.waistRadius,
  };

  return { points, systemMatrix: sysMat, outputBeam, elements: elementPositions };
}
