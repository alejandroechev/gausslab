import { useMemo, useCallback } from 'react';
import type { PropagationResult } from '@gausslab/engine';
import { toCSV } from '@gausslab/engine';

interface Props {
  result: PropagationResult;
  theme: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function BeamDiagram({ result, theme }: Props) {
  const { points, elements } = result;

  const exportPNG = useCallback(() => {
    const svg = document.querySelector('.diagram-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = theme === 'dark' ? '#1c1c1e' : '#f5f5f7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
      const a = document.createElement('a');
      a.download = 'gausslab-diagram.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [theme]);

  const exportSVG = useCallback(() => {
    const svg = document.querySelector('.diagram-container svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    downloadBlob(new Blob([svgData], { type: 'image/svg+xml' }), 'gausslab-diagram.svg');
  }, []);

  const diagram = useMemo(() => {
    if (points.length < 2) return null;

    const labelAreaHeight = 46;
    const padding = { top: 40 + labelAreaHeight, bottom: 50, left: 60, right: 30 };
    const width = 800;
    const height = 400 + labelAreaHeight;
    const plotW = width - padding.left - padding.right;
    const plotH = height - padding.top - padding.bottom;
    const plotCenterY = padding.top + plotH / 2;

    const zMin = points[0].z;
    const zMax = points[points.length - 1].z;
    const wMax = Math.max(...points.map((p) => p.w));

    if (zMax <= zMin || wMax <= 0) return null;

    const scaleZ = (z: number) => padding.left + ((z - zMin) / (zMax - zMin)) * plotW;
    const scaleW = (w: number) => plotCenterY - (w / wMax) * (plotH / 2);
    const scaleWNeg = (w: number) => plotCenterY + (w / wMax) * (plotH / 2);

    // Beam envelope (upper and lower)
    const upperPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleZ(p.z).toFixed(1)},${scaleW(p.w).toFixed(1)}`).join(' ');
    const lowerPath = [...points].reverse().map((p, i) => `${i === 0 ? 'L' : 'L'}${scaleZ(p.z).toFixed(1)},${scaleWNeg(p.w).toFixed(1)}`).join(' ');
    const fillPath = upperPath + ' ' + lowerPath + ' Z';

    const axisColor = theme === 'dark' ? '#98989d' : '#6e6e73';
    const beamColor = theme === 'dark' ? '#0a84ff' : '#0071e3';
    const beamFill = theme === 'dark' ? 'rgba(10,132,255,0.15)' : 'rgba(0,113,227,0.12)';
    const gridColor = theme === 'dark' ? '#3a3a3c' : '#e5e5ea';
    const elColor = theme === 'dark' ? '#ff9f0a' : '#ff9500';

    // Grid lines
    const zTicks = 5;
    const wTicks = 4;
    const zGridLines = Array.from({ length: zTicks + 1 }, (_, i) => zMin + (i / zTicks) * (zMax - zMin));
    const wGridLines = Array.from({ length: wTicks + 1 }, (_, i) => (i / wTicks) * wMax);

    const formatZ = (z: number) => (z * 1e3).toFixed(0);
    const formatW = (w: number) => (w * 1e3).toFixed(2);

    // Stagger element labels above the plot area to avoid overlaps
    const labelBaseY = padding.top - labelAreaHeight;
    const labelRowHeight = 12;
    const labelPositions: { x: number; row: number }[] = [];
    const minLabelSpacing = 60; // min px between labels on same row
    for (const el of elements) {
      const x = scaleZ(el.z);
      let row = 0;
      // find a row where this label doesn't collide
      while (labelPositions.some((lp) => lp.row === row && Math.abs(lp.x - x) < minLabelSpacing)) {
        row++;
      }
      labelPositions.push({ x, row });
    }

    return (
      <svg viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" data-testid="beam-svg">
        {/* Grid */}
        {zGridLines.map((z, i) => (
          <line key={`zg${i}`} x1={scaleZ(z)} x2={scaleZ(z)} y1={padding.top} y2={height - padding.bottom} stroke={gridColor} strokeWidth={0.5} />
        ))}
        {wGridLines.map((w, i) => (
          <g key={`wg${i}`}>
            <line x1={padding.left} x2={width - padding.right} y1={scaleW(w)} y2={scaleW(w)} stroke={gridColor} strokeWidth={0.5} />
            {w > 0 && <line x1={padding.left} x2={width - padding.right} y1={scaleWNeg(w)} y2={scaleWNeg(w)} stroke={gridColor} strokeWidth={0.5} />}
          </g>
        ))}

        {/* Optical axis */}
        <line x1={padding.left} x2={width - padding.right} y1={plotCenterY} y2={plotCenterY} stroke={axisColor} strokeWidth={1} strokeDasharray="4,4" />

        {/* Beam fill */}
        <path d={fillPath} fill={beamFill} />

        {/* Beam envelope lines */}
        <path d={upperPath} fill="none" stroke={beamColor} strokeWidth={2} />
        <path d={points.map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleZ(p.z).toFixed(1)},${scaleWNeg(p.w).toFixed(1)}`).join(' ')} fill="none" stroke={beamColor} strokeWidth={2} />

        {/* Element markers with staggered labels above diagram */}
        {elements.map((el, i) => {
          const x = scaleZ(el.z);
          const row = labelPositions[i]?.row ?? 0;
          const labelY = labelBaseY + row * labelRowHeight + 10;
          return (
            <g key={`el${i}`}>
              <line x1={x} x2={x} y1={padding.top} y2={height - padding.bottom - 10} stroke={elColor} strokeWidth={2} strokeDasharray={el.element.length > 0 ? 'none' : '6,3'} />
              {/* Leader line from label to plot top */}
              <line x1={x} x2={x} y1={labelY + 2} y2={padding.top} stroke={elColor} strokeWidth={0.5} strokeDasharray="2,2" opacity={0.5} />
              <text x={x} y={labelY} textAnchor="middle" fontSize={9} fill={elColor} data-testid="element-label">{el.element.label}</text>
            </g>
          );
        })}

        {/* Z axis labels */}
        {zGridLines.map((z, i) => (
          <text key={`zt${i}`} x={scaleZ(z)} y={height - padding.bottom + 18} textAnchor="middle" fontSize={10} fill={axisColor}>{formatZ(z)}</text>
        ))}
        <text x={width / 2} y={height - 8} textAnchor="middle" fontSize={11} fill={axisColor}>z (mm)</text>

        {/* W axis labels */}
        {wGridLines.filter((w) => w > 0).map((w, i) => (
          <g key={`wt${i}`}>
            <text x={padding.left - 6} y={scaleW(w) + 4} textAnchor="end" fontSize={10} fill={axisColor} data-testid="w-axis-label">{formatW(w)}</text>
            <text x={padding.left - 6} y={scaleWNeg(w) + 4} textAnchor="end" fontSize={10} fill={axisColor}>-{formatW(w)}</text>
          </g>
        ))}
        <text x={14} y={plotCenterY} textAnchor="middle" fontSize={11} fill={axisColor} transform={`rotate(-90,14,${plotCenterY})`}>w (mm)</text>
      </svg>
    );
  }, [points, elements, theme]);

  return (
    <>
      {diagram}
      <div className="diagram-export-buttons">
        <button className="btn btn-sm" onClick={exportPNG} title="Export PNG">🖼️ PNG</button>
        <button className="btn btn-sm" onClick={exportSVG} title="Export SVG">📐 SVG</button>
      </div>
    </>
  );
}
