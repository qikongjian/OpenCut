// route.ts - Next.js API 路由
// 此文件包含 next.js api 路由 的相关代码
// 文件路径: app/api/auth/[...all]/route.ts
// 最后更新: 2025/7/23

// route.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 @opencut/auth 模块
import { auth } from "@opencut/auth";
// 导入 Next.js 相关模块
import { toNextJsHandler } from "better-auth/next-js";

// 导出常量对象 - 包含多个相关常量的对象
export const { POST, GET } = toNextJsHandler(auth);