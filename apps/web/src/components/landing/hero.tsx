// hero.tsx - 落地页组件
// 此文件包含 落地页组件 的相关代码
// 文件路径: components/landing/hero.tsx
// 最后更新: 2025/7/23

// hero.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import { motion } from "motion/react";
// 导入本地模块
import { Button } from "../ui/button";
// 导入本地模块
import { SponsorButton } from "../ui/sponsor-button";
// 导入本地模块
import { VercelIcon } from "../icons";
// 导入 React 核心库
import { ArrowRight } from "lucide-react";

// 导入 Next.js 相关模块
import Image from "next/image";
// 导入本地模块
import { Handlebars } from "./handlebars";
// 导入 Next.js 相关模块
import Link from "next/link";

// Hero 函数
// 导出组件 - 可复用的 UI 组件
export function Hero() {
  return (
    <div className="min-h-[calc(100vh-4.5rem)] supports-[height:100dvh]:min-h-[calc(100dvh-4.5rem)] flex flex-col justify-between items-center text-center px-4">
      <Image
        className="absolute top-0 left-0 -z-50 size-full object-cover"
        src="/landing-page-bg.png"
        height={1903.5}
        width={1269}
        alt="landing-page.bg"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="max-w-3xl mx-auto w-full flex-1 flex flex-col justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mb-8 flex justify-center"
        >
          <SponsorButton
            href="https://vercel.com/home?utm_source=opencut"
            logo={VercelIcon}
            companyName="Vercel"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-block font-bold tracking-tighter text-4xl md:text-[4rem]"
        >
          <h1>The Open Source</h1>
          <Handlebars>Video Editor</Handlebars>
        </motion.div>

        <motion.p
          className="mt-10 text-base sm:text-xl text-muted-foreground font-light tracking-wide max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          A simple but powerful video editor that gets the job done. Works on
          any platform.
        </motion.p>

        <motion.div
          className="mt-8 flex gap-8 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Link href="/projects">
            <Button
              type="submit"
              size="lg"
              className="px-6 h-11 text-base bg-foreground"
            >
              Try early beta
              <ArrowRight className="relative z-10 ml-0.5 h-4 w-4 inline-block" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
