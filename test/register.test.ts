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

  it("harus mengembalikan error 400 jika name lebih dari 255 karakter", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A".repeat(300),
          email: "longname@test.com",
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("error");
  });

  it("harus mengembalikan error 400 jika email lebih dari 255 karakter", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "a".repeat(250) + "@test.com",
          password: "password123",
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("error");
  });

  it("harus mengembalikan error 400 jika password lebih dari 128 karakter", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@test.com",
          password: "p".repeat(200),
        }),
      })
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body).toHaveProperty("error");
  });
});
