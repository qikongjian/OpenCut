// fetch-github-stars.ts - 工具库和辅助函数
// 此文件包含 工具库和辅助函数 的相关代码
// 文件路径: lib/fetch-github-stars.ts
// 最后更新: 2025/7/23

// fetch-github-stars.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// getStars 函数
export async function getStars(): Promise<string> {
  try {
// 常量定义 - 模块内部使用的固定值
    const res = await fetch(
      "https://api.github.com/repos/OpenCut-app/OpenCut",
      {
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
    }
// data 函数
    const data = (await res.json()) as { stargazers_count: number };
// 常量定义 - 模块内部使用的固定值
    const count = data.stargazers_count;

    if (typeof count !== "number") {
      throw new Error("Invalid stargazers_count from GitHub API");
    }

    if (count >= 1_000_000)
      return (count / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    if (count >= 1_000)
      return (count / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
    return count.toString();
  } catch (error) {
    console.error("Failed to fetch GitHub stars:", error);
    return "1.5k";
  }
}
