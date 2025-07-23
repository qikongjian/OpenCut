// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/blog/[slug]/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

// 导入项目模块
import { Header } from "@/components/header";
// 导入项目模块
import Prose from "@/components/ui/prose";
// 导入项目模块
import { Separator } from "@/components/ui/separator";
// 导入项目模块
import { getPosts, getSinglePost, processHtmlContent } from "@/lib/blog-query";
// 导入 Next.js 相关模块
import { Metadata } from "next";
// 导入 Next.js 相关模块
import Image from "next/image";
// 导入 Next.js 相关模块
import { notFound } from "next/navigation";

// PageProps 类型定义
type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// generateMetadata 函数
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
// slug 函数
  const slug = (await params).slug;

// 常量定义 - 模块内部使用的固定值
  const data = await getSinglePost(slug);

  if (!data || !data.post) return {};

  return {
    title: data.post.title,
    description: data.post.description,
    twitter: {
      title: `${data.post.title}`,
      description: `${data.post.description}`,
      card: "summary_large_image",
      images: [
        {
          url: data.post.coverImage,
          width: "1200",
          height: "630",
          alt: data.post.title,
        },
      ],
    },
    openGraph: {
      type: "article",
      images: [
        {
          url: data.post.coverImage,
          width: "1200",
          height: "630",
          alt: data.post.title,
        },
      ],
      title: data.post.title,
      description: data.post.description,
      publishedTime: new Date(data.post.publishedAt).toISOString(),
      authors: [
        ...data.post.authors.map((author: { name: string }) => author.name),
      ],
    },
  };
}

// generateStaticParams 函数
export async function generateStaticParams() {
// 常量定义 - 模块内部使用的固定值
  const data = await getPosts();
  if (!data || !data.posts.length) return [];

  return data.posts.map((post) => ({
    slug: post.slug,
  }));
}

// Page 组件
async function Page({ params }: PageProps) {
// slug 函数
  const slug = (await params).slug;
// 常量定义 - 模块内部使用的固定值
  const data = await getSinglePost(slug);
  if (!data || !data.post) return notFound();

// 常量定义 - 模块内部使用的固定值
  const html = await processHtmlContent(data.post.content);

// 常量定义 - 模块内部使用的固定值
  const formattedDate = new Date(data.post.publishedAt).toLocaleDateString(
    "en-US",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-muted/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-tr from-muted/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative container max-w-3xl mx-auto px-4 py-16">
          <div className="text-center mb-6">
            {data.post.coverImage && (
              <div className="relative aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={data.post.coverImage}
                  alt={data.post.title}
                  loading="eager"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex items-center justify-center mb-6">
              <time dateTime={data.post.publishedAt.toString()}>
                {formattedDate}
              </time>
            </div>

            <h1 className="text-5xl md:text-4xl font-bold tracking-tight mb-6">
              {data.post.title}
            </h1>
            <div className="flex items-center justify-center gap-2">
              {data.post.authors[0] && (
                <>
                  <Image
                    src={data.post.authors[0].image}
                    alt={data.post.authors[0].name}
                    width={36}
                    height={36}
                    loading="eager"
                    className="aspect-square shrink-0 size-8 rounded-full"
                  />
                  <p className="text-muted-foreground">
                    {data.post.authors[0].name}
                  </p>
                </>
              )}
            </div>
          </div>
          <Separator />
          <section className="mt-14">
            <Prose html={html} />
          </section>
        </div>
      </main>
    </div>
  );
}

export default Page;
