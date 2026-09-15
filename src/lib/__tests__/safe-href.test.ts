import { safeHref } from "@/lib/safe-href";

describe("safeHref", () => {
  it("allows http(s), mailto, and relative paths", () => {
    expect(safeHref("https://example.com/x")).toBe("https://example.com/x");
    expect(safeHref("http://example.com")).toBe("http://example.com");
    expect(safeHref("mailto:hi@example.com")).toBe("mailto:hi@example.com");
    expect(safeHref("#section")).toBe("#section");
    expect(safeHref("/docs")).toBe("/docs");
    expect(safeHref("./rel")).toBe("./rel");
  });

  it("rejects dangerous or protocol-relative URLs", () => {
    expect(safeHref("javascript:alert(1)")).toBeUndefined();
    expect(safeHref("data:text/html,<h1>x</h1>")).toBeUndefined();
    expect(safeHref("//evil.example/path")).toBeUndefined();
    expect(safeHref("  ")).toBeUndefined();
    expect(safeHref(undefined)).toBeUndefined();
  });
});
