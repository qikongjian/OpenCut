// route.ts - Next.js API 路由
// 此文件包含 next.js api 路由 的相关代码
// 文件路径: app/api/waitlist/token/route.ts
// 最后更新: 2025/7/23

// route.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Next.js 相关模块
import { NextRequest, NextResponse } from "next/server";
// 导入 Next.js 相关模块
import { cookies } from "next/headers";
// 导入 crypto 模块
import crypto from "crypto";
// 导入项目模块
import { env } from "@/env";

// 常量定义 - 模块内部使用的固定值
const CSRF_TOKEN_NAME = "waitlist-csrf";
// 常量定义 - 模块内部使用的固定值
const TOKEN_EXPIRY = 60 * 60 * 1000;
// 常量定义 - 模块内部使用的固定值
const allowedHosts = env.NODE_ENV === "development" ? ["localhost:3000", "127.0.0.1:3000"] : ["opencut.app", "www.opencut.app"];

// GET 函数
export async function GET(request: NextRequest) {
// 常量定义 - 模块内部使用的固定值
  const referer = request.headers.get("referer");
// 常量定义 - 模块内部使用的固定值
  const host = request.headers.get("host");

  if (referer) {
// 常量定义 - 模块内部使用的固定值
    const refererUrl = new URL(referer);

    if (!allowedHosts.some((allowed) => refererUrl.host === allowed || refererUrl.host.endsWith(allowed))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (host) {
    if (!allowedHosts.some((allowed) => host === allowed || host.endsWith(allowed))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET must be configured");
  }

// 常量定义 - 模块内部使用的固定值
  const token = crypto.randomBytes(32).toString("hex");
// 常量定义 - 模块内部使用的固定值
  const timestamp = Date.now();
// 常量定义 - 模块内部使用的固定值
  const signature = crypto.createHmac("sha256", env.BETTER_AUTH_SECRET).update(`${token}:${timestamp}`).digest("hex");

// 常量定义 - 模块内部使用的固定值
  const cookieStore = await cookies();
  cookieStore.set(CSRF_TOKEN_NAME, `${token}:${timestamp}:${signature}`, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: TOKEN_EXPIRY / 1000,
    path: "/",
  });

  return NextResponse.json({ token });
}
