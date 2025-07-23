// post.ts - TypeScript 类型定义
// 此文件包含 typescript 类型定义 的相关代码
// 文件路径: types/post.ts
// 最后更新: 2025/7/23

// post.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 类型定义 - 创建类型别名或联合类型
export type Post = {
    id: string;
    slug: string;
    title: string;
    content: string;
    description: string;
    coverImage: string;
    publishedAt: Date;
    updatedAt: Date;
    authors: {
      id: string;
      name: string;
      image: string;
    }[];
    category: {
      id: string;
      slug: string;
      name: string;
    };
    tags: {
      id: string;
      slug: string;
      name: string;
    }[];
    attribution: {
      author: string;
      url: string;
    } | null;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type Pagination = {
    limit: number;
    currpage: number;
    nextPage: number | null;
    prevPage: number | null;
    totalItems: number;
    totalPages: number;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarblePostList = {
    posts: Post[];
    pagination: Pagination;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarblePost = {
    post: Post;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type Tag = {
    id: string;
    name: string;
    slug: string;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleTag = {
    tag: Tag;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleTagList = {
    tags: Tag[];
    pagination: Pagination;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type Category = {
    id: string;
    name: string;
    slug: string;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleCategory = {
    category: Category;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleCategoryList = {
    categories: Category[];
    pagination: Pagination;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type Author = {
    id: string;
    name: string;
    image: string;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleAuthor = {
    author: Author;
  };
  
// 类型定义 - 创建类型别名或联合类型
  export type MarbleAuthorList = {
    authors: Author[];
    pagination: Pagination;
  };
  