import { describe, expect, it } from "bun:test";

describe("Password Hashing with Bun bcrypt", () => {
  it("harus berhasil melakukan hashing password dengan bcrypt dan dapat diverifikasi", async () => {
    const rawPassword = "rahasia";
    const hashedPassword = await Bun.password.hash(rawPassword, {
      algorithm: "bcrypt",
      cost: 10,
    });

    expect(hashedPassword).toBeString();
    expect(hashedPassword.startsWith("$2")).toBeTrue();

    const isMatch = await Bun.password.verify(rawPassword, hashedPassword);
    expect(isMatch).toBeTrue();

    const isWrongMatch = await Bun.password.verify("passwordsalah", hashedPassword);
    expect(isWrongMatch).toBeFalse();
  });
});
