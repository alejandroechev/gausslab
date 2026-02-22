interface Props {
  wavelength: number;
  waistRadius: number;
  waistPosition: number;
  onWavelengthChange: (v: number) => void;
  onWaistRadiusChange: (v: number) => void;
  onWaistPositionChange: (v: number) => void;
}

export function BeamInput({ wavelength, waistRadius, waistPosition, onWavelengthChange, onWaistRadiusChange, onWaistPositionChange }: Props) {
  return (
    <>
      <h2>Input Beam</h2>
      <div className="field">
        <label>Wavelength (nm)</label>
        <input
          type="number"
          value={+(wavelength * 1e9).toFixed(1)}
          onChange={(e) => onWavelengthChange(parseFloat(e.target.value) * 1e-9)}
          min={100}
          max={20000}
          step={1}
        />
      </div>
      <div className="field">
        <label>Beam waist w₀ (mm)</label>
        <input
          type="number"
          value={+(waistRadius * 1e3).toFixed(3)}
          onChange={(e) => onWaistRadiusChange(parseFloat(e.target.value) * 1e-3)}
          min={0.001}
          step={0.01}
        />
      </div>
      <div className="field">
        <label>Waist position (mm from start)</label>
        <input
          type="number"
          value={+(waistPosition * 1e3).toFixed(1)}
          onChange={(e) => onWaistPositionChange(parseFloat(e.target.value) * 1e-3)}
          step={1}
        />
      </div>
    </>
  );
}
