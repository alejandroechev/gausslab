# GaussLab — Business Plan

## Product Summary

**GaussLab** is a free, browser-based Gaussian beam propagation tool using the ABCD ray transfer matrix method. It targets optical engineers, photonics researchers, and laser physicists who currently rely on expensive desktop software (Zemax OpticStudio ~$5K+, OSLO ~$3K) or limited free tools (Winlens, reZonator) for beam analysis.

**No browser-based competitor exists.** GaussLab is the first mover in this space.

## Current State

| Metric | Value |
|--------|-------|
| Tests | 28 total (0 unit + 28 E2E) |
| Engine correctness | ABCD matrix verified |
| Element types | 4 (free space, thin lens, curved mirror, flat interface) |
| Browser competitors | **None** |

### Market Validation Scores

| Signal | Score |
|--------|-------|
| Professional use case | 60% |
| Scales to premium | 50% |
| Useful at free tier | 75% |
| Incremental premium value | 55% |
| Major premium value | 70% |

### SWOT

| Strengths | Weaknesses |
|-----------|------------|
| Instant browser access, zero install | Paraxial approximation only |
| ABCD method correct & validated | 0 unit tests (all E2E) |
| 4 element types with beam visualization | No resonator cavity analysis |
| No browser competitor (first mover) | No tolerancing or aberration modeling |
| Free tier genuinely useful | Limited element library |

| Opportunities | Threats |
|--------------|---------|
| First mover in browser-based optics | Free desktop tools (reZonator) may add web UI |
| Photonics education market growing | Zemax could launch browser version |
| Premium features have clear value props | Domain requires deep physics credibility |
| Integration gap with existing tools | Small total addressable market |

## Competitive Landscape

| Tool | Price | Platform | Notes |
|------|-------|----------|-------|
| Zemax OpticStudio | ~$5,000+/yr | Desktop (Windows) | Industry standard, full ray tracing, sequential & non-sequential |
| OSLO | ~$3,000/yr | Desktop (Windows) | Full-featured optical design |
| Winlens | Free | Desktop (Windows) | Basic lens design, limited beam analysis |
| reZonator | Free | Desktop (cross-platform) | Resonator analysis, ABCD matrices |
| **GaussLab** | **Free** | **Browser** | **Only browser-based ABCD beam propagation tool** |

## Revenue Model

### Free Tier (Current)
- Gaussian beam propagation through optical systems
- 4 element types: free space, thin lens, curved mirror, flat interface
- Interactive beam visualization with drag-and-drop
- Beam waist, divergence, and Rayleigh range computation
- Unlimited systems, no account required

### Phase 2 — Pro Tier ($149–249/yr)

| Feature | Size | Description |
|---------|------|-------------|
| Resonator cavity analysis | L | Stable/unstable cavity modes, round-trip ABCD, stability diagram |
| Thermal lensing | M | Thermal lens effects in gain media and optical elements |
| M² beam quality factor | M | Real beam propagation with M² > 1, embedded Gaussian model |
| Export beam data | M | CSV/JSON export of beam parameters along propagation axis |
| More elements (prisms, gratings) | L | Dispersive elements, diffraction gratings, prism pairs |

**Target users:** Graduate students, postdocs, small-lab researchers who need more than basic ABCD but can't justify Zemax pricing.

### Phase 3 — Enterprise Tier ($349–599/yr)

| Feature | Size | Description |
|---------|------|-------------|
| Tolerance analysis | L | Monte Carlo and worst-case sensitivity analysis on element parameters |
| Aberration modeling | XL | Third-order aberrations, wavefront error, Zernike decomposition |
| Fiber coupling optimization | L | Mode matching, coupling efficiency, alignment sensitivity |
| Multi-wavelength analysis | M | Simultaneous beam propagation at multiple wavelengths |
| Zemax import/export | L | Read/write Zemax .zmx files for interoperability |

**Target users:** Photonics companies, R&D labs, defense/aerospace optics groups who need browser-based collaboration and Zemax interoperability.

## Go-to-Market Strategy

### Phase 1: Free Tier Growth
1. **SEO:** Target "gaussian beam calculator", "ABCD matrix calculator", "beam propagation online"
2. **Academic adoption:** Submit to optics course resource lists (MIT OCW, Coursera photonics)
3. **Content marketing:** Tutorial blog posts on beam expander design, mode matching, cavity stability
4. **Community:** Reddit r/optics, r/photonics, Photonics Media forums

### Phase 2: Pro Conversion
1. **Freemium gate:** Resonator analysis and export as upgrade triggers
2. **Education discount:** 50% off for .edu email addresses
3. **Lab licenses:** Multi-seat pricing for research groups (5-pack, 10-pack)

### Phase 3: Enterprise Sales
1. **Zemax migration path:** Import existing designs, lower switching cost
2. **Team features:** Shared workspaces, design versioning, annotation
3. **Compliance:** Export control awareness (ITAR-free, no restricted algorithms)

## Key Metrics

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target |
|--------|---------------|----------------|----------------|
| Monthly active users | 500 | 2,000 | 5,000 |
| Paid subscribers | — | 50 | 200 |
| ARR | $0 | $10K | $80K |
| Unit test coverage | 80%+ | 90%+ | 90%+ |
| NPS | 40+ | 50+ | 50+ |

## Unique Advantage

**There is no browser-based Gaussian beam propagation tool.** Every competitor is desktop-only. GaussLab owns this niche by default and has the opportunity to establish brand authority before incumbents react. The paraxial ABCD method covers 80%+ of practical beam design tasks, making the free tier genuinely useful rather than a crippled demo.

## Technical Roadmap

### Immediate (Phase 1 Hardening)
- Add unit test coverage for engine (target 80%+)
- Validate against Saleh & Teich textbook examples
- Add beam parameter table (w, R, zR at each element)
- Polish beam visualization (scale bars, annotations)

### Medium-term (Phase 2 Features)
- Resonator stability analysis (g₁g₂ diagram)
- Thermal lens model (dn/dT, absorption heating)
- M² beam quality propagation
- Prism and grating elements with dispersion
- CSV/JSON export

### Long-term (Phase 3 Features)
- Tolerance analysis engine (Monte Carlo)
- Third-order aberration module
- Fiber coupling mode overlap integral
- Multi-wavelength propagation
- Zemax .zmx file parser and writer
