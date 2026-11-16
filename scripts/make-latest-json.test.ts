import { describe, expect, it } from "vitest";
import { assetUrl, buildLatestJson, findInstaller, PLATFORM } from "./make-latest-json.js";

describe("buildLatestJson", () => {
  it("writes the shape Tauri reads", () => {
    const m = buildLatestJson({
      version: "0.1.2",
      notes: "notes",
      signature: "sig",
      url: "https://example/a.exe",
      pubDate: "2026-01-01T00:00:00Z",
    });
    expect(m).toEqual({
      version: "0.1.2",
      notes: "notes",
      pub_date: "2026-01-01T00:00:00Z",
      platforms: { [PLATFORM]: { signature: "sig", url: "https://example/a.exe" } },
    });
  });

  it("uses Tauri's platform key, not a made-up one", () => {
    expect(PLATFORM).toBe("windows-x86_64");
  });
});

describe("assetUrl", () => {
  it("points at the tag's asset", () => {
    expect(assetUrl("ppk159/pyforge", "v0.1.2", "PyForge_0.1.2_x64-setup.exe")).toBe(
      "https://github.com/ppk159/pyforge/releases/download/v0.1.2/PyForge_0.1.2_x64-setup.exe",
    );
  });

  it("escapes a name with spaces", () => {
    expect(assetUrl("o/r", "v1", "a b.exe")).toContain("a%20b.exe");
  });
});

describe("findInstaller", () => {
  it("returns null when no bundle exists", () => {
    expect(findInstaller(process.cwd() + "/does-not-exist")).toBeNull();
  });
});
