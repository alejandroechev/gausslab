import { useCallback } from 'react';
import type { PropagationResult, BeamParams } from '@gausslab/engine';
import { rayleighRange, divergence, toCSV } from '@gausslab/engine';

interface Props {
  result: PropagationResult;
  beam: BeamParams;
}

function fmt(val: number, unit: string, decimals = 4): string {
  if (!Number.isFinite(val)) return '∞';
  if (Math.abs(val) < 1e-6) return `${(val * 1e9).toFixed(decimals)} n${unit}`;
  if (Math.abs(val) < 1e-3) return `${(val * 1e6).toFixed(decimals)} µ${unit}`;
  if (Math.abs(val) < 1) return `${(val * 1e3).toFixed(decimals)} m${unit}`;
  return `${val.toFixed(decimals)} ${unit}`;
}

function fmtAngle(rad: number): string {
  return `${(rad * 1e3).toFixed(3)} mrad`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="result-row">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function exportSectionCSV(rows: [string, string][], filename: string) {
  const csv = 'Parameter,Value\n' + rows.map(([l, v]) => `"${l}","${v}"`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ResultsPanel({ result, beam }: Props) {
  const { outputBeam, systemMatrix: sm } = result;
  const inputZR = rayleighRange(beam);
  const inputDiv = divergence(beam);

  const inputRows: [string, string][] = [
    ['Wavelength', fmt(beam.wavelength, 'm')],
    ['Waist w₀', fmt(beam.waistRadius, 'm')],
    ['Rayleigh range', fmt(inputZR, 'm')],
    ['Divergence', fmtAngle(inputDiv)],
  ];

  const outputRows: [string, string][] = [
    ["Waist w₀'", fmt(outputBeam.waistRadius, 'm')],
    ['Waist position', fmt(outputBeam.waistPosition, 'm')],
    ['Rayleigh range', fmt(outputBeam.rayleighRange, 'm')],
    ['Divergence', fmtAngle(outputBeam.divergence)],
    ['Magnification', outputBeam.magnification.toFixed(4) + '×'],
  ];

  const exportInputCSV = useCallback(() => exportSectionCSV(inputRows, 'gausslab-input-beam.csv'), [inputRows]);
  const exportOutputCSV = useCallback(() => exportSectionCSV(outputRows, 'gausslab-output-beam.csv'), [outputRows]);
  const exportPropagationCSV = useCallback(() => {
    const csv = toCSV(result);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gausslab-propagation.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return (
    <>
      <div className="section-header">
        <h2>Input Beam</h2>
        <button className="btn btn-sm" onClick={exportInputCSV} title="Export input beam CSV">📄 CSV</button>
      </div>
      {inputRows.map(([l, v]) => <Row key={l} label={l} value={v} />)}

      <div className="section-header">
        <h2>Output Beam</h2>
        <button className="btn btn-sm" onClick={exportOutputCSV} title="Export output beam CSV">📄 CSV</button>
      </div>
      {outputRows.map(([l, v]) => <Row key={l} label={l} value={v} />)}

      <h2 style={{ marginTop: 16 }}>System ABCD Matrix</h2>
      <div className="matrix-display">
        ⎡ {sm[0].toFixed(6)}  {sm[1].toFixed(6)} ⎤<br />
        ⎣ {sm[2].toFixed(6)}  {sm[3].toFixed(6)} ⎦
      </div>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
        det = {(sm[0] * sm[3] - sm[1] * sm[2]).toFixed(6)}
      </div>

      <div className="section-header" style={{ marginTop: 16 }}>
        <h2>Propagation Data</h2>
        <button className="btn btn-sm" onClick={exportPropagationCSV} title="Export propagation CSV">📄 CSV</button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{result.points.length} data points</div>
    </>
  );
}
