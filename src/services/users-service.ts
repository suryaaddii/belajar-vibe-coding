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
