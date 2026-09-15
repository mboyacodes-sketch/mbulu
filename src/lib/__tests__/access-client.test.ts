import {
  clearAccessSecret,
  loadAccessSecret,
  saveAccessSecret,
} from "@/lib/access-client";

describe("access-client", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("saves and loads the access secret", () => {
    expect(loadAccessSecret()).toBeNull();
    saveAccessSecret("gate-key");
    expect(loadAccessSecret()).toBe("gate-key");
  });

  it("clears the stored secret", () => {
    saveAccessSecret("gate-key");
    clearAccessSecret();
    expect(loadAccessSecret()).toBeNull();
  });
});
