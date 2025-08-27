import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { keys as auth } from "@opencut/auth/keys";
import { keys as db } from "@opencut/db/keys";

export const env = createEnv({
  extends: [vercel(), auth(), db()],
  server: {
    ANALYZE: z.string().optional(),
    // Added by Vercel
    NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    FREESOUND_CLIENT_ID: z.string().optional(),
    FREESOUND_API_KEY: z.string().optional(),
    // R2 / Cloudflare
    CLOUDFLARE_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    // Modal transcription
    MODAL_TRANSCRIPTION_URL: z.string().optional(),
    // AI剪辑计划API
    AI_EDITING_PLAN_API_URL: z.string().url().optional(),
    // 七牛云配置
    QINIU_ACCESS_KEY: z.string().optional(),
    QINIU_SECRET_KEY: z.string().optional(),
    QINIU_BUCKET_NAME: z.string().optional(),
    QINIU_DOMAIN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_AI_EDITING_PLAN_API_URL: z.string().url().optional(),
  },
  runtimeEnv: {
    ANALYZE: process.env.ANALYZE,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    FREESOUND_CLIENT_ID: process.env.FREESOUND_CLIENT_ID,
    FREESOUND_API_KEY: process.env.FREESOUND_API_KEY,
    // R2 / Cloudflare
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
    // Modal transcription
    MODAL_TRANSCRIPTION_URL: process.env.MODAL_TRANSCRIPTION_URL,
    // AI剪辑计划API
    AI_EDITING_PLAN_API_URL: process.env.AI_EDITING_PLAN_API_URL,
    NEXT_PUBLIC_AI_EDITING_PLAN_API_URL: process.env.NEXT_PUBLIC_AI_EDITING_PLAN_API_URL,
    // 七牛云配置
    QINIU_ACCESS_KEY: process.env.QINIU_ACCESS_KEY,
    QINIU_SECRET_KEY: process.env.QINIU_SECRET_KEY,
    QINIU_BUCKET_NAME: process.env.QINIU_BUCKET_NAME,
    QINIU_DOMAIN: process.env.QINIU_DOMAIN,
  },
});
