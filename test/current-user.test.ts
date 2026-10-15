import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../src/index";
import * as usersService from "../src/services/users-service";

describe("GET /api/users/current", () => {
  it("harus mengembalikan error 401 Unauthorized jika header Authorization tidak ada", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan error 401 Unauthorized jika format Authorization bukan Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Basic dXNlcjpwYXNz",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan error 401 Unauthorized jika token tidak valid atau sesi kadaluarsa", async () => {
    spyOn(usersService, "getCurrentUser").mockRejectedValueOnce(
      new usersService.UserError("Unauthorized", 401)
    );

    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer token-tidak-valid",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan data user (tanpa password) dengan status 200 jika token valid", async () => {
    const mockUser = {
      id: 1,
      name: "Surya",
      email: "surya@localhost",
      created_at: new Date("2026-10-15T07:49:00.000Z"),
    };
    spyOn(usersService, "getCurrentUser").mockResolvedValueOnce(mockUser as any);

    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer 550e8400-e29b-41d4-a716-446655440000",
        },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.id).toBe(1);
    expect(body.data.name).toBe("Surya");
    expect(body.data.email).toBe("surya@localhost");
    expect(body.data.password).toBeUndefined();
  });

  it("harus mendukung format header Bearer tanpa spasi (Bearer<token>)", async () => {
    const mockUser = {
      id: 1,
      name: "Surya",
      email: "surya@localhost",
      created_at: new Date("2026-10-15T07:49:00.000Z"),
    };
    spyOn(usersService, "getCurrentUser").mockResolvedValueOnce(mockUser as any);

    const res = await app.handle(
      new Request("http://localhost/api/users/current", {
        method: "GET",
        headers: {
          Authorization: "Bearer550e8400-e29b-41d4-a716-446655440000",
        },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.id).toBe(1);
    expect(body.data.password).toBeUndefined();
  });
});
