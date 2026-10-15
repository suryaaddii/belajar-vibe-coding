import { Elysia, t } from "elysia";
import { registerUser, UserError } from "../services/users-service";

export const usersRoute = new Elysia()
  .onError(({ code, error, set }) => {
    if (code === "VALIDATION") {
      set.status = 400;
      return {
        error: "Data yang dikirimkan tidak valid",
      };
    }
  })
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        await registerUser(body);
        set.status = 200;
        return {
          data: "OK",
        };
      } catch (err: any) {
        if (err instanceof UserError) {
          set.status = err.status;
          return {
            error: err.message,
          };
        }

        set.status = 500;
        return {
          error: err?.message || "Internal server error",
        };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ pattern: "^[^\\s@]+@[^\\s@]+$" }),
        password: t.String({ minLength: 1 }),
      }),
    }
  );
