# OpenCut 后端技术文档

## 项目概述

OpenCut 的后端采用现代化的全栈架构，基于 Next.js 15 的 API Routes 构建，结合 PostgreSQL 数据库和 Redis 缓存，实现了一个高性能、可扩展的视频编辑平台后端系统。

## 技术栈

### 核心技术
- **Next.js 15.4.1** - 全栈 React 框架
- **TypeScript 5.8.3** - 类型安全的 JavaScript
- **PostgreSQL 17** - 主数据库
- **Redis 7** - 缓存和会话存储
- **Drizzle ORM 0.44.2** - TypeScript ORM

### 认证系统
- **Better Auth 1.2.7** - 现代化认证库
- **OAuth 2.0** - 社交登录支持
- **JWT** - 无状态会话管理

### 基础设施
- **Docker** - 容器化部署
- **Bun** - JavaScript 运行时
- **Upstash Redis** - 云 Redis 服务
- **Vercel** - 部署平台

## 架构设计

### 1. 包结构设计

OpenCut 采用 monorepo 架构，后端功能被拆分为独立的包：

```
packages/
├── auth/           # 认证系统包
│   ├── src/
│   │   ├── server.ts    # 服务端认证配置
│   │   ├── client.ts    # 客户端认证工具
│   │   ├── keys.ts      # 环境变量配置
│   │   └── index.ts     # 主入口
│   └── package.json
└── db/             # 数据库包
    ├── src/
    │   ├── schema.ts    # 数据库模式定义
    │   ├── index.ts     # 数据库连接
    │   └── keys.ts      # 环境变量配置
    ├── migrations/      # 数据库迁移文件
    └── package.json
```

### 2. 数据库设计

#### 2.1 数据库模式

**文件位置**: `packages/db/src/schema.ts`

```typescript
// 用户表
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()).notNull(),
}).enableRLS();

// 会话表
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}).enableRLS();

// 账户表（OAuth 提供商）
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}).enableRLS();

// 验证表
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").$defaultFn(() => new Date()),
}).enableRLS();

// 等待列表表
export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}).enableRLS();
```

#### 2.2 数据库连接

**文件位置**: `packages/db/src/index.ts`

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { keys } from "./keys";

const { DATABASE_URL } = keys();

// 懒加载数据库实例
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const client = postgres(DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}

// 导出数据库实例
export const db = getDb();

// 重新导出 schema 和常用函数
export * from "./schema";
export {
  eq, and, or, not, isNull, isNotNull,
  inArray, notInArray, exists, notExists, sql,
} from "drizzle-orm";
```

#### 2.3 数据库迁移

**文件位置**: `packages/db/drizzle.config.ts`

```typescript
import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
import { keys } from "./src/keys";

const { NODE_ENV, DATABASE_URL } = keys();

// 根据环境加载配置
if (NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
} else {
  dotenv.config({ path: ".env.local" });
}

export default {
  schema: "./src/schema.ts",
  dialect: "postgresql",
  migrations: {
    table: "drizzle_migrations",
  },
  dbCredentials: {
    url: DATABASE_URL,
  },
  out: "./migrations",
  strict: NODE_ENV === "production",
} satisfies Config;
```

### 3. 认证系统

#### 3.1 Better Auth 配置

**文件位置**: `packages/auth/src/server.ts`

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@opencut/db";
import { keys } from "./keys";

const { NEXT_PUBLIC_BETTER_AUTH_URL, BETTER_AUTH_SECRET } = keys();

export const auth = betterAuth({
  // 数据库适配器
  database: drizzleAdapter(db, {
    provider: "pg",
    usePlural: true,
  }),
  
  // 安全配置
  secret: BETTER_AUTH_SECRET,
  baseURL: NEXT_PUBLIC_BETTER_AUTH_URL,
  
  // 用户配置
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  
  // 认证方式
  emailAndPassword: {
    enabled: true,
  },
  
  // 应用配置
  appName: "OpenCut",
  trustedOrigins: ["http://localhost:3000"],
});

export type Auth = typeof auth;
```

#### 3.2 客户端认证工具

