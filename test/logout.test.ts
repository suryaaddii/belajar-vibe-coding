import { describe, expect, it, spyOn } from "bun:test";
import { app } from "../src/index";
import * as usersService from "../src/services/users-service";

describe("DELETE /api/users/logout", () => {
  it("harus mengembalikan error 401 Unauthorized jika header Authorization tidak ada", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan error 401 Unauthorized jika format Authorization bukan Bearer", async () => {
    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Basic dXNlcjpwYXNz",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan error 401 Unauthorized jika token tidak ada di database sesi", async () => {
    spyOn(usersService, "logoutUser").mockRejectedValueOnce(
      new usersService.UserError("Unauthorized", 401)
    );

    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer token-palsu",
        },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("harus mengembalikan 200 OK dengan data: OK jika logout berhasil", async () => {
    spyOn(usersService, "logoutUser").mockResolvedValueOnce({ success: true });

    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer 550e8400-e29b-41d4-a716-446655440000",
        },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toEqual({ data: "OK" });
  });

  it("harus mendukung format header Bearer tanpa spasi (Bearer<token>)", async () => {
    spyOn(usersService, "logoutUser").mockResolvedValueOnce({ success: true });

    const res = await app.handle(
      new Request("http://localhost/api/users/logout", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer550e8400-e29b-41d4-a716-446655440000",
        },
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body).toEqual({ data: "OK" });
  });
});
