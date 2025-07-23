// useLogin.ts - 自定义 React Hook
// 此文件包含 自定义 react hook 的相关代码
// 文件路径: hooks/auth/useLogin.ts
// 最后更新: 2025/7/23

// useLogin.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

// 导入 React 核心库
import { useCallback, useState } from "react";
// 导入 Next.js 相关模块
import { useRouter } from "next/navigation";
// 导入 @opencut/auth/client 模块
import { signIn } from "@opencut/auth/client";

// useLogin 自定义钩子
// 自定义 Hook - 可复用的状态逻辑
export function useLogin() {
// 常量定义 - 模块内部使用的固定值
    const router = useRouter();
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
    const handleLogin = useCallback(async () => {
        setError(null);
        setIsEmailLoading(true);

// 常量定义 - 模块内部使用的固定值
        const { error } = await signIn.email({
            email,
            password,
        });

        if (error) {
            setError(error.message || "An unexpected error occurred.");
            setIsEmailLoading(false);
            return;
        }

        router.push("/projects");
    }, [router, email, password]);

// 常量定义 - 模块内部使用的固定值
    const handleGoogleLogin = async () => {
        setError(null);
        setIsGoogleLoading(true);

        try {
            await signIn.social({
                provider: "google",
                callbackURL: "/projects",
            });
        } catch (error) {
            setError("Failed to sign in with Google. Please try again.");
            setIsGoogleLoading(false);
        }
    };

// 常量定义 - 模块内部使用的固定值
    const isAnyLoading = isEmailLoading || isGoogleLoading;

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isEmailLoading,
        isGoogleLoading,
        isAnyLoading,
        handleLogin,
        handleGoogleLogin,
    };
}