**文件位置**: `packages/auth/src/client.ts`

```typescript
import { createAuthClient } from "better-auth/react";
import { keys } from "./keys";

const { NEXT_PUBLIC_BETTER_AUTH_URL } = keys();

export const { signIn, signUp, useSession } = createAuthClient({
  baseURL: NEXT_PUBLIC_BETTER_AUTH_URL,
});
```

#### 3.3 API 路由

**文件位置**: `apps/web/src/app/api/auth/[...all]/route.ts`

```typescript
import { auth } from "@opencut/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

### 4. API 路由设计

#### 4.1 等待列表 API

**文件位置**: `apps/web/src/app/api/waitlist/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db, eq, waitlist } from "@opencut/db";
import { checkBotId } from "botid/server";
import { nanoid } from "nanoid";
import { waitlistRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const waitlistSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
});

export async function POST(request: NextRequest) {
  // 1. 机器人检测
  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // 2. 速率限制
  const identifier = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await waitlistRateLimit.limit(identifier);
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // 3. CSRF 验证
  const isValidToken = await validateCSRFToken(request);
  if (!isValidToken) {
    return NextResponse.json({ error: "Invalid security token" }, { status: 403 });
  }

  try {
    // 4. 数据验证
    const body = await request.json();
    const { email } = waitlistSchema.parse(body);

    // 5. 重复检查
    const existingEmail = await db.select()
      .from(waitlist)
      .where(eq(waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // 6. 数据插入
    await db.insert(waitlist).values({
      id: nanoid(),
      email: email.toLowerCase(),
    });

    return NextResponse.json({ message: "Successfully joined waitlist!" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    console.error("Waitlist signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

#### 4.2 CSRF Token API

**文件位置**: `apps/web/src/app/api/waitlist/token/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { env } from "@/env";

const CSRF_TOKEN_NAME = "waitlist-csrf";
const TOKEN_EXPIRY = 60 * 60 * 1000; // 1小时

export async function GET(request: NextRequest) {
  // 1. 来源验证
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");
  
  const allowedHosts = env.NODE_ENV === "development" 
    ? ["localhost:3000", "127.0.0.1:3000"] 
    : ["opencut.app", "www.opencut.app"];

  if (referer) {
    const refererUrl = new URL(referer);
    if (!allowedHosts.some((allowed) => 
      refererUrl.host === allowed || refererUrl.host.endsWith(allowed)
    )) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // 2. 生成安全令牌
  const token = crypto.randomBytes(32).toString("hex");
  const timestamp = Date.now();
  const signature = crypto.createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${token}:${timestamp}`)
    .digest("hex");

  // 3. 设置安全 Cookie
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
```

#### 4.3 健康检查 API

**文件位置**: `apps/web/src/app/api/health/route.ts`

```typescript
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return new Response("OK", { status: 200 });
}
```

### 5. 速率限制系统

#### 5.1 Redis 配置

**文件位置**: `apps/web/src/lib/rate-limit.ts`

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

// Redis 连接
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// 等待列表速率限制：每分钟5次请求
export const waitlistRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "waitlist-rate-limit",
});
```

### 6. 环境变量管理

#### 6.1 环境变量配置

**文件位置**: `apps/web/src/env.ts`

```typescript
import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { keys as auth } from "@opencut/auth/keys";
import { keys as db } from "@opencut/db/keys";

export const env = createEnv({
  extends: [vercel(), auth(), db()],
  server: {
    ANALYZE: z.string().optional(),
    NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string(),
  },
  client: {},
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
});
```

### 7. 中间件系统

#### 7.1 域名重定向中间件

**文件位置**: `apps/web/src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 处理 fuckcapcut.com 域名重定向
  if (request.headers.get("host") === "fuckcapcut.com") {
    return NextResponse.redirect("https://opencut.app/why-not-capcut", 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

### 8. 前端认证集成

#### 8.1 登录 Hook

**文件位置**: `apps/web/src/hooks/auth/useLogin.ts`

```typescript
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@opencut/auth/client";

export function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setError(null);
    setIsEmailLoading(true);

    const { error } = await signIn.email({
      email,
      password,
    });

    if (error) {
      setError(error.message || "An unexpected error occurred.");
      setIsEmailLoading(false);
      return;
    }

    router.push("/projects");
  }, [router, email, password]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/projects",
      });
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    error,
    isEmailLoading,
    isGoogleLoading,
    isAnyLoading: isEmailLoading || isGoogleLoading,
    handleLogin,
    handleGoogleLogin,
  };
}
```

#### 8.2 注册 Hook

**文件位置**: `apps/web/src/hooks/auth/useSignUp.ts`

```typescript
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signUp, signIn } from "@opencut/auth/client";

