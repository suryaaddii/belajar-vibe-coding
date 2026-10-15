import { Elysia, t } from "elysia";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  UserError,
} from "../services/users-service";

const loginHandler = async ({ body, set }: any) => {
  try {
    const result = await loginUser(body);
    set.status = 200;
    return {
      data: result.token,
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
};

const loginSchema = {
  body: t.Object({
    email: t.String({ pattern: "^[^\\s@]+@[^\\s@]+$" }),
    password: t.String({ minLength: 1 }),
  }),
};

const currentUserHandler = async ({ headers, set }: any) => {
  const authHeader = headers["authorization"] || headers["Authorization"];
  if (!authHeader || typeof authHeader !== "string") {
    set.status = 401;
    return {
      error: "Unauthorized",
    };
  }

  // Support both "Bearer <token>" and "Bearer<token>"
  const match = authHeader.match(/^Bearer\s*(.+)$/i);
  if (!match || !match[1] || match[1].trim() === "") {
    set.status = 401;
    return {
      error: "Unauthorized",
    };
  }

  const token = match[1].trim();

  try {
    const user = await getCurrentUser(token);
    set.status = 200;
    return {
      data: user,
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
};

const logoutHandler = async ({ headers, set }: any) => {
  const authHeader = headers["authorization"] || headers["Authorization"];
  if (!authHeader || typeof authHeader !== "string") {
    set.status = 401;
    return {
      error: "Unauthorized",
    };
  }

  // Support both "Bearer <token>" and "Bearer<token>"
  const match = authHeader.match(/^Bearer\s*(.+)$/i);
  if (!match || !match[1] || match[1].trim() === "") {
    set.status = 401;
    return {
      error: "Unauthorized",
    };
  }

  const token = match[1].trim();

  try {
    await logoutUser(token);
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
};

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
  )
  .post("/users/login", loginHandler, loginSchema)
  .post("/login", loginHandler, loginSchema)
  .get("/users/current", currentUserHandler)
  .get("/current", currentUserHandler)
  .delete("/users/logout", logoutHandler)
  .delete("/logout", logoutHandler);
