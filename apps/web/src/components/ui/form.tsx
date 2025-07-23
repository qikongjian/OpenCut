// form.tsx - 基础 UI 组件
// 此文件包含 基础 ui 组件 的相关代码
// 文件路径: components/ui/form.tsx
// 最后更新: 2025/7/23

// form.tsx - React 组件文件
// 此文件包含 react 组件文件 的相关代码

"use client";

// 导入 React 核心库
import * as React from "react";
// 导入 Radix UI 组件库
import { Label as LabelPrimitive, Slot as SlotPrimitive } from "radix-ui";

// 导入模块
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

// 导入本地模块
import { cn } from "../../lib/utils";
// 导入本地模块
import { Label } from "./label";

// 常量定义 - 模块内部使用的固定值
const Form = FormProvider;

// FormFieldContextValue 类型定义
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

// 常量定义 - 模块内部使用的固定值
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

// 常量定义 - 模块内部使用的固定值
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// useFormField 自定义钩子
const useFormField = () => {
// 上下文消费 - 消费 React 上下文中的值
  const fieldContext = React.useContext(FormFieldContext);
// 上下文消费 - 消费 React 上下文中的值
  const itemContext = React.useContext(FormItemContext);
// 常量定义 - 模块内部使用的固定值
  const { getFieldState, formState } = useFormContext();

// 常量定义 - 模块内部使用的固定值
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

// 常量定义 - 模块内部使用的固定值
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// FormItemContextValue 类型定义
type FormItemContextValue = {
  id: string;
};

// 常量定义 - 模块内部使用的固定值
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// 常量定义 - 模块内部使用的固定值
const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

// 常量定义 - 模块内部使用的固定值
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

// 常量定义 - 模块内部使用的固定值
const FormControl = React.forwardRef<
  React.ElementRef<typeof SlotPrimitive.Slot>,
  // React 类组件 - 基于类的组件
  React.ComponentPropsWithoutRef<typeof SlotPrimitive.Slot>
>(({ ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <SlotPrimitive.Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

// 常量定义 - 模块内部使用的固定值
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-[0.8rem] text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

// 常量定义 - 模块内部使用的固定值
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
// 常量定义 - 模块内部使用的固定值
  const { error, formMessageId } = useFormField();
// 常量定义 - 模块内部使用的固定值
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-[0.8rem] font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
