// actions.ts - 常量定义和配置
// 此文件包含 常量定义和配置 的相关代码
// 文件路径: constants/actions.ts
// 最后更新: 2025/7/23

// actions.ts - TypeScript 文件
// 此文件包含 typescript 文件 的相关代码

/* 动作系统 - 定义 OpenCut 中可以执行的各种操作
 * 一个 `action` 是一个唯一的动词，与 OpenCut 中可以执行的特定操作相关联。
 * 例如：切换播放状态、跳转播放位置等。
 */

// 导入 React 钩子，用于动作处理器的生命周期管理
import {
  useEffect,
  useRef,
  useState,
  useCallback,
  MutableRefObject,
} from "react";

// 简单的动作事件发射器，用于通知动作状态变化
class ActionEmitter {
  // 监听器列表，用于存储订阅动作变化的回调函数
  private listeners: Array<(actions: Action[]) => void> = [];

  // 订阅动作变化事件
  subscribe(listener: (actions: Action[]) => void) {
    this.listeners.push(listener);
    // 返回取消订阅函数
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // 发射动作变化事件，通知所有监听器
  emit(actions: Action[]) {
    this.listeners.forEach((listener) => listener(actions));
  }
}

// 创建全局动作发射器实例
const actionEmitter = new ActionEmitter();

// 定义所有可用的动作类型
export type Action =
  | "toggle-play" // 切换播放/暂停状态
  | "stop-playback" // 停止播放
  | "seek-forward" // 向前跳转播放位置
  | "seek-backward" // 向后跳转播放位置
  | "frame-step-forward" // 向前步进一帧
  | "frame-step-backward" // 向后步进一帧
  | "jump-forward" // 向前跳转5秒
  | "jump-backward" // 向后跳转5秒
  | "goto-start" // 跳转到时间线开始
  | "goto-end" // 跳转到时间线结束
  | "split-element" // 在当前时间分割元素
  | "delete-selected" // 删除选中的元素
  | "select-all" // 选择所有元素
  | "duplicate-selected" // 复制选中的元素
  | "toggle-snapping" // 切换吸附功能
  | "undo" // 撤销上一步操作
  | "redo"; // 重做上一步撤销的操作

/**
 * 定义动作参数映射类型
 * 这个类型是一个对象，键是上面提到的动作之一。
 * 值可以是任何类型。
 * 如果动作没有参数，则不需要在此类型中添加它。
 *
 * 注意：我们无法强制类型检查确保键是 Action 类型，
 * 如果在此文件中出现类型错误，你就知道哪里出错了
 */
// ActionArgsMap 类型定义
type ActionArgsMap = {
  "seek-forward": { seconds: number } | undefined; // 向前跳转需要的参数（默认：1秒）
  "seek-backward": { seconds: number } | undefined; // 向后跳转需要的参数（默认：1秒）
  "jump-forward": { seconds: number } | undefined; // 向前跳转需要的参数（默认：5秒）
  "jump-backward": { seconds: number } | undefined; // 向后跳转需要的参数（默认：5秒）
};

// 工具类型：获取值为 undefined 的键
type KeysWithValueUndefined<T> = {
  [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

/**
 * 需要参数的动作类型
 */
// 类型定义 - 创建类型别名或联合类型
export type ActionWithArgs = keyof ActionArgsMap;

/**
 * 可选参数的动作类型
 */
// 类型定义 - 创建类型别名或联合类型
export type ActionWithOptionalArgs =
  | ActionWithNoArgs
  | KeysWithValueUndefined<ActionArgsMap>;

/**
 * 不需要参数的动作类型
 */
// 类型定义 - 创建类型别名或联合类型
export type ActionWithNoArgs = Exclude<Action, ActionWithArgs>;

/**
 * 解析给定动作的参数类型
 */
// ArgOfHoppAction 类型定义
type ArgOfHoppAction<A extends Action> = A extends ActionWithArgs
  ? ActionArgsMap[A]
  : undefined;

/**
 * 解析给定动作的函数类型，用于动作处理器函数定义
 */
// ActionFunc 类型定义
type ActionFunc<A extends Action> = A extends ActionWithArgs
  ? (arg: ArgOfHoppAction<A>, trigger?: InvocationTriggers) => void
  : (_?: undefined, trigger?: InvocationTriggers) => void;

// 绑定动作列表类型
type BoundActionList = {
  [A in Action]?: Array<ActionFunc<A>>;
};

// 存储所有绑定的动作处理器
const boundActions: BoundActionList = {};

// 当前活跃的动作列表
let currentActiveActions: Action[] = [];

// 更新活跃动作列表并通知监听器
function updateActiveActions() {
// 常量定义 - 模块内部使用的固定值
  const newActions = Object.keys(boundActions) as Action[];
  currentActiveActions = newActions;
  actionEmitter.emit(newActions);
}

/**
 * 绑定动作处理器
 * @param action 要绑定的动作
 * @param handler 动作处理器函数
 */
// bindAction 函数
export function bindAction<A extends Action>(
  action: A,
  handler: ActionFunc<A>
) {
  if (boundActions[action]) {
    boundActions[action]?.push(handler);
  } else {
    // 使用 'any' 断言，因为 TypeScript 似乎无法理解这些链接
    boundActions[action] = [handler] as any;
  }

  updateActiveActions();
}

// 动作触发来源类型
export type InvocationTriggers = "keypress" | "mouseclick";

// 调用动作函数的类型定义
type InvokeActionFunc = {
  (
    action: ActionWithOptionalArgs,
    args?: undefined,
    trigger?: InvocationTriggers
  ): void;
  <A extends ActionWithArgs>(action: A, args: ActionArgsMap[A]): void;
};

/**
 * 调用动作，触发已注册的动作处理器
 * 第二个和第三个参数是可选的
 * @param action 要触发的动作
 * @param args 传递给动作处理器的参数。如果动作不需要参数则为可选
 * @param trigger 可选地提供触发动作的来源（键盘/鼠标点击）
 */
// 导出常量对象 - 包含多个相关常量的对象
export const invokeAction: InvokeActionFunc = <A extends Action>(
  action: A,
  args?: ArgOfHoppAction<A>,
  trigger?: InvocationTriggers
) => {
  boundActions[action]?.forEach((handler) => (handler as any)(args, trigger));
};

/**
 * 解绑动作处理器
 * @param action 要解绑的动作
 * @param handler 要解绑的处理器函数
 */
// unbindAction 函数
export function unbindAction<A extends Action>(
  action: A,
  handler: ActionFunc<A>
) {
  // 使用 'any' 断言，因为 TypeScript 似乎无法理解这些链接
  boundActions[action] = boundActions[action]?.filter(
    (x) => x !== handler
  ) as any;

  if (boundActions[action]?.length === 0) {
    delete boundActions[action];
  }

  updateActiveActions();
}

/**
 * 检查给定动作在给定时间是否已绑定
 * @param action 要检查的动作
 */
// isActionBound 函数
export function isActionBound(action: Action): boolean {
  return !!boundActions[action];
}

/**
 * React 钩子：定义组件可以处理给定的动作
 * 处理器将在组件挂载时绑定，在组件卸载时解绑
 * @param action 要绑定的动作
 * @param handler 动作被调用时要执行的函数
 * @param isActive 指示动作是否活跃的引用
 */
// useActionHandler 自定义钩子
export function useActionHandler<A extends Action>(
  action: A,
  handler: ActionFunc<A>,
  isActive: MutableRefObject<boolean> | boolean | undefined = undefined
) {
// 引用管理 - 保存可变值或直接访问 DOM 元素
  const handlerRef = useRef(handler);
// 状态管理 - 创建和管理组件内部状态
  const [isBound, setIsBound] = useState(false);

  // 当处理器变化时更新处理器引用
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  // 创建稳定的处理器包装器
  const stableHandler = useCallback(
    (args: any, trigger?: InvocationTriggers) => {
      (handlerRef.current as any)(args, trigger);
    },
    []
  ) as ActionFunc<A>;

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// 常量定义 - 模块内部使用的固定值
    const shouldBind =
      isActive === undefined ||
      (typeof isActive === "boolean" ? isActive : isActive.current);

    if (shouldBind && !isBound) {
      bindAction(action, stableHandler);
      setIsBound(true);
    } else if (!shouldBind && isBound) {
      unbindAction(action, stableHandler);
      setIsBound(false);
    }

    return () => {
      if (isBound) {
        unbindAction(action, stableHandler);
        setIsBound(false);
      }
    };
  }, [action, stableHandler, isActive, isBound]);

  // 处理基于引用的 isActive 变化
  useEffect(() => {
    if (isActive && typeof isActive === "object" && "current" in isActive) {
      // 轮询引用变化
      const interval = setInterval(() => {
// 常量定义 - 模块内部使用的固定值
        const shouldBind = isActive.current;
        if (shouldBind !== isBound) {
          if (shouldBind) {
            bindAction(action, stableHandler);
          } else {
            unbindAction(action, stableHandler);
          }
          setIsBound(shouldBind);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [action, stableHandler, isActive, isBound]);
}

/**
 * React 钩子：返回当前活跃动作列表
 * 当列表变化时会重新渲染
 */
// useActiveActions 自定义钩子
export function useActiveActions(): Action[] {
// 常量定义 - 模块内部使用的固定值
  const [activeActions, setActiveActions] = useState<Action[]>([]);

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
    // 设置初始值
    setActiveActions(currentActiveActions);

    // 订阅变化
    const unsubscribe = actionEmitter.subscribe(setActiveActions);
    return unsubscribe;
  }, []);

  return activeActions;
}

/**
 * React 钩子：返回特定动作当前是否已绑定
 * 当绑定状态变化时会重新渲染
 */
// useIsActionBound 自定义钩子
export function useIsActionBound(action: Action): boolean {
// 状态管理 - 创建和管理组件内部状态
  const [isBound, setIsBound] = useState(() => isActionBound(action));

// 副作用处理 - 处理组件生命周期中的副作用操作
  useEffect(() => {
// updateBoundState 函数
    const updateBoundState = () => {
      setIsBound(isActionBound(action));
    };

    // 设置初始值
    updateBoundState();

    // 订阅变化
    const unsubscribe = actionEmitter.subscribe(updateBoundState);
    return unsubscribe;
  }, [action]);

  return isBound;
}
