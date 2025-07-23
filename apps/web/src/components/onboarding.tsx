// onboarding.tsx - React 组件
// 此文件包含 react 组件 的相关代码
// 文件路径: components/onboarding.tsx
// 最后更新: 2025/7/23

// onboarding.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入对话框组件，用于显示引导内容
import { Dialog, DialogContent } from "./ui/dialog";
// 导入按钮组件，用于交互操作
import { Button } from "./ui/button";
// 导入右箭头图标，用于下一步指示
import { ArrowRightIcon } from "lucide-react";
// 导入 React 状态管理钩子
import { useState, useEffect } from "react";
// 导入 Markdown 渲染组件，用于格式化文本内容
import ReactMarkdown from "react-markdown";

// 新用户引导组件 - 帮助首次访问的用户了解产品功能
// 导出组件 - 可复用的 UI 组件

// Onboarding 组件 - 可复用的 UI 组件，可以在其他文件中导入使用
export function Onboarding() {
  // 当前引导步骤状态，从0开始
  const [step, setStep] = useState(0);
  // 对话框显示状态
  const [isOpen, setIsOpen] = useState(false);

  // 组件挂载时检查用户是否已经看过引导
  useEffect(() => {
    // 从本地存储中检查引导状态
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    // 如果用户没有看过引导，则显示对话框
    if (!hasSeenOnboarding) {
      setIsOpen(true);
    }
  }, []);

  // 处理下一步按钮点击事件
  const handleNext = () => {
    setStep(step + 1);
  };

  // 处理关闭引导对话框事件
  const handleClose = () => {
    setIsOpen(false);
    // 将引导完成状态保存到本地存储
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  // 根据当前步骤渲染对应的引导内容
  const renderStepContent = () => {
    switch (step) {
      case 0:
        // 第一步：欢迎信息
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="Welcome to OpenCut Beta! 🎉" />
              <Description description="You're among the first to try OpenCut - the fully open source CapCut alternative." />
            </div>
            <NextButton onClick={handleNext}>Next</NextButton>
          </div>
        );
      case 1:
        // 第二步：Beta版本说明
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="⚠️ This is a super early beta!" />
              <Description description="OpenCut started just one month ago. There's still a ton of things to do to make this editor amazing." />
              <Description description="If you're curious, check out our roadmap [here](https://opencut.app/roadmap)" />
            </div>
            <NextButton onClick={handleNext}>Next</NextButton>
          </div>
        );
      case 2:
        return (
          <div className="space-y-5">
            <div className="space-y-3">
              <Title title="🦋 Have fun testing!" />
              <Description description="Join our [Discord](https://discord.gg/zmR9N35cjK), chat with cool people and share feedback to help make OpenCut the best editor ever." />
            </div>
            <NextButton onClick={handleClose}>Finish</NextButton>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] !outline-none">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}

// Title 函数
function Title({ title }: { title: string }) {
  return <h2 className="text-lg md:text-xl font-bold">{title}</h2>;
}

// Subtitle 函数
function Subtitle({ subtitle }: { subtitle: string }) {
  return <h3 className="text-lg font-medium">{subtitle}</h3>;
}

// Description 函数
function Description({ description }: { description: string }) {
  return (
    <div className="text-muted-foreground">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 underline"
            >
              {children}
            </a>
          ),
        }}
      >
        {description}
      </ReactMarkdown>
    </div>
  );
}

// NextButton 函数
function NextButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button onClick={onClick} variant="default" className="w-full">
      {children}
      <ArrowRightIcon className="w-4 h-4" />
    </Button>
  );
}
