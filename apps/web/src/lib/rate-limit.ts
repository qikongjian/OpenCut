// rate-limit.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/rate-limit.ts
// 最后更新: 2025/7/23

// rate-limit.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
// 导入 Upstash Redis 客户端
import { Redis } from "@upstash/redis";
// 导入项目模块
import { env } from "@/env";

// 常量定义 - 模块内部使用的固定值
const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// 导出常量对象 - 包含多个相关常量的对象
export const waitlistRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
  analytics: true,
  prefix: "waitlist-rate-limit",
});
