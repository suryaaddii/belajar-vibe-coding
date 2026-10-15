import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../src/index";
import * as usersService from "../src/services/users-service";

describe("POST /api/users/login", () => {
  it("harus mengembalikan error 400 jika data body tidak valid", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "invalid-email", password: "" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Data yang dikirimkan tidak valid" });
  });

  it("harus mengembalikan error 400 'Email atau password salah' jika kredensial tidak cocok", async () => {
    spyOn(usersService, "loginUser").mockRejectedValueOnce(
      new usersService.UserError("Email atau password salah", 400)
    );

    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "surya@localhost",
          password: "passwordsalah",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email atau password salah" });
  });

  it("harus mengembalikan token UUID dan status 200 jika login berhasil", async () => {
    const mockToken = "550e8400-e29b-41d4-a716-446655440000";
    spyOn(usersService, "loginUser").mockResolvedValueOnce({ token: mockToken });

    const res = await app.handle(
      new Request("http://localhost/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "surya@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: mockToken });
  });

  it("UUID generator bawaan harus menghasilkan format UUID v4 yang valid", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toBeString();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