export function useSignUp() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    setError(null);
    setIsEmailLoading(true);

    const { error } = await signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      setError(error.message || "An unexpected error occurred.");
      setIsEmailLoading(false);
      return;
    }

    router.push("/login");
  }, [name, email, password, router]);

  const handleGoogleSignUp = useCallback(async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      await signIn.social({
        provider: "google",
      });
      router.push("/editor");
    } catch (error) {
      setError("Failed to sign up with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  }, [router]);

  return {
    name, setName,
    email, setEmail,
    password, setPassword,
    error,
    isEmailLoading,
    isGoogleLoading,
    isAnyLoading: isEmailLoading || isGoogleLoading,
    handleSignUp,
    handleGoogleSignUp,
  };
}
```

### 9. 容器化部署

#### 9.1 Docker Compose 配置

**文件位置**: `docker-compose.yaml`

```yaml
services:
  # PostgreSQL 数据库
  db:
    image: postgres:17
    restart: unless-stopped
    environment:
      POSTGRES_USER: opencut
      POSTGRES_PASSWORD: opencutthegoat
      POSTGRES_DB: opencut
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U opencut"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 10s

  # Redis 缓存
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 10s

  # Serverless Redis HTTP 代理
  serverless-redis-http:
    image: hiett/serverless-redis-http:latest
    ports:
      - "8079:80"
    environment:
      SRH_MODE: env
      SRH_TOKEN: example_token
      SRH_CONNECTION_STRING: "redis://redis:6379"
    depends_on:
      redis:
        condition: service_healthy

  # Web 应用
  web:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
    restart: unless-stopped
    ports:
      - "3100:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://opencut:opencutthegoat@db:5432/opencut
      - BETTER_AUTH_URL=http://localhost:3000
      - BETTER_AUTH_SECRET=your-production-secret-key-here
      - UPSTASH_REDIS_REST_URL=http://serverless-redis-http:80
      - UPSTASH_REDIS_REST_TOKEN=example_token
    depends_on:
      db:
        condition: service_healthy
      serverless-redis-http:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 30s

volumes:
  postgres_data:

networks:
  default:
    name: opencut-network
```

#### 9.2 Dockerfile

**文件位置**: `apps/web/Dockerfile`

```dockerfile
FROM oven/bun:alpine AS base

# 构建阶段
FROM base AS builder
WORKDIR /app

# 复制包管理文件
COPY package.json package.json
COPY bun.lock bun.lock
COPY turbo.json turbo.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/auth/package.json packages/auth/package.json

# 安装依赖
RUN bun install

# 复制源代码
COPY apps/web/ apps/web/
COPY packages/db/ packages/db/
COPY packages/auth/ packages/auth/

# 设置环境变量
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV DATABASE_URL="postgresql://opencut:opencutthegoat@localhost:5432/opencut"
ENV BETTER_AUTH_SECRET="build-time-secret"
ENV UPSTASH_REDIS_REST_URL="http://localhost:8079"
ENV UPSTASH_REDIS_REST_TOKEN="example_token"
ENV NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"

# 构建应用
WORKDIR /app/apps/web
RUN bun run build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 创建用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

RUN chown nextjs:nodejs apps

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "apps/web/server.js"]
```

### 10. 安全特性

#### 10.1 行级安全 (RLS)

所有数据库表都启用了 PostgreSQL 的行级安全：

```sql
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "waitlist" ENABLE ROW LEVEL SECURITY;
```

#### 10.2 CSRF 保护

等待列表 API 实现了完整的 CSRF 保护：

```typescript
async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const clientToken = request.headers.get("x-csrf-token");
  if (!clientToken) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(CSRF_TOKEN_NAME)?.value;
  if (!cookieValue) return false;

  const [token, timestamp, signature] = cookieValue.split(":");
  if (!token || !timestamp || !signature) return false;

  if (clientToken !== token) return false;

  const now = Date.now();
  const tokenTime = parseInt(timestamp);
  if (now - tokenTime > TOKEN_EXPIRY) return false;

  const expectedSignature = crypto.createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${token}:${timestamp}`)
    .digest("hex");

  return signature === expectedSignature;
}
```

