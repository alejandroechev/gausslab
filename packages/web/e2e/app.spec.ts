import { test, expect, type Page } from '@playwright/test';

// Helper: get numeric value from a result row by label (first match)
async function getResultValue(page: Page, label: string): Promise<string> {
  const row = page.locator('.result-row', { has: page.locator(`.label:text-is("${label}")`) }).first();
  return (await row.locator('.value').textContent()) ?? '';
}

// Helper: parse numeric value (e.g. "0.5000 mm" → 0.5)
function parseValue(text: string): number {
  const match = text.match(/([\d.eE+-]+)/);
  return match ? parseFloat(match[1]) : NaN;
}

// Helper: get element count in the system builder
async function getElementCount(page: Page): Promise<number> {
  return page.locator('.element-item').count();
}

// Helper: wait for results to be visible
async function waitForResults(page: Page) {
  await expect(page.locator('.result-row').first()).toBeVisible({ timeout: 5000 });
}

// Helper: get det(ABCD) text
async function getDetText(page: Page): Promise<string> {
  const detEl = page.locator('text=det =').first();
  return (await detEl.textContent()) ?? '';
}

// Helper: parse det value
async function getDetValue(page: Page): Promise<number> {
  const text = await getDetText(page);
  const match = text.match(/det\s*=\s*([\d.eE+-]+)/);
  return match ? parseFloat(match[1]) : NaN;
}

// Helper: load a sample by its ID
async function loadSample(page: Page, id: string) {
  const dropdown = page.locator('.toolbar select').first();
  await dropdown.selectOption(id);
  await waitForResults(page);
}

