// useSignUp.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/auth/useSignUp.ts
// 最后更新: 2025/7/23

// useSignUp.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useState, useCallback } from "react";
// 导入 Next.js 相关模块
import { useRouter } from "next/navigation";
// 导入 @opencut/auth/client 模块
import { signUp, signIn } from "@opencut/auth/client";

// useSignUp 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useSignUp() {
// 常量定义 - 模块内部使用的固定值
    const router = useRouter();
// 状态管理 - 创建和管理组件内部状态
    const [name, setName] = useState("");
// 状态管理 - 创建和管理组件内部状态
    const [email, setEmail] = useState("");
// 状态管理 - 创建和管理组件内部状态
    const [password, setPassword] = useState("");
// 常量定义 - 模块内部使用的固定值
    const [error, setError] = useState<string | null>(null);
// 状态管理 - 创建和管理组件内部状态
    const [isEmailLoading, setIsEmailLoading] = useState(false);
// 状态管理 - 创建和管理组件内部状态
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const handleSignUp = useCallback(async () => {
        setError(null);
        setIsEmailLoading(true);

// 常量定义 - 模块内部使用的固定值
        const { error } = await signUp.email({
            name,
            email,
            password,
        });

        if (error) {
            setError(error.message || "An unexpected error occurred.");
            setIsEmailLoading(false);
            return;
        }

        router.push("/login");
    }, [name, email, password, router]);

// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染
    const handleGoogleSignUp = useCallback(async () => {
        setError(null);
        setIsGoogleLoading(true);

        try {
            await signIn.social({
                provider: "google",
            });

            router.push("/editor");
        } catch (error) {
            setError("Failed to sign up with Google. Please try again.");
            setIsGoogleLoading(false);
        }
    }, [router]);

// 常量定义 - 模块内部使用的固定值
    const isAnyLoading = isEmailLoading || isGoogleLoading;

    return {
        name,
        setName,
        email,
        setEmail,
        password,
        setPassword,
        error,
        isEmailLoading,
        isGoogleLoading,
        isAnyLoading,
        handleSignUp,
        handleGoogleSignUp,
    };
}