#### 10.3 速率限制

使用 Redis 实现滑动窗口速率限制：

```typescript
export const waitlistRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 每分钟5次请求
  analytics: true,
  prefix: "waitlist-rate-limit",
});
```

#### 10.4 机器人检测

使用 BotId 进行机器人检测：

```typescript
const verification = await checkBotId();
if (verification.isBot) {
  return NextResponse.json({ error: "Access denied" }, { status: 403 });
}
```

### 11. 性能优化

#### 11.1 数据库连接池

使用 postgres.js 的连接池功能：

```typescript
const client = postgres(DATABASE_URL, {
  max: 10, // 最大连接数
  idle_timeout: 20, // 空闲超时
  connect_timeout: 10, // 连接超时
});
```

#### 11.2 懒加载数据库实例

```typescript
let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (!_db) {
    const client = postgres(DATABASE_URL);
    _db = drizzle(client, { schema });
  }
  return _db;
}
```

#### 11.3 缓存策略

使用 Redis 进行会话和速率限制缓存：

```typescript
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});
```

### 12. 监控和日志

#### 12.1 健康检查

```typescript
export async function GET(request: NextRequest) {
  return new Response("OK", { status: 200 });
}
```

#### 12.2 错误处理

```typescript
try {
  // 业务逻辑
} catch (error) {
  if (error instanceof z.ZodError) {
    const firstError = error.errors[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  console.error("API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

### 13. 开发工具

#### 13.1 数据库迁移

```bash
# 生成迁移
bun run db:generate

# 应用迁移
bun run db:migrate

# 推送到数据库
bun run db:push

# 打开 Drizzle Studio
bun run db:studio
```

#### 13.2 环境变量管理

使用 T3 Stack 的环境变量验证：

```typescript
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
  },
});
```

### 14. 部署配置

#### 14.1 Vercel 配置

**文件位置**: `netlify.toml`

```toml
[build]
  command = "bun run build"
  publish = "apps/web/.next"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### 14.2 环境变量

生产环境需要配置以下环境变量：

```bash
# 数据库
DATABASE_URL=postgresql://user:password@host:port/database

# 认证
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.com

# Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# 其他
NODE_ENV=production
```

### 15. 扩展性设计

#### 15.1 模块化架构

- **认证包**: 独立的认证系统
- **数据库包**: 数据库连接和模式
- **API 路由**: 基于 Next.js 的 API 路由

#### 15.2 微服务架构准备

虽然当前是单体架构，但设计上为未来微服务拆分做了准备：

```typescript
// 服务接口定义
interface AuthService {
  authenticate(token: string): Promise<User | null>;
  createSession(userId: string): Promise<Session>;
  revokeSession(sessionId: string): Promise<void>;
}

interface UserService {
  createUser(data: CreateUserData): Promise<User>;
  updateUser(userId: string, data: UpdateUserData): Promise<User>;
  deleteUser(userId: string): Promise<void>;
}

interface WaitlistService {
  addEmail(email: string): Promise<void>;
  getWaitlistStats(): Promise<WaitlistStats>;
}
```

#### 15.3 事件驱动架构

为异步处理预留事件系统：

```typescript
// 事件类型定义
type EventType = 
  | "user.registered"
  | "user.login"
  | "waitlist.joined"
  | "project.created"
  | "project.updated";

interface Event {
  id: string;
  type: EventType;
  payload: any;
  timestamp: Date;
  userId?: string;
}

// 事件处理器
interface EventHandler<T = any> {
  handle(event: Event & { payload: T }): Promise<void>;
}
```