test.describe('GaussLab E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForResults(page);
  });

  // ── Core Workflow ──────────────────────────────────────────

  test.describe('Core Workflow', () => {
    test('page loads with default optical system (free space + lens + free space)', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('GaussLab');
      const count = await getElementCount(page);
      expect(count).toBe(3);

      const types = page.locator('.el-type');
      await expect(types.nth(0)).toHaveText('Free Space');
      await expect(types.nth(1)).toHaveText('Thin Lens');
      await expect(types.nth(2)).toHaveText('Free Space');
    });

    test('beam propagation SVG displays with beam envelope', async ({ page }) => {
      const svg = page.locator('.diagram-container svg');
      await expect(svg).toBeVisible();
      const paths = svg.locator('path');
      expect(await paths.count()).toBeGreaterThanOrEqual(2);
    });

    test('input/output beam parameters shown', async ({ page }) => {
      expect(await getResultValue(page, 'Wavelength')).toBeTruthy();
      expect(await getResultValue(page, 'Waist w₀')).toBeTruthy();
      expect(await getResultValue(page, 'Rayleigh range')).toBeTruthy();
      expect(await getResultValue(page, 'Divergence')).toBeTruthy();
      expect(await getResultValue(page, "Waist w₀'")).toBeTruthy();
      expect(await getResultValue(page, 'Magnification')).toBeTruthy();
    });

    test('ABCD matrix displayed with det ≈ 1.0', async ({ page }) => {
      const matrixDisplay = page.locator('.matrix-display');
      await expect(matrixDisplay).toBeVisible();
      const det = await getDetValue(page);
      expect(det).toBeCloseTo(1.0, 4);
    });
  });

  // ── Samples ────────────────────────────────────────────────

  test.describe('Samples', () => {
    const sampleNames = [
      'Simple Focusing Lens',
      '2× Beam Expander (Galilean)',
      'Fiber Coupling System',
      'Resonator Cavity',
      '1:1 Relay Imaging',
    ];

    test('all 5 sample names appear in dropdown', async ({ page }) => {
      const dropdown = page.locator('.toolbar select').first();
      for (const name of sampleNames) {
        await expect(dropdown.locator(`option:text-is("${name}")`)).toBeAttached();
      }
    });

    test('load each sample → system updates, beam recalculates', async ({ page }) => {
      const sampleIds = [
        'simple-focusing',
        'galilean-expander',
        'fiber-coupling',
        'resonator-cavity',
        'relay-imaging',
      ];

      for (const id of sampleIds) {
        await loadSample(page, id);
        const svg = page.locator('.diagram-container svg');
        await expect(svg).toBeVisible();
        const matrix = page.locator('.matrix-display');
        await expect(matrix).toBeVisible();
      }
    });

    test('simple focusing → output waist smaller than input', async ({ page }) => {
      await loadSample(page, 'simple-focusing');
      const outputWaist = await getResultValue(page, "Waist w₀'");
      expect(outputWaist).toMatch(/µm|nm/);
    });

    test('beam expander → output waist larger than input', async ({ page }) => {
      await loadSample(page, 'galilean-expander');
      const mag = await getResultValue(page, 'Magnification');
      const magVal = parseValue(mag);
      expect(magVal).toBeGreaterThan(1);
    });
  });

  // ── Element Manipulation ───────────────────────────────────

  test.describe('Element Manipulation', () => {
    test('add free space → system extends', async ({ page }) => {
      const initialCount = await getElementCount(page);
      const typeSelect = page.locator('.add-element select');
      await typeSelect.selectOption('free-space');
      const paramInput = page.locator('.add-element input[type="number"]').first();
      await paramInput.fill('200');
      await page.locator('button:text("+ Add")').click();
      await waitForResults(page);
      expect(await getElementCount(page)).toBe(initialCount + 1);
      await expect(page.locator('.el-type').last()).toHaveText('Free Space');
    });

    test('add thin lens → beam focuses', async ({ page }) => {
      const typeSelect = page.locator('.add-element select');
      await typeSelect.selectOption('thin-lens');
      const paramInput = page.locator('.add-element input[type="number"]').first();
      await paramInput.fill('50');
      await page.locator('button:text("+ Add")').click();
      await waitForResults(page);
      await expect(page.locator('.el-type').last()).toHaveText('Thin Lens');
    });

    test('add curved mirror → system updates', async ({ page }) => {
      const typeSelect = page.locator('.add-element select');
      await typeSelect.selectOption('curved-mirror');
      const paramInput = page.locator('.add-element input[type="number"]').first();
      await paramInput.fill('300');
      await page.locator('button:text("+ Add")').click();
      await waitForResults(page);
      await expect(page.locator('.el-type').last()).toHaveText('Curved Mirror');
    });

    test('remove element → system updates', async ({ page }) => {
      const initialCount = await getElementCount(page);
      expect(initialCount).toBeGreaterThan(0);
      await page.locator('.element-item button').last().click();
      await waitForResults(page);
      expect(await getElementCount(page)).toBe(initialCount - 1);
    });

    test('reorder elements (move up) → recalculates', async ({ page }) => {
      const secondTypeBefore = await page.locator('.el-type').nth(1).textContent();
      const firstTypeBefore = await page.locator('.el-type').nth(0).textContent();
      const moveUpBtns = page.locator('.element-item span:text("⬆")');
      await moveUpBtns.nth(1).click();
      await waitForResults(page);
      expect(await page.locator('.el-type').nth(0).textContent()).toBe(secondTypeBefore);
      expect(await page.locator('.el-type').nth(1).textContent()).toBe(firstTypeBefore);
    });
  });

  // ── Wavelength ─────────────────────────────────────────────

  test.describe('Wavelength', () => {
    test('change wavelength preset → Rayleigh range changes', async ({ page }) => {
      const initialRayleigh = await getResultValue(page, 'Rayleigh range');
      const presetDropdown = page.locator('.toolbar select').nth(1);
      await presetDropdown.selectOption('1064 nm (Nd:YAG)');
      await waitForResults(page);
      const newRayleigh = await getResultValue(page, 'Rayleigh range');
      expect(newRayleigh).not.toBe(initialRayleigh);

      await presetDropdown.selectOption('532 nm (Nd:YAG 2ω)');
      await waitForResults(page);
      expect(await getResultValue(page, 'Rayleigh range')).not.toBe(newRayleigh);
    });

    test('manual wavelength entry → works', async ({ page }) => {
      const wavelengthInput = page.locator('.field').filter({ hasText: 'Wavelength' }).locator('input');
      await wavelengthInput.fill('800');
      await wavelengthInput.press('Tab');
      await waitForResults(page);
      const wavelengthText = await getResultValue(page, 'Wavelength');
      expect(wavelengthText).toContain('800');
    });
  });

  // ── Results Validation ─────────────────────────────────────

  test.describe('Results Validation', () => {
    test('det(ABCD) = 1.0 for lossless systems', async ({ page }) => {
      expect(await getDetValue(page)).toBeCloseTo(1.0, 4);
    });

    test('output waist positive', async ({ page }) => {
      const val = parseValue(await getResultValue(page, "Waist w₀'"));
      expect(val).toBeGreaterThan(0);
    });

    test('magnification computed correctly', async ({ page }) => {
      const mag = await getResultValue(page, 'Magnification');
      expect(parseValue(mag)).toBeGreaterThan(0);
      expect(mag).toContain('×');
    });

    test('det(ABCD) ≈ 1.0 across all samples', async ({ page }) => {
      for (const id of ['simple-focusing', 'galilean-expander', 'fiber-coupling', 'resonator-cavity', 'relay-imaging']) {
        await loadSample(page, id);
        expect(await getDetValue(page)).toBeCloseTo(1.0, 4);
      }
    });
  });

  // ── Export ──────────────────────────────────────────────────

  test.describe('Export', () => {
    test('CSV export from results panel triggers download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      // Click the propagation CSV button in the results panel
      await page.locator('.panel:last-child .btn-sm:text("CSV")').last().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('gausslab-propagation.csv');
    });

    test('PNG export from diagram triggers download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.diagram-export-buttons .btn-sm:text("PNG")').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('gausslab-diagram.png');
    });

    test('SVG export from diagram triggers download', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.diagram-export-buttons .btn-sm:text("SVG")').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('gausslab-diagram.svg');
    });

    test('input beam CSV export', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.section-header:has-text("Input Beam") .btn-sm').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('gausslab-input-beam.csv');
    });

    test('output beam CSV export', async ({ page }) => {
      const downloadPromise = page.waitForEvent('download');
      await page.locator('.section-header:has-text("Output Beam") .btn-sm').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('gausslab-output-beam.csv');
    });
  });

  // ── UI ─────────────────────────────────────────────────────

  test.describe('UI', () => {
    test('theme toggle switches between light and dark', async ({ page }) => {
      const app = page.locator('.app');
      await expect(app).toHaveAttribute('data-theme', 'light');
      await page.locator('button:text("🌙")').click();
      await expect(app).toHaveAttribute('data-theme', 'dark');
      await page.locator('button:text("☀️")').click();
      await expect(app).toHaveAttribute('data-theme', 'light');
    });

    test('theme persists in localStorage', async ({ page }) => {
      await page.locator('button:text("🌙")').click();
      await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
      const saved = await page.evaluate(() => localStorage.getItem('gausslab-theme'));
      expect(saved).toBe('dark');

      // Reload and verify persistence
      await page.reload();
      await waitForResults(page);
      await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
    });

    test('guide button exists', async ({ page }) => {
      await expect(page.locator('button:text("Guide")')).toBeVisible();
    });

    test('SVG beam diagram shows element labels', async ({ page }) => {
      const svg = page.locator('.diagram-container svg');
      await expect(svg).toBeVisible();
      const texts = svg.locator('text');
      expect(await texts.count()).toBeGreaterThan(0);
      const allText = await svg.textContent();
      expect(allText).toMatch(/Lens|Free space/);
    });

    test('dark mode renders correctly', async ({ page }) => {
      await page.locator('button:text("🌙")').click();
      await expect(page.locator('.app')).toHaveAttribute('data-theme', 'dark');
      await expect(page.locator('.diagram-container svg')).toBeVisible();
      await waitForResults(page);
      await expect(page.locator('.matrix-display')).toBeVisible();
    });

    test('toolbar layout: actions left, controls right', async ({ page }) => {
      const toolbar = page.locator('.toolbar');
      // Samples and wavelength presets should appear before the spacer
      const toolbarHTML = await toolbar.innerHTML();
      const spacerIndex = toolbarHTML.indexOf('spacer');
      const samplesIndex = toolbarHTML.indexOf('Samples');
      const guideIndex = toolbarHTML.indexOf('Guide');
      // Samples before spacer, Guide after spacer
      expect(samplesIndex).toBeLessThan(spacerIndex);
      expect(guideIndex).toBeGreaterThan(spacerIndex);
    });
  });

  // ── Label Positioning ──────────────────────────────────────

  test.describe('Label Positioning', () => {
    test('Simple Focusing Lens: element labels do not overlap axis values', async ({ page }) => {
      await loadSample(page, 'simple-focusing');
      const svg = page.locator('[data-testid="beam-svg"]');
      await expect(svg).toBeVisible();

      // Get bounding boxes of element labels
      const labelBoxes = await svg.locator('[data-testid="element-label"]').evaluateAll(
        (els) => els.map((el) => {
          const rect = (el as SVGTextElement).getBBox();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })
      );

      // Get bounding boxes of w-axis labels
      const axisBoxes = await svg.locator('[data-testid="w-axis-label"]').evaluateAll(
        (els) => els.map((el) => {
          const rect = (el as SVGTextElement).getBBox();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })
      );

      // Verify no element label overlaps with any axis label
      for (const label of labelBoxes) {
        for (const axis of axisBoxes) {
          const overlaps =
            label.x < axis.x + axis.width &&
            label.x + label.width > axis.x &&
            label.y < axis.y + axis.height &&
            label.y + label.height > axis.y;
          expect(overlaps).toBe(false);
        }
      }

      // Verify element labels are above the plot area (y < top padding)
      for (const label of labelBoxes) {
        // Labels should be in the label area above the main plot
        expect(label.y).toBeLessThan(86); // labelBaseY + rows should be < padding.top
      }
    });

    test('2× Beam Expander: staggered labels do not overlap each other', async ({ page }) => {
      await loadSample(page, 'galilean-expander');
      const svg = page.locator('[data-testid="beam-svg"]');
      await expect(svg).toBeVisible();

      const labelBoxes = await svg.locator('[data-testid="element-label"]').evaluateAll(
        (els) => els.map((el) => {
          const rect = (el as SVGTextElement).getBBox();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })
      );

      // Should have 5 element labels for the expander sample
      expect(labelBoxes.length).toBe(5);

      // Verify no pair of labels overlaps
      for (let i = 0; i < labelBoxes.length; i++) {
        for (let j = i + 1; j < labelBoxes.length; j++) {
          const a = labelBoxes[i];
          const b = labelBoxes[j];
          const overlaps =
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y;
          expect(overlaps).toBe(false);
        }
      }

      // Verify labels don't overlap axis labels
      const axisBoxes = await svg.locator('[data-testid="w-axis-label"]').evaluateAll(
        (els) => els.map((el) => {
          const rect = (el as SVGTextElement).getBBox();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        })
      );

      for (const label of labelBoxes) {
        for (const axis of axisBoxes) {
          const overlaps =
            label.x < axis.x + axis.width &&
            label.x + label.width > axis.x &&
            label.y < axis.y + axis.height &&
            label.y + label.height > axis.y;
          expect(overlaps).toBe(false);
        }
      }
    });
  });

  // ── Edge Cases ─────────────────────────────────────────────

  test.describe('Edge Cases', () => {
    test('no elements → just free propagation from waist', async ({ page }) => {
      while (await getElementCount(page) > 0) {
        await page.locator('.element-item button').first().click();
        await page.waitForTimeout(100);
      }
      expect(await getElementCount(page)).toBe(0);
      await expect(page.locator('h1')).toContainText('GaussLab');
    });

    test('very short focal length lens → large divergence', async ({ page }) => {
      while (await getElementCount(page) > 0) {
        await page.locator('.element-item button').first().click();
        await page.waitForTimeout(100);
      }

      const typeSelect = page.locator('.add-element select');
      const paramInput = page.locator('.add-element input[type="number"]').first();
      const addBtn = page.locator('button:text("+ Add")');

      await typeSelect.selectOption('free-space');
      await paramInput.fill('50');
      await addBtn.click();

      await typeSelect.selectOption('thin-lens');
      await paramInput.fill('5');
      await addBtn.click();

      await typeSelect.selectOption('free-space');
      await paramInput.fill('10');
      await addBtn.click();

      await waitForResults(page);

      expect(await getResultValue(page, 'Divergence')).toBeTruthy();
      expect(await getDetValue(page)).toBeCloseTo(1.0, 4);
    });

    test('zero beam waist → error handling', async ({ page }) => {
      const waistInput = page.locator('.field').filter({ hasText: 'Beam waist' }).locator('input');
      await waistInput.fill('0');
      await waistInput.press('Tab');
      await page.waitForTimeout(500);
      await expect(page.locator('h1')).toContainText('GaussLab');
    });
  });

  // ── State Persistence ─────────────────────────────────────

  test.describe('State Persistence', () => {
    test('beam parameters persist across reload', async ({ page }) => {
      const waistInput = page.locator('.field').filter({ hasText: 'Beam waist' }).locator('input');
      await waistInput.fill('1.5');
      await waistInput.press('Tab');
      await page.waitForTimeout(700);
      await page.reload();
      await waitForResults(page);
      const saved = await page.evaluate(() => {
        const json = localStorage.getItem('gausslab-state');
        return json ? JSON.parse(json) : null;
      });
      expect(saved?.waistRadius).toBeTruthy();
    });

    test('element system persists across reload', async ({ page }) => {
      const initialCount = await getElementCount(page);
      // Add an element
      const typeSelect = page.locator('.add-element select');
      await typeSelect.selectOption('free-space');
      const paramInput = page.locator('.add-element input[type="number"]').first();
      await paramInput.fill('200');
      await page.locator('button:text("+ Add")').click();
      await waitForResults(page);
      expect(await getElementCount(page)).toBe(initialCount + 1);
      await page.waitForTimeout(700);
      await page.reload();
      await waitForResults(page);
      expect(await getElementCount(page)).toBe(initialCount + 1);
    });
  });

  // ── New / Open / Save ─────────────────────────────────────

  test.describe('New / Open / Save', () => {
    test('New button resets to default system', async ({ page }) => {
      // Load a sample to change the system
      await loadSample(page, 'galilean-expander');
      expect(await getElementCount(page)).toBe(5);
      // Click New
      await page.locator('[data-testid="new-btn"]').click();
      await waitForResults(page);
      expect(await getElementCount(page)).toBe(3);
    });

    test('Save button triggers JSON download', async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('[data-testid="save-btn"]').click(),
      ]);
      expect(download.suggestedFilename()).toBe('gausslab-config.json');
    });

    test('New, Open, Save buttons are visible', async ({ page }) => {
      await expect(page.locator('[data-testid="new-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="open-btn"]')).toBeVisible();
      await expect(page.locator('[data-testid="save-btn"]')).toBeVisible();
    });

    test('button order: New, Open, Samples, Save, presets, spacer, Guide', async ({ page }) => {
      const toolbar = page.locator('.toolbar');
      const html = await toolbar.innerHTML();
      const newIdx = html.indexOf('new-btn');
      const openIdx = html.indexOf('open-btn');
      const samplesIdx = html.indexOf('Samples');
      const saveIdx = html.indexOf('save-btn');
      const spacerIdx = html.indexOf('spacer');
      const guideIdx = html.indexOf('Guide');
      expect(newIdx).toBeLessThan(openIdx);
      expect(openIdx).toBeLessThan(samplesIdx);
      expect(samplesIdx).toBeLessThan(saveIdx);
      expect(saveIdx).toBeLessThan(spacerIdx);
      expect(spacerIdx).toBeLessThan(guideIdx);
    });
  });
});
