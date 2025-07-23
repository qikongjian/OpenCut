// page.tsx - Next.js 页面组件
// 此文件包含 next.js 页面组件 的相关代码
// 文件路径: app/(auth)/signup/page.tsx
// 最后更新: 2025/7/23

// page.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 Next.js 相关模块
import { useRouter } from "next/navigation";
// 导入项目模块
import { Button } from "@/components/ui/button";
// 导入模块
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// 导入 React 核心库
import { memo, Suspense } from "react";
// 导入项目模块
import { Input } from "@/components/ui/input";
// 导入项目模块
import { Label } from "@/components/ui/label";
// 导入项目模块
import { Separator } from "@/components/ui/separator";
// 导入 Next.js 相关模块
import Link from "next/link";
// 导入项目模块
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// 导入 React 核心库
import { ArrowLeft, Loader2 } from "lucide-react";
// 导入项目模块
import { GoogleIcon } from "@/components/icons";
// 导入项目模块
import { useSignUp } from "@/hooks/auth/useSignUp";

// SignUpPage 组件
const SignUpPage = () => {
// 常量定义 - 模块内部使用的固定值
  const router = useRouter();
// 常量定义 - 模块内部使用的固定值
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isAnyLoading,
    isEmailLoading,
    isGoogleLoading,
    handleSignUp,
    handleGoogleSignUp,
  } = useSignUp();

  return (
    <div className="flex h-screen items-center justify-center relative">
      <Button
        variant="text"
        onClick={() => router.back()}
        className="absolute top-6 left-6"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </Button>
      <Card className="w-[400px] shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-semibold">
            Create your account
          </CardTitle>
          <CardDescription className="text-base">
            Get started with your free account today
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Suspense
            fallback={
              <div className="text-center">
                <Loader2 className="animate-spin" />
              </div>
            }
          >
            <div className="flex flex-col space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleGoogleSignUp}
                variant="outline"
                size="lg"
                disabled={isAnyLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <GoogleIcon />
                )}{" "}
                Continue with Google
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isAnyLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isAnyLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isAnyLoading}
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleSignUp}
                  disabled={isAnyLoading || !name || !email || !password}
                  className="w-full h-11"
                  size="lg"
                >
                  {isEmailLoading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Create account"
                  )}
                </Button>
              </div>
            </div>
            <div className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </div>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(SignUpPage);
