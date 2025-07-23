// route.ts - Next.js API 路由
// 此文件包含 next.js api 路由 的相关代码
// 文件路径: app/api/waitlist/route.ts
// 最后更新: 2025/7/23

// route.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Next.js 相关模块
import { NextRequest, NextResponse } from "next/server";
// 导入 @opencut/db 模块
import { db, eq, waitlist } from "@opencut/db";
// 导入 botid/server 模块
import { checkBotId } from "botid/server";
// 导入 nanoid 模块
import { nanoid } from "nanoid";
// 导入项目模块
import { waitlistRateLimit } from "@/lib/rate-limit";
// 导入 Zod 类型验证库
import { z } from "zod";
// 导入项目模块
import { env } from "@/env";
// 导入 Next.js 相关模块
import { cookies } from "next/headers";
// 导入 crypto 模块
import crypto from "crypto";

// 常量定义 - 模块内部使用的固定值
const waitlistSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
});

// 常量定义 - 模块内部使用的固定值
const CSRF_TOKEN_NAME = "waitlist-csrf";
// 常量定义 - 模块内部使用的固定值
const TOKEN_EXPIRY = 60 * 60 * 1000;

// validateCSRFToken 函数
async function validateCSRFToken(request: NextRequest): Promise<boolean> {
// 常量定义 - 模块内部使用的固定值
  const clientToken = request.headers.get("x-csrf-token");
  if (!clientToken) return false;

// 常量定义 - 模块内部使用的固定值
  const cookieStore = await cookies();
// 常量定义 - 模块内部使用的固定值
  const cookieValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  if (!cookieValue) return false;

// 常量定义 - 模块内部使用的固定值
  const [token, timestamp, signature] = cookieValue.split(":");
  if (!token || !timestamp || !signature) return false;

  if (clientToken !== token) return false;

// 常量定义 - 模块内部使用的固定值
  const now = Date.now();
// 常量定义 - 模块内部使用的固定值
  const tokenTime = parseInt(timestamp);
  if (now - tokenTime > TOKEN_EXPIRY) return false;

// 常量定义 - 模块内部使用的固定值
  const expectedSignature = crypto.createHmac("sha256", env.BETTER_AUTH_SECRET).update(`${token}:${timestamp}`).digest("hex");

  return signature === expectedSignature;
}

// POST 函数
export async function POST(request: NextRequest) {
// 常量定义 - 模块内部使用的固定值
  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

// 常量定义 - 模块内部使用的固定值
  const identifier = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
// 常量定义 - 模块内部使用的固定值
  const { success } = await waitlistRateLimit.limit(identifier);

  if (!success) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }
// 常量定义 - 模块内部使用的固定值
  const isValidToken = await validateCSRFToken(request);
  if (!isValidToken) {
    return NextResponse.json({ error: "Invalid security token" }, { status: 403 });
  }

  try {
// 常量定义 - 模块内部使用的固定值
    const body = await request.json();
// 常量定义 - 模块内部使用的固定值
    const { email } = waitlistSchema.parse(body);

// 常量定义 - 模块内部使用的固定值
    const existingEmail = await db.select().from(waitlist).where(eq(waitlist.email, email.toLowerCase())).limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    await db.insert(waitlist).values({
      id: nanoid(),
      email: email.toLowerCase(),
    });

    return NextResponse.json({ message: "Successfully joined waitlist!" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
// 常量定义 - 模块内部使用的固定值
      const firstError = error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    console.error("Waitlist signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
