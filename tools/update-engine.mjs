#!/usr/bin/env node
// Replace engine/ with the engine from guilnunes/armature at a given ref (commit SHA, branch or tag), then rebuild.
// Usage: node tools/update-engine.mjs <ref>      e.g. node tools/update-engine.mjs main
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ref = process.argv[2];
if (!ref) { console.error("Usage: node tools/update-engine.mjs <ref>"); process.exit(2); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const lock = JSON.parse(fs.readFileSync(path.join(ROOT, "engine.lock.json"), "utf8"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "armature-"));
const git = (...a) => execFileSync("git", a, { cwd: tmp, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();

git("init", "-q");
git("remote", "add", "origin", `https://github.com/${lock.engine}`);
git("fetch", "-q", "--depth", "1", "origin", ref);
git("checkout", "-q", "FETCH_HEAD");
const sha = git("rev-parse", "HEAD");
const version = fs.readFileSync(path.join(tmp, "engine", "VERSION"), "utf8").trim();

fs.rmSync(path.join(ROOT, "engine"), { recursive: true, force: true });
fs.cpSync(path.join(tmp, "engine"), path.join(ROOT, "engine"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "engine.lock.json"), JSON.stringify({ ...lock, ref: sha, version }, null, 2) + "\n");
fs.rmSync(tmp, { recursive: true, force: true });

execFileSync("node", ["engine/build.mjs", "client"], { cwd: ROOT, stdio: "inherit" });
console.log(`Engine updated to ${version} (${sha.slice(0, 7)}). Review the diff in client/dist, then commit.`);