### 16. 数据验证和类型安全

#### 16.1 Zod 模式验证

```typescript
// 用户输入验证
const userSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const waitlistSchema = z.object({
  email: z.string().email("Invalid email format").min(1, "Email is required"),
});

// 环境变量验证
const envSchema = z.object({
  DATABASE_URL: z.string().url("Invalid database URL"),
  BETTER_AUTH_SECRET: z.string().min(32, "Secret too short"),
  NODE_ENV: z.enum(["development", "production", "test"]),
});
```

#### 16.2 类型安全的数据库操作

```typescript
// 类型安全的查询
const getUserById = async (id: string): Promise<User | null> => {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
};

const createUser = async (data: CreateUserData): Promise<User> => {
  const [user] = await db.insert(users).values({
    id: nanoid(),
    name: data.name,
    email: data.email.toLowerCase(),
    emailVerified: false,
  }).returning();
  
  return user;
};

const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const [user] = await db.update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  
  return user;
};
```

### 17. 错误处理和日志记录

#### 17.1 统一错误处理

```typescript
// 错误类型定义
class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

// 错误处理中间件
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AppError) {
        throw error;
      }
      
      if (error instanceof z.ZodError) {
        throw new ValidationError(error.errors[0].message);
      }
      
      throw new AppError('Internal server error', 500);
    }
  };
}
```

#### 17.2 结构化日志

```typescript
// 日志工具
interface LogContext {
  userId?: string;
  requestId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level}: ${message}${contextStr}`;
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('WARN', message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(this.formatMessage('ERROR', message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
    }));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
```

### 18. 测试策略

#### 18.1 单元测试

```typescript
// 数据库测试
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@opencut/db';
import { users, waitlist } from '@opencut/db/schema';

describe('Database Operations', () => {
  beforeEach(async () => {
    // 清理测试数据
    await db.delete(users);
    await db.delete(waitlist);
  });

  afterEach(async () => {
    // 清理测试数据
    await db.delete(users);
    await db.delete(waitlist);
  });

  it('should create user', async () => {
    const userData = {
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      emailVerified: false,
    };

    const [user] = await db.insert(users).values(userData).returning();
    
    expect(user).toMatchObject(userData);
  });

  it('should prevent duplicate emails', async () => {
    const email = 'test@example.com';
    
    await db.insert(users).values({
      id: 'user1',
      name: 'User 1',
      email,
      emailVerified: false,
    });

    await expect(
      db.insert(users).values({
        id: 'user2',
        name: 'User 2',
        email,
        emailVerified: false,
      })
    ).rejects.toThrow();
  });
});
```

#### 18.2 API 测试

```typescript
// API 路由测试
import { describe, it, expect } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Waitlist API', () => {
  it('should add email to waitlist', async () => {
    const request = new NextRequest('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'valid-token',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe('Successfully joined waitlist!');
  });

  it('should reject invalid email', async () => {
    const request = new NextRequest('http://localhost:3000/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': 'valid-token',
      },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid email format');
  });
});
```

#### 18.3 集成测试

```typescript
// 端到端测试
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from 'http';
import { parse } from 'url';
import { NextRequest } from 'next/server';

