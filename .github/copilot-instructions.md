---
applyTo: "**"
---
# BeamLab — Gaussian Beam Propagation (ABCD Matrix)

## Domain
- Gaussian beam propagation through optical systems
- ABCD ray transfer matrix method
- Complex beam parameter transformation
- Beam waist, Rayleigh range, and divergence computation

## Key Equations
- Rayleigh range: `zR = πw₀²n/λ`
- Beam radius: `w(z) = w₀√(1 + (z/zR)²)`
- Complex beam parameter: `q = z + izR`, `1/q = 1/R - iλ/(πw²)`
- ABCD transform: `q' = (Aq + B) / (Cq + D)`
- Extract w from q: `w² = -λ / (π × Im(1/q))`

## ABCD Matrices
- Free space (d): `[[1,d],[0,1]]`
- Thin lens (f): `[[1,0],[-1/f,1]]`
- Curved mirror (R): `[[1,0],[-2/R,1]]`
- Flat interface (n1→n2): `[[1,0],[0,n1/n2]]`

## Validation Sources
- Saleh & Teich "Fundamentals of Photonics" worked examples
- Hecht "Optics" textbook problems
- Known beam expander and telescope magnification ratios



# Code Implementation Flow

<important>Mandatory Development Loop (non-negotiable)</important>

## Git Workflow
- **Work directly on master** — solo developer, no branch overhead
- **Commit after every completed unit of work** — never leave working code uncommitted
- **Push after each work session** — remote backup is non-negotiable
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint
- **Branch only for risky experiments** you might discard — delete after merge or abandon

## Preparation & Definitions
- Use Typescript as default language, unless told otherwise
- Work using TDD with red/green flow ALWAYS
- If its a webapp: Add always Playwright E2E tests
- Separate domain logic from CLI/UI/WebAPI, unless told otherwise
- Every UI/WebAPI feature should have parity with a CLI way of testing that feature

## Validation
After completing any feature:
- Run all new unit tests, validate coverage is over 90%
- Use cli to test new feature
- If its a UI impacting feature: run all e2e tests
- If its a UI impacting feature: do a visual validation using Playwright MCP, take screenshots as you tests and review the screenshots to verify visually all e2e flows and the new feature. <important>If Playwright MCP is not available stop and let the user know</important>

If any of the validations step fail, fix the underlying issue.

## Finishing
- Update documentation for the project based on changes
- <important>Always commit after you finish your work with a message that explain both what is done, the context and a trail of the though process you made </important>


# Deployment

- git push master branch will trigger CI/CD in Github
- CI/CD in Github will run tests, if they pass it will be deployed to Vercel https://gausslab.vercel.app/
- Umami analytics and Feedback form with Supabase database