import type { PropagationResult } from './propagation.js';

/** Export propagation data as CSV string */
export function toCSV(result: PropagationResult): string {
  const header = 'z_m,w_m,R_m';
  const rows = result.points.map(
    (p) => `${p.z.toExponential(6)},${p.w.toExponential(6)},${Number.isFinite(p.R) ? p.R.toExponential(6) : 'Infinity'}`,
  );
  return [header, ...rows].join('\n');
}

/** Summary string for element list */
export function elementSummary(result: PropagationResult): string {
  return result.elements
    .map((e) => `z=${(e.z * 1000).toFixed(1)}mm: ${e.element.label}`)
    .join('\n');
}
