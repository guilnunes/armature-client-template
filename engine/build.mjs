#!/usr/bin/env node
// Armature engine build: engine + owner + family + app tokens -> web (Tailwind v4 + shadcn), Android (Compose M3), iOS (SwiftUI), flat JSON.
// Zero dependencies. Run: node engine/build.mjs <owner-dir>   (add --check to only validate)
// <owner-dir> holds owner.json, families/<family>/family.json and optionally apps/<app>.json. Output goes to <owner-dir>/dist.
import fs from "node:fs";
import path from "node:path";

const ENGINE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(ENGINE, "..");
const CHECK_ONLY = process.argv.includes("--check");
const ownerArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
if (!ownerArg) { console.error("Usage: node engine/build.mjs <owner-dir> [--check]"); process.exit(2); }
const OWNER = path.resolve(ROOT, ownerArg);
const read = (p) => JSON.parse(fs.readFileSync(path.join(OWNER, p), "utf8"));
const readEngine = (p) => JSON.parse(fs.readFileSync(path.join(ENGINE, p), "utf8"));
const write = (p, s) => { const f = path.join(OWNER, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const ENGINE_VERSION = fs.readFileSync(path.join(ENGINE, "VERSION"), "utf8").trim();

const owner = read("owner.json");
const deepMerge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === "object" && !Array.isArray(v) && typeof a?.[k] === "object" ? deepMerge(a[k], v) : v; return o; };
const engineFoundation = readEngine("foundation.json");
const foundation = deepMerge(engineFoundation, owner.foundation);
// a11y may only get stricter
for (const k of ["contrast-text-min", "contrast-body-target", "contrast-ui-min"]) {
  if (foundation.a11y[k].$value < engineFoundation.a11y[k].$value) throw new Error(`owner.json may not lower a11y.${k}`);
}
const contract = readEngine("contract.json");
const sig = owner.signatures || {};
const PKG = owner.package || "com.example";
const ROLES = Object.keys(contract.roles);

// ---------- helpers ----------
const get = (obj, dotted) => dotted.split(".").reduce((o, k) => (o == null ? o : o[k]), obj);
function resolve(ref, family) {
  const m = /^\{(.+)\}$/.exec(ref);
  if (!m) return ref;
  const node = get(family, m[1]);
  if (!node || node.$value == null) throw new Error(`Unresolved reference ${ref}`);
  return resolve(node.$value, family);
}
function lum(hex) {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const px = (v) => parseFloat(v);

// ---------- targets ----------
const targets = [];
for (const fam of fs.readdirSync(path.join(OWNER, "families"))) {
  targets.push({ id: fam, family: fam, app: null });
}
const appsDir = path.join(OWNER, "apps");
for (const f of fs.existsSync(appsDir) ? fs.readdirSync(appsDir).filter((x) => x.endsWith(".json")) : []) {
  const app = read(`apps/${f}`);
  targets.push({ id: f.replace(".json", ""), family: app.app.family, app });
}

const a11y = foundation.a11y;
const baseFoundationRef = () => foundation;
const INDUSTRIES = readEngine("industries.json").industries;
const report = [];
const ruleChecks = [];
let failures = 0;

// Effective rules for a family: the strictest of engine, owner and every declared industry.
function effectiveRules(settings, foundation = baseFoundationRef()) {
  const ids = [].concat(settings.industry || []);
  const unknown = ids.filter((i) => !INDUSTRIES[i]);
  if (unknown.length) throw new Error(`Unknown industry: ${unknown.join(", ")}. Known: ${Object.keys(INDUSTRIES).join(", ")}`);
  const r = {
    "contrast-text-min": a11y["contrast-text-min"].$value,
    "contrast-ui-min": a11y["contrast-ui-min"].$value,
    "font-size-min": px(foundation["font-size"].caption.$value),
    "touch-min": px(foundation.size["touch-min"].$value),
    "dynamic-color": ["never", "opt-in", "default"],
  };
  for (const id of ids) {
    const ir = INDUSTRIES[id].rules;
    if (ir["contrast-text-min"]) r["contrast-text-min"] = Math.max(r["contrast-text-min"], ir["contrast-text-min"]);
    if (ir["contrast-ui-min"]) r["contrast-ui-min"] = Math.max(r["contrast-ui-min"], ir["contrast-ui-min"]);
    if (ir["font-size-min"]) r["font-size-min"] = Math.max(r["font-size-min"], px(ir["font-size-min"]));
    if (ir["touch-min"]) r["touch-min"] = Math.max(r["touch-min"], px(ir["touch-min"]));
    if (ir["dynamic-color"]) r["dynamic-color"] = r["dynamic-color"].filter((d) => ir["dynamic-color"].includes(d));
  }
  return { ids, rules: r };
}

const baseFoundation = foundation;
for (const t of targets) {
  const family = read(`families/${t.family}/family.json`);
  // a family may adjust the type scale, spacing or sizes (never a11y)
  if (family.foundation?.a11y) throw new Error(`${t.family}: families may not change a11y; declare an industry instead`);
  t.foundation = deepMerge(baseFoundation, family.foundation);
  const foundation = t.foundation;
  const { ids: industryIds, rules } = effectiveRules(family.settings, foundation);
  t.industries = industryIds;
  t.rules = rules;
  const check = (name, ok, detail) => { if (!ok) failures++; ruleChecks.push({ target: t.id, name, detail, status: ok ? "ok" : "FAIL" }); };
  check("font-size-min", px(foundation["font-size"].caption.$value) >= rules["font-size-min"], `smallest text ${foundation["font-size"].caption.$value}, rule ${rules["font-size-min"]}px`);
  check("touch-min", px(foundation.size["touch-min"].$value) >= rules["touch-min"], `touch-min ${foundation.size["touch-min"].$value}, rule ${rules["touch-min"]}px`);
  check("dynamic-color", rules["dynamic-color"].includes(family.settings["dynamic-color"]), `policy "${family.settings["dynamic-color"]}", allowed ${rules["dynamic-color"].join("/")}`);

  const modes = {};
  for (const mode of ["light", "dark"]) {
    const merged = { ...family.theme[mode], ...(t.app?.theme?.[mode] || {}) };
    const missing = ROLES.filter((r) => !(r in merged));
    if (missing.length) throw new Error(`${t.id}/${mode} missing roles: ${missing.join(", ")}`);
    modes[mode] = Object.fromEntries(ROLES.map((r) => [r, resolve(merged[r], family).toUpperCase()]));

    const textMin = rules["contrast-text-min"], uiMin = rules["contrast-ui-min"];
    const target = Math.max(a11y["contrast-body-target"].$value, textMin);
    for (const [role, def] of Object.entries(contract.roles)) {
      const c = modes[mode];
      if (def.pairs) {
        const ratio = contrast(c[role], c[def.pairs]);
        const isBody = role === "background" || role === "card";
        const status = ratio < textMin ? "FAIL" : isBody && ratio < target ? "WARN" : "ok";
        if (status === "FAIL") failures++;
        report.push({ target: t.id, mode, pair: `${def.pairs} on ${role}`, ratio: ratio.toFixed(2), min: textMin, status });
      }
      if (def.ui) {
        const ratio = contrast(c[role], c.background);
        const status = ratio < uiMin ? "FAIL" : "ok";
        if (status === "FAIL") failures++;
        report.push({ target: t.id, mode, pair: `${role} vs background`, ratio: ratio.toFixed(2), min: uiMin, status });
      }
    }
    // muted-foreground must also read on the plain background, not only on muted
    const mf = contrast(modes[mode]["muted-foreground"], modes[mode].background);
    const mfStatus = mf < textMin ? "FAIL" : "ok";
    if (mfStatus === "FAIL") failures++;
    report.push({ target: t.id, mode, pair: "muted-foreground on background", ratio: mf.toFixed(2), min: textMin, status: mfStatus });
  }
  t.modes = modes;
  t.settings = family.settings;
}

// contrast and rules report
const lines = ["| Target | Mode | Pair | Ratio | Minimum | Status |", "| --- | --- | --- | --- | --- | --- |",
  ...report.map((r) => `| ${r.target} | ${r.mode} | ${r.pair} | ${r.ratio} | ${r.min} | ${r.status} |`)];
const ruleLines = ["| Target | Rule | Detail | Status |", "| --- | --- | --- | --- |",
  ...ruleChecks.map((r) => `| ${r.target} | ${r.name} | ${r.detail} | ${r.status} |`)];
write("docs/contrast-report.md", `Generated by Armature engine ${ENGINE_VERSION}. Minimums come from the engine, the owner and each family's industries (strictest wins).\n\n## Contrast\n\n${lines.join("\n")}\n\n## Industry rules\n\n${ruleLines.join("\n")}\n`);

// industry guidelines per family
const famSeen = new Map();
for (const t of targets) if (!famSeen.has(t.settings.name)) famSeen.set(t.settings.name, t);
const guide = [`Generated by Armature engine ${ENGINE_VERSION} from engine/industries.json. Checkable rules are enforced by the build; guidelines are for designers, developers, reviewers and agents.`, ""];
for (const [name, t] of famSeen) {
  guide.push(`## ${name}`, "");
  if (!t.industries.length) { guide.push("No industry declared: engine defaults apply.", ""); continue; }
  for (const id of t.industries) {
    const ind = INDUSTRIES[id];
    guide.push(`### ${ind.name} (${id})`, "", ...ind.guidelines.map((g) => `- ${g}`), "");
  }
  const r = t.rules;
  guide.push(`Effective rules: text contrast ${r["contrast-text-min"]}:1, UI contrast ${r["contrast-ui-min"]}:1, smallest text ${r["font-size-min"]}px, touch targets ${r["touch-min"]}px, dynamic color ${r["dynamic-color"].join(" or ")}.`, "");
}
write("docs/industry-rules.md", guide.join("\n"));

const warns = report.filter((r) => r.status === "WARN").length;
console.log(`Checks: ${report.length} contrast, ${ruleChecks.length} industry rules, ${failures} failures, ${warns} warnings`);
if (failures) { [...report, ...ruleChecks].filter((r) => r.status === "FAIL").forEach((r) => console.error("FAIL", JSON.stringify(r))); process.exit(1); }
if (CHECK_ONLY) process.exit(0);

// ---------- emitters ----------
let sp, fs_, rad, size;
const useFoundation = (f) => { sp = f.space; fs_ = f["font-size"]; rad = f.radius; size = f.size; };
useFoundation(foundation);
const ease = (k) => `cubic-bezier(${foundation.motion.easing[k].$value.join(", ")})`;
const enterEase = sig.easing ? `cubic-bezier(${sig.easing.value.join(", ")})` : ease("standard");
const focusW = sig.focus?.width || size["focus-width-default"].$value;
const focusO = sig.focus?.offset || size["focus-offset-default"].$value;

function webCss(t) {
  const s = t.settings, f = s.fonts;
  const vars = (m) => ROLES.map((r) => `  --${r}: ${t.modes[m][r]};`).join("\n");
  return `/* ${owner.name} :: ${t.id} (${s.name} family). Built with Armature engine ${ENGINE_VERSION}. Generated, do not edit. */
/* Usage: @import "tailwindcss"; @import "./${t.id}.css";  Works with shadcn/ui as is. */

:root {
${vars("light")}
  --radius: ${rad[s["radius-component"]].$value};
  --radius-container: ${rad[s["radius-container"]].$value};
  --focus-width: ${focusW};
  --focus-offset: ${focusO};
  --family-display: "${f.display.family}", ${f.display.fallback};
  --family-ui: "${f.ui.family}", ${f.ui.fallback};
  --family-reading: "${f.reading.family}", ${f.reading.fallback};
  --family-mono: "${f.mono.family}", ${f.mono.fallback};
  --ease-enter: ${enterEase};
  --ease-exit: ${ease("exit")};
}

.dark {
${vars("dark")}
}

@theme inline {
${ROLES.map((r) => `  --color-${r}: var(--${r});`).join("\n")}
  --radius-sm: calc(var(--radius) * 0.5);
  --radius-md: var(--radius);
  --radius-lg: var(--radius-container);
  --font-sans: var(--family-ui);
  --font-serif: var(--family-reading);
  --font-display: var(--family-display);
  --font-mono: var(--family-mono);
${Object.entries(fs_).filter(([k]) => !k.startsWith("$")).map(([k, v]) => `  --text-${k}: ${v.$value};`).join("\n")}
  --spacing: ${sp["1"].$value};
  --ease-enter: var(--ease-enter);
}

/* Engine defaults */
html { font-size: 100%; }
body { font-family: var(--family-ui); font-size: ${fs_.body.$value}; line-height: ${foundation["line-height"].body.$value}; background: var(--background); color: var(--foreground); }
:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: var(--focus-width) solid var(--ring);
  outline-offset: var(--focus-offset);
}
:where(button, [role="button"], input, select) { min-height: ${size["touch-min"].$value}; }
${sig["tick-rule"] ? `/* ${owner.name} signature: tick rule */
.tick-rule { height: ${size.rule.$value}; background: var(--border); position: relative; }
.tick-rule::after { content: ""; position: absolute; right: 0; top: -3px; width: 7px; height: 7px; background: var(--highlight); transform: rotate(45deg); }
` : ""}@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; } }
`;
}

const kHex = (h) => `Color(0xFF${h.slice(1)})`;
function compose(t) {
  const pkg = `${PKG}.theme.${t.id.replace(/[^a-z0-9]/gi, "")}`;
  const scheme = (m) => Object.entries(contract.roles).filter(([, d]) => d.material)
    .map(([r, d]) => `    ${d.material} = ${kHex(t.modes[m][r])},`)
    .concat(Object.entries(contract["material-derived"]).filter(([k]) => !k.startsWith("$"))
      .map(([slot, r]) => `    ${slot} = ${kHex(t.modes[m][r])},`)).join("\n");
  const s = t.settings;
  const dyn = s["dynamic-color"];
  return `// ${owner.name} :: ${t.id} (${s.name} family). Built with Armature engine ${ENGINE_VERSION}. Generated, do not edit.
package ${pkg}

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Roles that Material 3 has no slot for. Read with ArmatureTheme.extra */
@Immutable
data class ArmatureExtraColors(
${ROLES.map((r) => `    val ${camel(r)}: Color,`).join("\n")}
)

val ArmatureLightExtra = ArmatureExtraColors(
${ROLES.map((r) => `    ${camel(r)} = ${kHex(t.modes.light[r])},`).join("\n")}
)
val ArmatureDarkExtra = ArmatureExtraColors(
${ROLES.map((r) => `    ${camel(r)} = ${kHex(t.modes.dark[r])},`).join("\n")}
)

val ArmatureLightScheme = lightColorScheme(
${scheme("light")}
)
val ArmatureDarkScheme = darkColorScheme(
${scheme("dark")}
)

object ArmatureDimens {
${Object.entries(sp).filter(([k]) => !k.startsWith("$")).map(([k, v]) => `    val space${k} = ${px(v.$value)}.dp`).join("\n")}
    val touchMin = ${px(size["touch-min"].$value)}.dp
    val touch = ${px(size.touch.$value)}.dp
    val focusWidth = ${px(focusW)}.dp
    val radiusComponent = ${px(rad[s["radius-component"]].$value)}.dp
    val radiusContainer = ${px(rad[s["radius-container"]].$value)}.dp
}

/** Sizes in sp so they follow the user's system font scale. Font families are wired in the app module (res/font). */
object ArmatureTypeScale {
${Object.entries(fs_).filter(([k]) => !k.startsWith("$")).map(([k, v]) => `    val ${camel(k)} = ${px(v.$value)}.sp`).join("\n")}
}

val ArmatureShapes = Shapes(
    extraSmall = RoundedCornerShape(ArmatureDimens.radiusComponent),
    small = RoundedCornerShape(ArmatureDimens.radiusComponent),
    medium = RoundedCornerShape(ArmatureDimens.radiusContainer),
    large = RoundedCornerShape(ArmatureDimens.radiusContainer),
)

val LocalArmatureExtra = staticCompositionLocalOf { ArmatureLightExtra }

object ArmatureTheme {
    /** Family policy: "${dyn}". ${s["dynamic-color-reason"]} */
    const val DYNAMIC_COLOR_POLICY = "${dyn}"
    val extra: ArmatureExtraColors @Composable get() = LocalArmatureExtra.current
}

@Composable
fun ArmatureTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    /** User setting. Ignored when the family policy is "never". */
    useWallpaperColors: Boolean = ${dyn === "default" ? "true" : "false"},
    typography: Typography = Typography(),
    content: @Composable () -> Unit,
) {
    val allowDynamic = ${dyn === "never" ? "false" : "useWallpaperColors && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S"}
    val scheme = when {
        allowDynamic && darkTheme -> dynamicDarkColorScheme(LocalContext.current)
        allowDynamic -> dynamicLightColorScheme(LocalContext.current)
        darkTheme -> ArmatureDarkScheme
        else -> ArmatureLightScheme
    }
    CompositionLocalProvider(LocalArmatureExtra provides if (darkTheme) ArmatureDarkExtra else ArmatureLightExtra) {
        MaterialTheme(colorScheme = scheme, typography = typography, shapes = ArmatureShapes, content = content)
    }
}
`;
}

function swift(t) {
  const rgb = (h) => [0, 2, 4].map((i) => (parseInt(h.slice(1 + i, 3 + i), 16) / 255).toFixed(4));
  const pair = (r) => { const [lr, lg, lb] = rgb(t.modes.light[r]); const [dr, dg, db] = rgb(t.modes.dark[r]);
    return `    public static let ${camel(r)} = Color(light: (${lr}, ${lg}, ${lb}), dark: (${dr}, ${dg}, ${db}))`; };
  return `// ${owner.name} :: ${t.id} (${t.settings.name} family). Built with Armature engine ${ENGINE_VERSION}. Generated, do not edit.
import SwiftUI

extension Color {
    init(light: (Double, Double, Double), dark: (Double, Double, Double)) {
        self.init(uiColor: UIColor { $0.userInterfaceStyle == .dark
            ? UIColor(red: dark.0, green: dark.1, blue: dark.2, alpha: 1)
            : UIColor(red: light.0, green: light.1, blue: light.2, alpha: 1) })
    }
}

public enum Armature {
${ROLES.map(pair).join("\n")}

    public enum Space {
${Object.entries(sp).filter(([k]) => !k.startsWith("$")).map(([k, v]) => `        public static let s${k}: CGFloat = ${px(v.$value)}`).join("\n")}
    }
    public static let touchMin: CGFloat = ${px(size["touch-min"].$value)}
    public static let radius: CGFloat = ${px(rad[t.settings["radius-component"]].$value)}
    public static let radiusContainer: CGFloat = ${px(rad[t.settings["radius-container"]].$value)}
    /// Base point sizes. Use with .font(.custom(name, size:, relativeTo:)) so Dynamic Type scales them.
    public enum TypeScale {
${Object.entries(fs_).filter(([k]) => !k.startsWith("$")).map(([k, v]) => `        public static let ${camel(k)}: CGFloat = ${px(v.$value)}`).join("\n")}
    }
}
`;
}

for (const t of targets) {
  useFoundation(t.foundation);
  write(`dist/web/${t.id}.css`, webCss(t));
  write(`dist/android/${t.id}/ArmatureTheme.kt`, compose(t));
  write(`dist/ios/${t.id}/Armature.swift`, swift(t));
  write(`dist/tokens/${t.id}.json`, JSON.stringify({ engine: ENGINE_VERSION, owner: owner.name, target: t.id, family: t.settings.name, settings: t.settings, industries: t.industries.map((id) => ({ id, ...INDUSTRIES[id] })), rules: t.rules, signatures: sig, color: t.modes, foundation: t.foundation }, null, 2));
}
console.log(`Built ${targets.length} targets: ${targets.map((t) => t.id).join(", ")}`);
