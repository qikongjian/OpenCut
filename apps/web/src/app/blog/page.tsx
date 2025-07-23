// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/blog/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入 Next.js 相关模块
import { Metadata } from "next";
// 导入项目模块
import { Header } from "@/components/header";
// 导入项目模块
import { Card, CardContent } from "@/components/ui/card";
// 导入项目模块
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// 导入 Next.js 相关模块
import Link from "next/link";
// 导入项目模块
import { getPosts } from "@/lib/blog-query";
// 导入 Next.js 相关模块
import Image from "next/image";

// 导出常量对象 - 包含多个相关常量的对象
export const metadata: Metadata = {
  title: "Blog - OpenCut",
  description:
    "Read the latest news and updates about OpenCut, the free and open-source video editor.",
  openGraph: {
    title: "Blog - OpenCut",
    description:
      "Read the latest news and updates about OpenCut, the free and open-source video editor.",
    type: "website",
  },
};

// BlogPage 组件
export default async function BlogPage() {
// 常量定义 - 模块内部使用的固定值
  const data = await getPosts();
  if (!data || !data.posts) return <div>No posts yet</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-muted/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-tr from-muted/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative container max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Blog
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Read the latest news and updates about OpenCut, the free and
              open-source video editor.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.posts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {post.coverImage && (
                    <div className="relative aspect-video">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover rounded-xl"
                      />
                    </div>
                  )}

                  <CardContent className="p-6">
                    {post.authors && post.authors.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {post.authors.map((author, index) => (
                          <div
                            key={author.id}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="w-6 h-6">
                              <AvatarImage
                                src={author.image}
                                alt={author.name}
                              />
                              <AvatarFallback className="text-xs">
                                {author.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              {author.name}
                            </span>
                            {index < post.authors.length - 1 && (
                              <span className="text-muted-foreground">•</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                    <p className="text-muted-foreground">{post.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
