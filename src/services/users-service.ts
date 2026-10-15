import { eq } from "drizzle-orm";
import { db } from "../db";
import { users, sessions } from "../db/schema";

export class UserError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UserError";
    this.status = status;
  }
}

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export async function registerUser(input: RegisterUserInput) {
  // 1. Cek apakah email sudah terdaftar
  const existingUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  if (existingUsers.length > 0) {
    throw new UserError("Email sudah terdaftar", 400);
  }

  // 2. Hash password menggunakan bcrypt bawaan Bun
  const hashedPassword = await Bun.password.hash(input.password, {
    algorithm: "bcrypt",
    cost: 10,
  });

  // 3. Simpan user baru ke database
  await db.insert(users).values({
    name: input.name,
    email: input.email,
    password: hashedPassword,
  });

  return { success: true };
}

export async function loginUser(input: LoginUserInput) {
  // 1. Cari user berdasarkan email
  const foundUsers = await db
    .select()
    .from(users)
    .where(eq(users.email, input.email))
    .limit(1);

  const user = foundUsers[0];
  if (!user) {
    throw new UserError("Email atau password salah", 400);
  }

  // 2. Verifikasi kecocokan password dengan bcrypt
  const isPasswordValid = await Bun.password.verify(input.password, user.password);
  if (!isPasswordValid) {
    throw new UserError("Email atau password salah", 400);
  }

  // 3. Generate session token UUID
  const token = crypto.randomUUID();

  // 4. Simpan session token ke database
  await db.insert(sessions).values({
    token,
    userId: user.id,
  });

  return { token };
}

export async function getCurrentUser(token: string) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new UserError("Unauthorized", 401);
  }

  // 1. Cari session berdasarkan token
  const foundSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token.trim()))
    .limit(1);

  const session = foundSessions[0];
  if (!session) {
    throw new UserError("Unauthorized", 401);
  }

  // 2. Ambil data user yang berelasi dengan session (tanpa kolom password)
  const foundUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      created_at: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const user = foundUsers[0];
  if (!user) {
    throw new UserError("Unauthorized", 401);
  }

  return user;
}

export async function logoutUser(token: string) {
  if (!token || typeof token !== "string" || token.trim() === "") {
    throw new UserError("Unauthorized", 401);
  }

  // 1. Cek keberadaan session berdasarkan token
  const foundSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.token, token.trim()))
    .limit(1);

  if (foundSessions.length === 0) {
    throw new UserError("Unauthorized", 401);
  }

  // 2. Hapus session dari tabel database
  await db.delete(sessions).where(eq(sessions.token, token.trim()));

  return { success: true };
}
