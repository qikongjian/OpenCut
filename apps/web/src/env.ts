// env.ts - 环境变量配置
// 此文件包含 环境变量配置 的相关代码
// 文件路径: env.ts
// 最后更新: 2025/7/23

// env.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 Zod 类型验证库
import { vercel } from "@t3-oss/env-core/presets-zod";
// 导入 Next.js 相关模块
import { createEnv } from "@t3-oss/env-nextjs";
// 导入 Zod 类型验证库
import { z } from "zod";
// 导入 @opencut/auth/keys 模块
import { keys as auth } from "@opencut/auth/keys";
// 导入 @opencut/db/keys 模块
import { keys as db } from "@opencut/db/keys";

// 导出常量对象 - 包含多个相关常量的对象
export const env = createEnv({
  extends: [vercel(), auth(), db()],
  server: {
    ANALYZE: z.string().optional(),
    // Added by Vercel
    NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
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
