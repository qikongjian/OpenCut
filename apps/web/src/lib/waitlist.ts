// waitlist.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/waitlist.ts
// 最后更新: 2025/7/23

// waitlist.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 @opencut/db 模块
import { db, sql, waitlist } from "@opencut/db";

// getWaitlistCount 函数
export async function getWaitlistCount() {
  try {
// 常量定义 - 模块内部使用的固定值
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlist);
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Failed to fetch waitlist count:", error);
    return 0;
  }
}
