import { test, expect } from "@playwright/test";
import { pathToFileURL, fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const FILE_URL = pathToFileURL(fileURLToPath(new URL("../../RoadmapBuilder.html", import.meta.url))).href;

function watchErrors(page) {
  const pageErrors = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  return pageErrors;
}

test("double-clicked file:// boots straight into an editable workspace with zero network", async ({ page }) => {
  const pageErrors = watchErrors(page);
  const networkRequests = [];
  page.on("request", req => { if (/^https?:/.test(req.url())) networkRequests.push(req.url()); });

  await page.goto(FILE_URL);
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");

  // No sign-in gate: the title is immediately editable and autosaves locally.
  await expect(page.locator("#titleIn")).not.toHaveAttribute("readonly", /.*/);
  await page.locator("#titleIn").fill("Locked-down laptop plan");
  await expect(page.locator("#saveStatus")).toHaveText("Saved locally");

  // The single file asked the network for nothing at all.
  expect(networkRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test("edits persist across a file:// reload through localStorage", async ({ page }) => {
  const pageErrors = watchErrors(page);
  await page.goto(FILE_URL);
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");
  await page.locator("#titleIn").fill("Persistent roadmap");
  await expect(page.locator("#saveStatus")).toHaveText("Saved locally");

  await page.reload();
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator("#titleIn")).toHaveValue("Persistent roadmap");
  expect(pageErrors).toEqual([]);
});

test("deleting a lane offers a bottom-docked undo strip and Undo restores it", async ({ page }) => {
  const pageErrors = watchErrors(page);
  await page.goto("/RoadmapBuilder.html");
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");

  await page.locator("#addLane").click();
  await expect(page.locator("#editor [data-lane]")).toHaveCount(1);
  await page.locator('#editor [data-lane] [data-role="laneDel"]').click();
  await expect(page.locator("#editor [data-lane]")).toHaveCount(0);

  const undoBar = page.locator("#undoBar");
  await expect(undoBar).toBeVisible();
  await expect(page.locator("#undoText")).toHaveText("Lane deleted");
  const box = await undoBar.boundingBox();
  const viewport = page.viewportSize();
  expect(box.y).toBeGreaterThan(viewport.height * 0.7);
  expect(box.y + box.height).toBeGreaterThanOrEqual(viewport.height - 1);

  await undoBar.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(undoBar).toBeHidden();
  await expect(page.locator("#editor [data-lane]")).toHaveCount(1);
  await expect(page.getByText("Restored the previous version.")).toBeVisible();

  // The Executive view still renders its computed summary (the AI narrative
  // button and pane are gone, not the summary itself).
  await page.getByRole("tab", { name: "Executive" }).click();
  await expect(page.locator("#executiveBand")).toBeVisible();
  await expect(page.locator("#summaryAiBtn")).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test("template, full portfolio backup, and import on a fresh machine round-trip the data", async ({ page, browser }) => {
  const pageErrors = watchErrors(page);
  page.on("dialog", dialog => dialog.accept());
  await page.goto("/RoadmapBuilder.html");
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");

  // Build from a template through the More menu.
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.locator("#tmplPicker").selectOption("software");
  await expect(page.locator("#titleIn")).toHaveValue("Software Delivery Roadmap");

  // Full portfolio backup downloads the portfolio.v2 envelope.
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Full portfolio backup", exact: true }).click();
  const download = await downloadPromise;
  const backupPath = await download.path();
  const envelope = JSON.parse(readFileSync(backupPath, "utf8"));
  expect(envelope.schema).toBe("roadmap.portfolio.v2");
  expect(Object.keys(envelope.store.roadmaps)).toHaveLength(1);

  // Restore the file on a "different machine": a fresh browser profile.
  const fresh = await browser.newContext();
  const other = await fresh.newPage();
  const otherErrors = watchErrors(other);
  await other.goto("http://127.0.0.1:" + (process.env.PLAYWRIGHT_PORT || 4188) + "/RoadmapBuilder.html");
  await expect(other.locator("#mainContent")).toHaveAttribute("aria-busy", "false");
  await expect(other.locator("#titleIn")).toHaveValue("My roadmap");
  await other.locator("#fileIn").setInputFiles(backupPath);
  await expect(other.locator("#topNote")).toContainText("Merged 1 roadmap");
  await other.locator("#rmPicker").selectOption({ label: "Software Delivery Roadmap" });
  await expect(other.locator("#titleIn")).toHaveValue("Software Delivery Roadmap");
  expect(otherErrors).toEqual([]);
  await fresh.close();
  expect(pageErrors).toEqual([]);
});

test("Ctrl+S saves the portfolio, falling back to a download without the file picker", async ({ page }) => {
  const pageErrors = watchErrors(page);
  await page.addInitScript(() => { Object.defineProperty(window, "showSaveFilePicker", { value: undefined, configurable: true }); });
  await page.goto("/RoadmapBuilder.html");
  await expect(page.locator("#mainContent")).toHaveAttribute("aria-busy", "false");

  const downloadPromise = page.waitForEvent("download");
  await page.keyboard.press("Control+s");
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^roadmap-portfolio-\d{4}-\d{2}-\d{2}\.json$/);
  const envelope = JSON.parse(readFileSync(await download.path(), "utf8"));
  expect(envelope.schema).toBe("roadmap.portfolio.v2");
  await expect(page.locator("#topNote")).toContainText("Portfolio downloaded");
  expect(pageErrors).toEqual([]);
});
