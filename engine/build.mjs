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
const report = [];
let failures = 0;

for (const t of targets) {
  const family = read(`families/${t.family}/family.json`);
  const modes = {};
  for (const mode of ["light", "dark"]) {
    const merged = { ...family.theme[mode], ...(t.app?.theme?.[mode] || {}) };
    const missing = ROLES.filter((r) => !(r in merged));
    if (missing.length) throw new Error(`${t.id}/${mode} missing roles: ${missing.join(", ")}`);
    modes[mode] = Object.fromEntries(ROLES.map((r) => [r, resolve(merged[r], family).toUpperCase()]));

    // contrast checks
    for (const [role, def] of Object.entries(contract.roles)) {
      const c = modes[mode];
      if (def.pairs) {
        const ratio = contrast(c[role], c[def.pairs]);
        const isBody = role === "background" || role === "card";
        const min = a11y["contrast-text-min"].$value;
        const target = a11y["contrast-body-target"].$value;
        const status = ratio < min ? "FAIL" : isBody && ratio < target ? "WARN" : "ok";
        if (status === "FAIL") failures++;
        report.push({ target: t.id, mode, pair: `${def.pairs} on ${role}`, ratio: ratio.toFixed(2), status });
      }
      if (def.ui) {
        const ratio = contrast(c[role], c.background);
        const status = ratio < a11y["contrast-ui-min"].$value ? "FAIL" : "ok";
        if (status === "FAIL") failures++;
        report.push({ target: t.id, mode, pair: `${role} vs background`, ratio: ratio.toFixed(2), status });
      }
    }
    // muted-foreground must also read on the plain background, not only on muted
    const mf = contrast(modes[mode]["muted-foreground"], modes[mode].background);
    if (mf < a11y["contrast-text-min"].$value) failures++;
    report.push({ target: t.id, mode, pair: "muted-foreground on background", ratio: mf.toFixed(2), status: mf < 4.5 ? "FAIL" : "ok" });
  }
  t.modes = modes;
  t.settings = family.settings;
}

// contrast report
const lines = ["| Target | Mode | Pair | Ratio | Status |", "| --- | --- | --- | --- | --- |",
  ...report.map((r) => `| ${r.target} | ${r.mode} | ${r.pair} | ${r.ratio} | ${r.status} |`)];
write("docs/contrast-report.md", `Generated by Armature engine ${ENGINE_VERSION}. Text minimum 4.5:1, body text target 7:1, UI boundaries 3:1.\n\n${lines.join("\n")}\n`);
console.log(`Contrast: ${report.length} checks, ${failures} failures, ${report.filter((r) => r.status === "WARN").length} warnings`);
if (failures) { report.filter((r) => r.status === "FAIL").forEach((r) => console.error("FAIL", r)); process.exit(1); }
if (CHECK_ONLY) process.exit(0);

// ---------- emitters ----------
const sp = foundation.space, fs_ = foundation["font-size"], rad = foundation.radius, size = foundation.size;
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
  write(`dist/web/${t.id}.css`, webCss(t));
  write(`dist/android/${t.id}/ArmatureTheme.kt`, compose(t));
  write(`dist/ios/${t.id}/Armature.swift`, swift(t));
  write(`dist/tokens/${t.id}.json`, JSON.stringify({ engine: ENGINE_VERSION, owner: owner.name, target: t.id, family: t.settings.name, settings: t.settings, signatures: sig, color: t.modes, foundation }, null, 2));
}
console.log(`Built ${targets.length} targets: ${targets.map((t) => t.id).join(", ")}`);