describe('Full Stack Integration', () => {
  let server: any;

  beforeAll(async () => {
    // 启动测试服务器
    server = createServer(async (req, res) => {
      const { pathname } = parse(req.url!);
      
      if (pathname === '/api/waitlist' && req.method === 'POST') {
        // 模拟 API 路由
        const body = await new Promise(resolve => {
          let data = '';
          req.on('data', chunk => data += chunk);
          req.on('end', () => resolve(JSON.parse(data)));
        });
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Successfully joined waitlist!' }));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    await new Promise(resolve => server.listen(3001, resolve));
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  it('should handle waitlist signup flow', async () => {
    const response = await fetch('http://localhost:3001/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.message).toBe('Successfully joined waitlist!');
  });
});
```

### 19. 性能监控和分析

#### 19.1 性能指标收集

```typescript
// 性能监控工具
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);
    
    // 在开发环境下输出到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${metric.method} ${metric.endpoint} - ${metric.duration}ms - ${metric.statusCode}`);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageResponseTime(endpoint?: string) {
    const filtered = endpoint 
      ? this.metrics.filter(m => m.endpoint === endpoint)
      : this.metrics;
    
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// 性能监控中间件
export function withPerformanceMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  endpoint: string,
  method: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      const result = await handler(...args);
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        endpoint,
        method,
        duration,
        statusCode: 200,
        timestamp: new Date(),
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      performanceMonitor.recordMetric({
        endpoint,
        method,
        duration,
        statusCode: error.statusCode || 500,
        timestamp: new Date(),
      });
      
      throw error;
    }
  };
}
```

#### 19.2 数据库查询分析

```typescript
// 查询性能监控
class QueryMonitor {
  private queries: Array<{
    sql: string;
    duration: number;
    timestamp: Date;
  }> = [];

  recordQuery(sql: string, duration: number) {
    this.queries.push({ sql, duration, timestamp: new Date() });
    
    // 记录慢查询
    if (duration > 1000) {
      logger.warn('Slow query detected', { sql, duration });
    }
  }

  getSlowQueries(threshold: number = 1000) {
    return this.queries.filter(q => q.duration > threshold);
  }

  getAverageQueryTime() {
    if (this.queries.length === 0) return 0;
    const total = this.queries.reduce((sum, q) => sum + q.duration, 0);
    return total / this.queries.length;
  }
}

export const queryMonitor = new QueryMonitor();
```

### 20. 安全最佳实践

#### 20.1 输入验证和清理

```typescript
// 输入清理工具
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim());
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

#### 20.2 会话安全

```typescript
// 会话管理
class SessionManager {
  private activeSessions = new Map<string, {
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    ipAddress: string;
    userAgent: string;
  }>();

  createSession(userId: string, ipAddress: string, userAgent: string): string {
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    this.activeSessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ipAddress,
      userAgent,
    });
    
    return sessionId;
  }

  validateSession(sessionId: string, ipAddress: string): boolean {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) return false;
    
    // 检查会话是否过期（24小时）
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    if (sessionAge > 24 * 60 * 60 * 1000) {
      this.activeSessions.delete(sessionId);
      return false;
    }
    
    // 更新最后活动时间
    session.lastActivity = now;
    
    return true;
  }

  revokeSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
  }

  revokeAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }
}

export const sessionManager = new SessionManager();
```

#### 20.3 密码安全

```typescript
// 密码哈希
import bcrypt from 'bcryptjs';

export class PasswordManager {
  private static readonly SALT_ROUNDS = 12;

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async generateSecurePassword(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }
}
```

### 21. 故障排除和调试

#### 21.1 常见问题诊断

```typescript
// 系统健康检查
class HealthChecker {
  async checkDatabase(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await db.execute(sql`SELECT 1`);
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown database error' 
      };
    }
  }

  async checkRedis(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await redis.ping();
      return { healthy: true };
    } catch (error) {
      return { 
        healthy: false, 
        error: error instanceof Error ? error.message : 'Unknown Redis error' 
      };
    }
  }

  async checkAll(): Promise<{
    overall: boolean;
    database: { healthy: boolean; error?: string };
    redis: { healthy: boolean; error?: string };
  }> {
    const [dbHealth, redisHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      overall: dbHealth.healthy && redisHealth.healthy,
      database: dbHealth,
      redis: redisHealth,
    };
  }
}

export const healthChecker = new HealthChecker();
```

#### 21.2 调试工具

```typescript
// 调试辅助工具
class Debugger {
  private debugMode = process.env.NODE_ENV === 'development';

  log(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`[DEBUG] ${message}`, data);
    }
  }

  inspectObject(obj: any, label: string = 'Object') {
    if (this.debugMode) {
      console.log(`[DEBUG] ${label}:`, JSON.stringify(obj, null, 2));
    }
  }

  measureTime<T>(fn: () => Promise<T>, label: string): Promise<T> {
    return async () => {
      const start = Date.now();
      try {
        const result = await fn();
        const duration = Date.now() - start;
        this.log(`${label} took ${duration}ms`);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.log(`${label} failed after ${duration}ms`, error);
        throw error;
      }
    };
  }
}

export const debugger = new Debugger();
```

### 22. 部署和运维

#### 22.1 环境配置管理

```typescript
// 环境配置
interface EnvironmentConfig {
  database: {
    url: string;
    poolSize: number;
    ssl: boolean;
  };
  redis: {
    url: string;
    password?: string;
  };
  auth: {
    secret: string;
    sessionTimeout: number;
    jwtExpiry: number;
  };
  security: {
    corsOrigins: string[];
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

function getEnvironmentConfig(): EnvironmentConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    database: {
      url: process.env.DATABASE_URL!,
      poolSize: isProduction ? 20 : 5,
      ssl: isProduction,
    },
    redis: {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      password: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    auth: {
      secret: process.env.BETTER_AUTH_SECRET!,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      jwtExpiry: 60 * 60, // 1 hour
    },
    security: {
      corsOrigins: isProduction 
        ? ['https://opencut.app', 'https://www.opencut.app']
        : ['http://localhost:3000'],
      rateLimitWindow: 60 * 1000, // 1 minute
      rateLimitMax: isProduction ? 100 : 1000,
    },
    monitoring: {
      enabled: isProduction,
      logLevel: isProduction ? 'info' : 'debug',
    },
  };
}

export const config = getEnvironmentConfig();
```

#### 22.2 备份策略

```typescript
// 数据库备份
class BackupManager {
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.sql`;
    
    // 这里应该调用实际的备份命令
    // 例如: pg_dump $DATABASE_URL > backup.sql
    logger.info('Database backup created', { backupName });
    
    return backupName;
  }

  async restoreBackup(backupName: string): Promise<void> {
    // 这里应该调用实际的恢复命令
    // 例如: psql $DATABASE_URL < backup.sql
    logger.info('Database backup restored', { backupName });
  }

  async scheduleBackups(): Promise<void> {
    // 设置定时备份任务
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        logger.error('Backup failed', error);
      }
    }, 24 * 60 * 60 * 1000); // 每24小时
  }
}

