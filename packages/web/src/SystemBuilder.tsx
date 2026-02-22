import { useState } from 'react';

type ElementDef = { type: string; param: number; param2?: number };

interface Props {
  elements: ElementDef[];
  onChange: (els: ElementDef[]) => void;
}

const TYPES: Record<string, { label: string; paramLabel: string; defaultParam: number; hasParam2?: boolean; param2Label?: string; defaultParam2?: number }> = {
  'free-space': { label: 'Free Space', paramLabel: 'Distance (mm)', defaultParam: 100 },
  'thin-lens': { label: 'Thin Lens', paramLabel: 'Focal length (mm)', defaultParam: 100 },
  'curved-mirror': { label: 'Curved Mirror', paramLabel: 'Radius (mm)', defaultParam: 500 },
  'flat-interface': { label: 'Flat Interface', paramLabel: 'n₁', defaultParam: 1.0, hasParam2: true, param2Label: 'n₂', defaultParam2: 1.5 },
};

export function SystemBuilder({ elements, onChange }: Props) {
  const [newType, setNewType] = useState('free-space');
  const [newParam, setNewParam] = useState(100);
  const [newParam2, setNewParam2] = useState(1.5);

  const add = () => {
    const def: ElementDef = { type: newType, param: newParam * 1e-3 };
    if (TYPES[newType].hasParam2) {
      def.param = newParam; // refractive index, no conversion
      def.param2 = newParam2;
    }
    onChange([...elements, def]);
  };

  const remove = (i: number) => onChange(elements.filter((_, idx) => idx !== i));

  const moveUp = (i: number) => {
    if (i === 0) return;
    const copy = [...elements];
    [copy[i - 1], copy[i]] = [copy[i], copy[i - 1]];
    onChange(copy);
  };

  const typeInfo = TYPES[newType];

  return (
    <>
      <h2 style={{ marginTop: 24 }}>Optical System</h2>
      {elements.map((el, i) => (
        <div key={i} className="element-item">
          <span style={{ cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }} onClick={() => moveUp(i)}>⬆</span>
          <div className="el-info">
            <div className="el-type">{TYPES[el.type]?.label ?? el.type}</div>
            <div className="el-param">
              {el.type === 'flat-interface'
                ? `n₁=${el.param.toFixed(2)} → n₂=${(el.param2 ?? 1).toFixed(2)}`
                : `${(el.param * 1e3).toFixed(0)} mm`}
            </div>
          </div>
          <button onClick={() => remove(i)}>✕</button>
        </div>
      ))}
      <div className="add-element">
        <select value={newType} onChange={(e) => {
          setNewType(e.target.value);
          setNewParam(TYPES[e.target.value].defaultParam);
          if (TYPES[e.target.value].defaultParam2 !== undefined)
            setNewParam2(TYPES[e.target.value].defaultParam2!);
        }}>
          {Object.entries(TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div className="add-element">
        <input
          type="number"
          value={newParam}
          onChange={(e) => setNewParam(parseFloat(e.target.value))}
          placeholder={typeInfo.paramLabel}
          step={typeInfo.hasParam2 ? 0.01 : 10}
        />
        {typeInfo.hasParam2 && (
          <input
            type="number"
            value={newParam2}
            onChange={(e) => setNewParam2(parseFloat(e.target.value))}
            placeholder={typeInfo.param2Label}
            step={0.01}
          />
        )}
        <button className="btn btn-primary" onClick={add}>+ Add</button>
      </div>
    </>
  );
}
