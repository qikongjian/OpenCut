// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入首页英雄区域组件，包含主要的产品介绍和行动号召
import { Hero } from "@/components/landing/hero";
// 导入页面头部组件，包含导航栏和用户菜单
import { Header } from "@/components/header";
// 导入页面底部组件，包含链接和版权信息
import { Footer } from "@/components/footer";

// 首页组件 - 应用的着陆页面
export default async function Home() {
  return (
    <div>
      {/* 页面头部 - 导航栏和用户界面 */}
      <Header />
      {/* 英雄区域 - 产品介绍、功能展示和注册入口 */}
      <Hero />
      {/* 页面底部 - 链接、社交媒体和版权信息 */}
      <Footer />
    </div>
  );
}
