// blog-query.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/blog-query.ts
// 最后更新: 2025/7/23

// blog-query.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入项目模块
import type { MarbleAuthorList, MarbleCategoryList, MarblePost, MarblePostList, MarbleTagList } from '@/types/post';
// 导入 Unified 文本处理库
import { unified } from "unified";
// 导入 rehype-parse 模块
import rehypeParse from "rehype-parse";
// 导入 rehype-stringify 模块
import rehypeStringify from "rehype-stringify";
// 导入 rehype-slug 模块
import rehypeSlug from "rehype-slug";
// 导入 rehype-autolink-headings 模块
import rehypeAutolinkHeadings from "rehype-autolink-headings";
// 导入 rehype-sanitize 模块
import rehypeSanitize from "rehype-sanitize";

// 常量定义 - 模块内部使用的固定值
const url = process.env.NEXT_PUBLIC_MARBLE_API_URL ?? "https://api.marblecms.com";
// 常量定义 - 模块内部使用的固定值
const key = process.env.MARBLE_WORKSPACE_KEY ?? "cmd4iw9mm0006l804kwqv0k46";

// fetchFromMarble 函数
async function fetchFromMarble<T>(endpoint: string): Promise<T> {
    try {
// 常量定义 - 模块内部使用的固定值
      const response = await fetch(`${url}/${key}/${endpoint}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
      }
      return await response.json() as T;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }
  
// getPosts 函数
  export async function getPosts() {
    return fetchFromMarble<MarblePostList>('posts');
  }
  
// getTags 函数
  export async function getTags() {
    return fetchFromMarble<MarbleTagList>('tags');
  }
  
// getSinglePost 函数
  export async function getSinglePost(slug: string) {
    return fetchFromMarble<MarblePost>(`posts/${slug}`);
  }
  
// getCategories 函数
  export async function getCategories() {
    return fetchFromMarble<MarbleCategoryList>('categories');
  }
  
// getAuthors 函数
  export async function getAuthors() {
    return fetchFromMarble<MarbleAuthorList>('authors');
  }

// processHtmlContent 函数
export async function processHtmlContent(html: string): Promise<string> {
// 常量定义 - 模块内部使用的固定值
	const processor = unified()
        .use(rehypeSanitize)
		.use(rehypeParse, { fragment: true })
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings, { behavior: "append" })
		.use(rehypeStringify);

// 常量定义 - 模块内部使用的固定值
	const file = await processor.process(html);
	return String(file);
}
