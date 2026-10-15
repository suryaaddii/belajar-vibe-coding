import { describe, expect, it, mock, spyOn } from "bun:test";
import { app } from "../src/index";
import * as usersService from "../src/services/users-service";

describe("POST /api/register", () => {
  it("harus mengembalikan error 400 jika data body tidak valid", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "", email: "invalid-email" }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Data yang dikirimkan tidak valid" });
  });

  it("harus mengembalikan data: OK jika registrasi berhasil", async () => {
    spyOn(usersService, "registerUser").mockResolvedValueOnce({ success: true } as any);

    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Surya",
          email: "surya@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: "OK" });
  });

  it("harus mengembalikan error 400 'Email sudah terdaftar' jika email duplikat", async () => {
    spyOn(usersService, "registerUser").mockRejectedValueOnce(
      new usersService.UserError("Email sudah terdaftar", 400)
    );

    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Surya",
          email: "surya@localhost",
          password: "rahasia",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Email sudah terdaftar" });
  });
});