export const backupManager = new BackupManager();
```

### 23. 总结

OpenCut 后端技术架构具有以下特点：

#### 优势
1. **现代化技术栈**: 使用最新的 Next.js、TypeScript 和 Drizzle ORM
2. **类型安全**: 全面的 TypeScript 类型定义和 Zod 验证
3. **安全性**: 多层安全防护，包括 RLS、CSRF、速率限制
4. **可扩展性**: 模块化设计，为微服务架构做准备
5. **性能优化**: 连接池、缓存、懒加载等优化策略

#### 技术亮点
1. **Better Auth 集成**: 现代化的认证系统
2. **PostgreSQL + Redis**: 高性能的数据存储方案
3. **Docker 容器化**: 完整的容器化部署方案
4. **监控和日志**: 完善的性能监控和错误处理
5. **测试覆盖**: 单元测试、集成测试和端到端测试

#### 开发建议
1. **熟悉 Drizzle ORM**: 理解类型安全的数据库操作
2. **掌握 Better Auth**: 学习现代化认证系统
3. **了解 PostgreSQL**: 掌握数据库设计和优化
4. **实践容器化**: 学习 Docker 和部署流程
5. **安全最佳实践**: 理解安全防护措施

#### 扩展方向
1. **微服务拆分**: 将认证、用户、项目等功能拆分为独立服务
2. **事件驱动**: 实现异步事件处理系统
3. **实时协作**: 添加 WebSocket 支持多用户实时编辑
4. **文件存储**: 集成云存储服务
5. **CDN 优化**: 添加内容分发网络

这个技术文档为开发者提供了 OpenCut 后端项目的全面技术概览，有助于快速理解和参与项目开发。通过模块化设计、类型安全和现代化技术栈，OpenCut 后端为前端提供了稳定、安全、高性能的服务支持。