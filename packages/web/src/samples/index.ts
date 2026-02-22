export interface SampleConfig {
  id: string;
  name: string;
  description: string;
  data: {
    wavelength: number;
    beamWaist: number;
    waistPosition: number;
    elements: { type: string; param: number; param2?: number }[];
  };
}

export const SAMPLES: SampleConfig[] = [
  {
    id: 'simple-focusing',
    name: 'Simple Focusing Lens',
    description: 'HeNe 633 nm, w₀=1 mm focused by a thin lens f=100 mm. Output waist forms near the focal point.',
    data: {
      wavelength: 633e-9,
      beamWaist: 1e-3,
      waistPosition: 0,
      elements: [
        { type: 'free-space', param: 0.2 },
        { type: 'thin-lens', param: 0.1 },
        { type: 'free-space', param: 0.15 },
      ],
    },
  },
  {
    id: 'galilean-expander',
    name: '2× Beam Expander (Galilean)',
    description: 'Nd:YAG 1064 nm expanded 2× using a negative lens f=−50 mm and positive lens f=100 mm separated by 50 mm.',
    data: {
      wavelength: 1064e-9,
      beamWaist: 0.5e-3,
      waistPosition: 0,
      elements: [
        { type: 'free-space', param: 0.05 },
        { type: 'thin-lens', param: -0.05 },
        { type: 'free-space', param: 0.05 },
        { type: 'thin-lens', param: 0.1 },
        { type: 'free-space', param: 0.15 },
      ],
    },
  },
  {
    id: 'fiber-coupling',
    name: 'Fiber Coupling System',
    description: '850 nm source collimated by f=10 mm lens, then focused by f=5 mm lens to couple into single-mode fiber (w₀≈5 µm).',
    data: {
      wavelength: 850e-9,
      beamWaist: 5e-6,
      waistPosition: 0,
      elements: [
        { type: 'free-space', param: 0.01 },
        { type: 'thin-lens', param: 0.01 },
        { type: 'free-space', param: 0.08 },
        { type: 'thin-lens', param: 0.005 },
        { type: 'free-space', param: 0.006 },
      ],
    },
  },
  {
    id: 'resonator-cavity',
    name: 'Resonator Cavity',
    description: 'Stable cavity formed by two curved mirrors (R=200 mm) separated by 150 mm. HeNe 633 nm cavity mode.',
    data: {
      wavelength: 633e-9,
      beamWaist: 0.2e-3,
      waistPosition: 0,
      elements: [
        { type: 'curved-mirror', param: 0.2 },
        { type: 'free-space', param: 0.15 },
        { type: 'curved-mirror', param: 0.2 },
        { type: 'free-space', param: 0.15 },
      ],
    },
  },
  {
    id: 'relay-imaging',
    name: '1:1 Relay Imaging',
    description: '532 nm beam relayed 1:1 by two identical f=75 mm lenses in a 4f configuration (lens spacing = 2f).',
    data: {
      wavelength: 532e-9,
      beamWaist: 0.3e-3,
      waistPosition: 0,
      elements: [
        { type: 'free-space', param: 0.075 },
        { type: 'thin-lens', param: 0.075 },
        { type: 'free-space', param: 0.15 },
        { type: 'thin-lens', param: 0.075 },
        { type: 'free-space', param: 0.075 },
      ],
    },
  },
];
