# GaussLab — Gaussian Beam Propagation (ABCD Matrix)

## Mission
Replace Paraxia (abandoned) and Excel with an interactive web tool for laser beam propagation.

## Architecture
- `packages/engine/` — ABCD ray transfer matrices, Gaussian beam propagation, complex beam parameter
- `packages/web/` — React + Vite, optical system builder, beam propagation diagram
- `packages/cli/` — Node runner for batch calculations

## MVP Features (Free Tier)
1. Define input beam (wavelength, beam waist w₀, waist position)
2. Build optical system: free space, thin lens, curved mirror, flat interface
3. Compute beam radius w(z) and wavefront radius R(z) through the system
4. Display beam propagation diagram (w vs z plot)
5. Show output beam parameters (new waist, position, Rayleigh range)
6. Export propagation data as CSV + diagram as PNG

## Engine Tasks

### E1: Gaussian Beam Parameters
- Rayleigh range: `zR = πw₀²n/λ`
- Beam radius: `w(z) = w₀√(1 + (z/zR)²)`
- Complex beam parameter: `q = z + izR`
- **Validation**: Saleh & Teich textbook

### E2: ABCD Matrices
- Free space: `[[1,d],[0,1]]`
- Thin lens: `[[1,0],[-1/f,1]]`
- Curved mirror: `[[1,0],[-2/R,1]]`
- Interface: `[[1,0],[0,n1/n2]]`
- System: `M = Mₙ × ... × M₁`
- **Validation**: Known system matrices

### E3: Beam Propagation
- Transform: `q' = (Aq+B)/(Cq+D)`
- Extract w,R from q at each z position
- **Validation**: Single lens focusing → known waist

### E4: Output Parameters
- New waist position, size, Rayleigh range, divergence, magnification

### E5: Export
- z, w(z), R(z) arrays, element summary, CSV

## Key Equations
- `zR = πw₀²n/λ`, `q' = (Aq+B)/(Cq+D)`, `w² = -λ/(π×Im(1/q))`

## Validation: Saleh & Teich, Hecht "Optics" worked examples
