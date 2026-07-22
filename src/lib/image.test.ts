import { afterEach, describe, expect, it, vi } from "vitest";

const KEY = "products/linen-tote/main";
const BASE = "https://res.cloudinary.com";

// imageUrl reads NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ONCE, at module load (it's a
// module-level const). So we can't just set the var and call the function — we
// re-load the module AFTER stubbing the var: resetModules() drops the cached
// copy, and the dynamic import re-runs the file so it re-reads the stubbed value.
async function loadImageUrl(cloudName: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", cloudName);
  return (await import("@/lib/image")).imageUrl;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("imageUrl", () => {
  it("turns a key into a delivery URL, the original by default (no transforms)", async () => {
    const imageUrl = await loadImageUrl("demo");
    expect(imageUrl(KEY)).toBe(`${BASE}/demo/image/upload/${KEY}`);
  });

  it("returns '' for an empty key, so callers need no guard", async () => {
    const imageUrl = await loadImageUrl("demo");
    expect(imageUrl("")).toBe("");
  });

  it("still returns a URL but warns when the cloud name is missing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const imageUrl = await loadImageUrl("");
    // Malformed on purpose (the double slash) — the warning is how we'd notice.
    expect(imageUrl(KEY)).toBe(`${BASE}//image/upload/${KEY}`);
    expect(warn).toHaveBeenCalledOnce();
  });

  describe("transform tokens (only when explicitly passed)", () => {
    it("maps each option to one Cloudinary token", async () => {
      const imageUrl = await loadImageUrl("demo");
      expect(imageUrl(KEY, { width: 600 })).toBe(`${BASE}/demo/image/upload/w_600/${KEY}`);
      expect(imageUrl(KEY, { height: 400 })).toBe(`${BASE}/demo/image/upload/h_400/${KEY}`);
      expect(imageUrl(KEY, { quality: "auto" })).toBe(`${BASE}/demo/image/upload/q_auto/${KEY}`);
      expect(imageUrl(KEY, { quality: 80 })).toBe(`${BASE}/demo/image/upload/q_80/${KEY}`);
      expect(imageUrl(KEY, { format: "webp" })).toBe(`${BASE}/demo/image/upload/f_webp/${KEY}`);
      expect(imageUrl(KEY, { crop: "fill" })).toBe(`${BASE}/demo/image/upload/c_fill/${KEY}`);
    });

    it("joins multiple tokens in a fixed order: format, quality, width, height, crop", async () => {
      const imageUrl = await loadImageUrl("demo");
      expect(
        imageUrl(KEY, { format: "auto", quality: "auto", width: 600, height: 400, crop: "fill" }),
      ).toBe(`${BASE}/demo/image/upload/f_auto,q_auto,w_600,h_400,c_fill/${KEY}`);
    });
  });
});
