// Static guarantees for the standalone build: one self-contained file with no
// cloud, AI, or account code, and no external references beyond data: URIs.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const html = readFileSync(new URL("../RoadmapBuilder.html", import.meta.url), "utf8");
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());

test("the page carries exactly one inline module script and it parses", () => {
  assert.equal(scripts.length, 1);
  assert.match(html, /<script type="module">/);
  new Function(scripts[0]);   // throws on a syntax error
});

test("no cloud, AI, account, or share code survives the strip", () => {
  for (const banned of [
    "supabase", "SUPABASE", "createClient", "access_token", "sign in", "Sign in",
    "queueCloudSync", "cloudSave", "sessionEmail", "OWNER_EMAIL",
    "aiModal", "cloudModal", "generateNarrative", "roadmap-summary", "build-roadmap",
    "draftSnapshot", "publicview", "serviceWorker", "manifest",
  ]) {
    assert.ok(!html.includes(banned), `found banned reference: ${banned}`);
  }
});

test("no external file references — the page must work from a bare file://", () => {
  // Every src/href in the page markup must be inline (data:) or in-page (#).
  // The inline script is excluded: export templates legitimately build markup.
  const markup = html.replace(scripts[0], "");
  for (const [, attr, value] of markup.matchAll(/\b(src|href)="([^"]+)"/g)) {
    assert.ok(
      value.startsWith("data:") || value.startsWith("#"),
      `external ${attr} reference: ${value.slice(0, 80)}`,
    );
  }
  assert.ok(!/<link\b/.test(html), "no <link> tags expected");
  assert.match(html, /connect-src 'self'/, "CSP must not allow remote origins");
});

test("the local feature set is intact", () => {
  for (const needed of [
    'id="fileSaveBtn"', 'id="fileOpenBtn"',                    // save/open file
    'id="undoBar"', 'id="undoBtn"', 'id="undoClose"',          // undo strip
    'data-act="png"', 'data-act="html"', 'data-act="xlsx"',    // exports
    'data-act="json"', 'data-act="backup"', 'data-act="portfolio"',
    'data-act="jira"', 'data-act="import"', 'data-act="del"',  // imports + trash
    'id="tmplPicker"', 'id="themeBtn"', 'id="presentBtn"',     // templates, theme, present
    "roadmap.portfolio.v2",                                    // backup envelope kept compatible
    "showSaveFilePicker", "showOpenFilePicker",                // File System Access API
  ]) {
    assert.ok(html.includes(needed), `missing feature marker: ${needed}`);
  }
});

test("storage keys are lite-specific so a hosted copy never collides with the full app", () => {
  assert.match(html, /const LS_KEY = "roadmap_lite_v1"/);
  assert.match(html, /const THEME_KEY = "roadmap_lite_theme"/);
  assert.ok(!html.includes("roadmap_builder_v1"), "must not read the full app's storage");
});
