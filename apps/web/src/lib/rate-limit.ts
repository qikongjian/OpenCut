// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/env";

// 创建Redis连接，如果配置不存在则使用null
let redis: Redis | null = null;
let baseRateLimit: Ratelimit | null = null;

try {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    baseRateLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "rate-limit",
    });

    console.log('✅ Redis速率限制器初始化成功');
  } else {
    console.warn('⚠️ Redis配置缺失，速率限制器将不可用');
  }
} catch (error) {
  console.warn('⚠️ Redis连接失败，速率限制器将不可用:', error);
}

// 导出一个安全的速率限制器包装器
export const safeRateLimit = {
  async limit(identifier: string) {
    if (!baseRateLimit) {
      // 如果Redis不可用，直接返回成功
      console.warn('⚠️ Redis不可用，跳过速率限制检查');
      return { success: true, limit: 0, remaining: 999, reset: Date.now() + 60000 };
    }

    try {
      return await baseRateLimit.limit(identifier);
    } catch (error) {
      console.warn('⚠️ 速率限制检查失败，跳过限制:', error);
      return { success: true, limit: 0, remaining: 999, reset: Date.now() + 60000 };
    }
  }
};

// 保持向后兼容
export { baseRateLimit };
