/**
 * Writes `latest.json`, the manifest an installed copy reads to learn there is a new
 * version: `plugins.updater.endpoints` in `tauri.conf.json` names it, and Tauri compares
 * its `version` against the running one.
 *
 *   node scripts/make-latest-json.ts --version 0.1.2 [--notes "…"] [--tag v0.1.2]
 *
 * Run after `pnpm tauri build`: it reads the installer Tauri produced and the `.sig` file
 * beside it. A running copy verifies that signature against the public key compiled into
 * it, so the two must come from the same key pair — an artifact signed with another key
 * is refused rather than installed.
 *
 * The `url` is the installer, not the portable exe: a running copy replaces itself through
 * the platform's installer, and only the NSIS or MSI bundle can do that.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

/** Tauri's platform key for a Windows x64 build. */
export const PLATFORM = "windows-x86_64";

/** Where `tauri build` puts the bundles, relative to the repository root. */
export const BUNDLE_DIR = join("target", "release", "bundle");

export interface LatestJson {
  version: string;
  notes: string;
  pub_date: string;
  platforms: Record<string, { signature: string; url: string }>;
}

/**
 * The installer an update replaces itself with.
 *
 * NSIS first: it installs over an existing copy without an MSI service transaction, which
 * is what the updater needs. The MSI is a fallback for a build configured without NSIS.
 */
export function findInstaller(root: string): { path: string; name: string } | null {
  for (const [dir, pattern] of [
    ["nsis", /-setup\.exe$/i],
    ["msi", /\.msi$/i],
  ] as const) {
    const abs = join(root, BUNDLE_DIR, dir);
    if (!existsSync(abs)) continue;
    let names: string[];
    try {
      names = readdirSync(abs);
    } catch {
      continue;
    }
    const found = names.filter((f) => pattern.test(f)).sort();
    if (found.length) return { path: join(abs, found[0]!), name: found[0]! };
  }
  return null;
}

/** The `.sig` Tauri wrote beside the installer. */
export function signatureOf(installerPath: string): string | null {
  const sig = `${installerPath}.sig`;
  if (!existsSync(sig)) return null;
  const text = readFileSync(sig, "utf8").trim();
  return text || null;
}

/** The release asset URL for `name` on `tag`. */
export function assetUrl(repo: string, tag: string, name: string): string {
  return `https://github.com/${repo}/releases/download/${tag}/${encodeURIComponent(name)}`;
}

export function buildLatestJson(opts: {
  version: string;
  notes: string;
  signature: string;
  url: string;
  pubDate?: string;
}): LatestJson {
  return {
    version: opts.version,
    notes: opts.notes,
    pub_date: opts.pubDate ?? new Date().toISOString(),
    platforms: { [PLATFORM]: { signature: opts.signature, url: opts.url } },
  };
}

function arg(name: string): string | null {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? (process.argv[i + 1] ?? null) : null;
}

function main(): number {
  const version = arg("version");
  if (!version) {
    console.error("usage: node scripts/make-latest-json.ts --version 0.1.2 [--notes ...] [--tag v0.1.2]");
    return 2;
  }
  const tag = arg("tag") ?? `v${version}`;
  const repo = arg("repo") ?? "ppk159/pyforge";
  const installer = findInstaller(resolve("."));
  if (!installer) {
    console.error(`no installer under ${BUNDLE_DIR}/nsis or /msi — run \`pnpm tauri build\` first`);
    return 1;
  }
  const signature = signatureOf(installer.path);
  if (!signature) {
    console.error(
      `no ${installer.name}.sig — the build ran without TAURI_SIGNING_PRIVATE_KEY, ` +
        "so an installed copy would refuse this update",
    );
    return 1;
  }
  writeFileSync(
    "latest.json",
    `${JSON.stringify(
      buildLatestJson({
        version,
        notes: arg("notes") ?? "",
        signature,
        url: assetUrl(repo, tag, installer.name),
      }),
      null,
      2,
    )}\n`,
  );
  console.log(`latest.json → ${version}, ${installer.name}`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) process.exit(main());
