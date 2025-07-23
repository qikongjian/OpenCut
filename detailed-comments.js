#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 详细的代码分析工具
class CodeAnalyzer {
  constructor() {
    this.importPatterns = {
      // React 相关
      'react': {
        'react': '// 导入 React 核心库，提供 JSX 语法和组件系统',
        'useState': '// 导入 useState Hook，用于管理组件内部状态',
        'useEffect': '// 导入 useEffect Hook，用于处理组件副作用（如数据获取、订阅、DOM 操作）',
        'useCallback': '// 导入 useCallback Hook，用于缓存函数引用，避免不必要的重新渲染',
        'useMemo': '// 导入 useMemo Hook，用于缓存计算结果，优化性能',
        'useRef': '// 导入 useRef Hook，用于保存可变值或直接访问 DOM 元素',
        'useContext': '// 导入 useContext Hook，用于消费 React 上下文',
        'useReducer': '// 导入 useReducer Hook，用于管理复杂的状态逻辑',
        'useLayoutEffect': '// 导入 useLayoutEffect Hook，用于同步 DOM 更新，在浏览器绘制前执行',
        'useImperativeHandle': '// 导入 useImperativeHandle Hook，用于向父组件暴露命令式方法',
        'useDebugValue': '// 导入 useDebugValue Hook，用于在 React DevTools 中显示自定义标签',
        'useId': '// 导入 useId Hook，用于生成唯一标识符',
        'useTransition': '// 导入 useTransition Hook，用于标记非紧急更新',
        'useDeferredValue': '// 导入 useDeferredValue Hook，用于延迟更新值',
        'useSyncExternalStore': '// 导入 useSyncExternalStore Hook，用于订阅外部数据源',
        'useInsertionEffect': '// 导入 useInsertionEffect Hook，用于在 DOM 插入前执行副作用',
        'Suspense': '// 导入 Suspense 组件，用于包装异步组件和懒加载',
        'lazy': '// 导入 lazy 函数，用于代码分割和懒加载组件',
        'memo': '// 导入 memo 高阶组件，用于性能优化，避免不必要的重新渲染',
        'forwardRef': '// 导入 forwardRef 函数，用于向子组件转发 ref',
        'createContext': '// 导入 createContext 函数，用于创建 React 上下文',
        'createRef': '// 导入 createRef 函数，用于创建 ref 对象',
        'Fragment': '// 导入 Fragment 组件，用于在不添加额外 DOM 节点的情况下组合元素',
        'StrictMode': '// 导入 StrictMode 组件，用于启用严格模式检查',
        'Profiler': '// 导入 Profiler 组件，用于测量渲染性能',
        'ErrorBoundary': '// 导入 ErrorBoundary 组件，用于捕获子组件错误',
      },
      
      // Next.js 相关
      'next': {
        'next/navigation': '// 导入 Next.js 导航模块，提供客户端导航功能',
        'next/link': '// 导入 Link 组件，用于客户端路由导航',
        'next/image': '// 导入 Image 组件，用于优化的图片显示',
        'next/script': '// 导入 Script 组件，用于加载外部脚本',
        'next/head': '// 导入 Head 组件，用于管理页面头部信息',
        'next/router': '// 导入 Next.js 路由器，提供路由信息和导航方法',
        'next/config': '// 导入 Next.js 配置类型',
        'next/types': '// 导入 Next.js 类型定义',
        'useRouter': '// 导入 useRouter Hook，用于获取路由信息和导航方法',
        'useParams': '// 导入 useParams Hook，用于获取动态路由参数',
        'useSearchParams': '// 导入 useSearchParams Hook，用于获取查询参数',
        'usePathname': '// 导入 usePathname Hook，用于获取当前路径',
        'redirect': '// 导入 redirect 函数，用于服务器端重定向',
        'permanentRedirect': '// 导入 permanentRedirect 函数，用于永久重定向',
        'notFound': '// 导入 notFound 函数，用于触发 404 页面',
      },
      
      // 状态管理
      'zustand': {
        'zustand': '// 导入 Zustand 状态管理库，提供轻量级的状态管理解决方案',
        'create': '// 导入 create 函数，用于创建状态存储',
        'subscribeWithSelector': '// 导入 subscribeWithSelector 函数，用于选择性订阅状态变化',
        'devtools': '// 导入 devtools 中间件，用于 Redux DevTools 集成',
        'persist': '// 导入 persist 中间件，用于状态持久化',
        'immer': '// 导入 immer 中间件，用于不可变状态更新',
        'shallow': '// 导入 shallow 比较函数，用于浅比较对象',
      },
      
      // UI 组件库
      'lucide-react': '// 导入 Lucide React 图标库，提供丰富的 SVG 图标',
      'radix-ui': '// 导入 Radix UI 组件库，提供无样式的可访问组件',
      'framer-motion': '// 导入 Framer Motion 动画库，提供流畅的动画效果',
      'sonner': '// 导入 Sonner 通知库，提供现代化的 Toast 通知',
      'vaul': '// 导入 Vaul 抽屉组件库，提供侧边抽屉功能',
      'embla-carousel-react': '// 导入 Embla 轮播组件，提供高性能的轮播功能',
      'react-resizable-panels': '// 导入可调整大小面板组件，提供灵活的布局系统',
      'react-day-picker': '// 导入日期选择器组件，提供日历和日期选择功能',
      'react-phone-number-input': '// 导入手机号码输入组件，提供国际化的电话号码输入',
      'input-otp': '// 导入一次性密码输入组件，提供 OTP 验证码输入',
      'react-hook-form': '// 导入 React Hook Form 表单库，提供高性能的表单处理',
      'react-markdown': '// 导入 React Markdown 渲染器，用于渲染 Markdown 内容',
      'recharts': '// 导入 Recharts 图表库，提供丰富的图表组件',
      'cmdk': '// 导入 CMDK 命令面板组件，提供命令搜索功能',
      
      // 样式相关
      'tailwind': '// 导入 Tailwind CSS 相关模块，提供实用优先的 CSS 框架',
      'clsx': '// 导入 clsx 库，用于条件性地组合 CSS 类名',
      'tailwind-merge': '// 导入 tailwind-merge 库，用于智能合并 Tailwind 类名',
      'class-variance-authority': '// 导入 CVA 库，用于创建类型安全的组件变体',
      'tailwindcss-animate': '// 导入 Tailwind CSS 动画插件，提供预设动画',
      
      // 类型验证
      'zod': '// 导入 Zod 类型验证库，提供运行时类型检查和模式验证',
      
      // 数据库和存储
      'drizzle-orm': '// 导入 Drizzle ORM，提供类型安全的数据库操作',
      'better-auth': '// 导入 Better Auth 认证库，提供现代化的认证解决方案',
      'upstash': '// 导入 Upstash Redis 客户端，提供 Redis 数据库连接',
      
      // 视频和音频处理
      'ffmpeg': '// 导入 FFmpeg 相关模块，提供视频和音频处理功能',
      'wavesurfer': '// 导入 WaveSurfer 音频波形库，提供音频可视化功能',
      
      // 工具库
      'dayjs': '// 导入 Day.js 日期处理库，提供轻量级的日期操作',
      'unified': '// 导入 Unified 文本处理库，提供统一的文本处理接口',
      'rehype': '// 导入 Rehype 插件，用于 HTML 处理',
      'remark': '// 导入 Remark 插件，用于 Markdown 处理',
      
      // 其他
      'motion': '// 导入 Motion 动画库，提供高性能的动画系统',
      'react-icons': '// 导入 React Icons 图标库，提供多种图标集合',
    };

    this.functionPatterns = {
      // 组件函数
      'export default function': '// 默认导出组件 - 这是页面的主要组件或模块的入口点',
      'export function': '// 导出组件 - 可复用的 UI 组件，可以在其他文件中导入使用',
      'function Component': '// 组件函数 - 定义了一个 React 组件',
      'const Component': '// 组件常量 - 使用箭头函数定义的 React 组件',
      'React.FC': '// React 函数组件 - 带有 TypeScript 类型的函数组件',
      'React.Component': '// React 类组件 - 基于 ES6 类的组件定义',
      
      // Hook 函数
      'export function use': '// 自定义 Hook - 可复用的状态逻辑，遵循 React Hook 规则',
      'function use': '// 自定义 Hook - 封装了组件逻辑的自定义 Hook',
      
      // 工具函数
      'export function': '// 工具函数 - 可复用的功能函数，提供特定的业务逻辑',
      'function ': '// 函数定义 - 模块内部的辅助函数',
      'const ': '// 常量定义 - 不可变的值或函数表达式',
      'export const': '// 导出常量 - 可在其他模块中使用的固定值或函数',
      
      // 异步函数
      'async function': '// 异步函数 - 处理异步操作，如 API 调用、文件操作等',
      'export async function': '// 导出异步函数 - 可在其他模块中使用的异步函数',
      
      // 生成器函数
      'function*': '// 生成器函数 - 使用迭代器模式，可以暂停和恢复执行',
      'export function*': '// 导出生成器函数 - 可在其他模块中使用的生成器函数',
    };

    this.typePatterns = {
      // 接口定义
      'interface ': '// 接口定义 - 定义对象的结构和属性类型',
      'export interface': '// 导出接口 - 可在其他模块中使用的类型定义',
      
      // 类型定义
      'type ': '// 类型定义 - 创建类型别名或联合类型',
      'export type': '// 导出类型 - 可在其他模块中使用的类型定义',
      
      // 枚举定义
      'enum ': '// 枚举定义 - 定义一组相关的常量值',
      'export enum': '// 导出枚举 - 可在其他模块中使用的枚举定义',
      
      // 泛型类型
      'extends ': '// 继承接口 - 扩展现有接口，添加新的属性或方法',
      '& ': '// 交叉类型 - 合并多个类型的属性',
      '| ': '// 联合类型 - 表示多个类型中的一个',
      'Partial<': '// 部分类型 - 将所有属性变为可选',
      'Required<': '// 必需类型 - 将所有属性变为必需',
      'Pick<': '// 选择类型 - 从现有类型中选择特定属性',
      'Omit<': '// 省略类型 - 从现有类型中排除特定属性',
      'Record<': '// 记录类型 - 定义键值对的对象类型',
      'ReturnType<': '// 返回类型 - 获取函数的返回类型',
      'Parameters<': '// 参数类型 - 获取函数的参数类型',
      'InstanceType<': '// 实例类型 - 获取类的实例类型',
      'ThisType<': '// 上下文类型 - 指定函数中的 this 类型',
      'Uppercase<': '// 大写类型 - 将字符串类型转换为大写',
      'Lowercase<': '// 小写类型 - 将字符串类型转换为小写',
      'Capitalize<': '// 首字母大写类型 - 将字符串类型的首字母转换为大写',
      'Uncapitalize<': '// 首字母小写类型 - 将字符串类型的首字母转换为小写',
    };

    this.statePatterns = {
      // 状态管理
      'useState(': '// 状态管理 - 创建和管理组件内部状态',
      'useReducer(': '// 复杂状态管理 - 使用 reducer 模式管理复杂状态',
      'create(': '// 创建状态存储 - 使用 Zustand 创建状态管理器',
      'setState(': '// 设置状态 - 更新状态值',
      'dispatch(': '// 分发状态更新 - 发送 action 到 reducer',
      'getState(': '// 获取状态 - 读取当前状态值',
      'subscribe(': '// 订阅状态变化 - 监听状态更新事件',
    };

    this.hookPatterns = {
      // React Hooks
      'useEffect(': '// 副作用处理 - 处理组件生命周期中的副作用操作',
      'useCallback(': '// 回调函数优化 - 缓存函数引用，避免不必要的重新渲染',
      'useMemo(': '// 值记忆化 - 缓存计算结果，优化性能',
      'useRef(': '// 引用管理 - 保存可变值或直接访问 DOM 元素',
      'useContext(': '// 上下文消费 - 消费 React 上下文中的值',
      'useLayoutEffect(': '// 布局副作用 - 在 DOM 更新后同步执行副作用',
      'useImperativeHandle(': '// 命令式句柄 - 向父组件暴露命令式方法',
      'useDebugValue(': '// 调试值 - 在 React DevTools 中显示自定义标签',
      'useId(': '// 唯一标识 - 生成唯一的标识符',
      'useTransition(': '// 过渡状态 - 标记非紧急更新',
      'useDeferredValue(': '// 延迟值 - 延迟更新值',
      'useSyncExternalStore(': '// 同步外部存储 - 订阅外部数据源',
      'useInsertionEffect(': '// 插入副作用 - 在 DOM 插入前执行副作用',
    };

    this.constantPatterns = {
      // 常量定义
      'export const ': '// 导出常量 - 可在其他模块中使用的固定值',
      'const ': '// 常量定义 - 模块内部使用的固定值',
      'export enum ': '// 导出枚举 - 一组相关的常量值',
      'enum ': '// 枚举定义 - 模块内部的常量集合',
      'export const ': '// 导出常量对象 - 包含多个相关常量的对象',
      'Object.freeze(': '// 冻结对象 - 创建不可变的对象',
      'as const': '// 常量断言 - 将对象的所有属性标记为只读',
    };
  }

  // 分析导入语句
  analyzeImport(line) {
    for (const [category, patterns] of Object.entries(this.importPatterns)) {
      if (typeof patterns === 'string') {
        if (line.includes(category)) {
          return patterns;
        }
      } else {
        for (const [pattern, comment] of Object.entries(patterns)) {
          if (line.includes(pattern)) {
            return comment;
          }
        }
      }
    }
    
    // 如果没有找到匹配的模式，生成通用备注
    if (line.includes('from')) {
      const moduleName = line.match(/from ['"]([^'"]+)['"]/)?.[1];
      if (moduleName) {
        if (moduleName.startsWith('.')) {
          return '// 导入本地模块 - 从当前项目中的其他文件导入';
        } else if (moduleName.startsWith('@/')) {
          return '// 导入项目模块 - 从项目的根目录导入，使用路径别名';
        } else {
          return `// 导入 ${moduleName} 模块 - 从第三方库或外部包导入`;
        }
      }
    }
    
    return '// 导入模块 - 从外部或内部模块导入功能';
  }

  // 分析函数定义
  analyzeFunction(line) {
    for (const [pattern, comment] of Object.entries(this.functionPatterns)) {
      if (line.includes(pattern)) {
        return comment;
      }
    }
    return null;
  }

  // 分析类型定义
  analyzeType(line) {
    for (const [pattern, comment] of Object.entries(this.typePatterns)) {
      if (line.includes(pattern)) {
        return comment;
      }
    }
    return null;
  }

  // 分析状态管理
  analyzeState(line) {
    for (const [pattern, comment] of Object.entries(this.statePatterns)) {
      if (line.includes(pattern)) {
        return comment;
      }
    }
    return null;
  }

  // 分析 Hook 使用
  analyzeHook(line) {
    for (const [pattern, comment] of Object.entries(this.hookPatterns)) {
      if (line.includes(pattern)) {
        return comment;
      }
    }
    return null;
  }

  // 分析常量定义
  analyzeConstant(line) {
    for (const [pattern, comment] of Object.entries(this.constantPatterns)) {
      if (line.includes(pattern)) {
        return comment;
      }
    }
    return null;
  }

  // 提取函数名
  extractFunctionName(line) {
    const patterns = [
      /export default function\s+(\w+)/,
      /export function\s+(\w+)/,
      /function\s+(\w+)/,
      /const\s+(\w+)\s*=/,
      /export const\s+(\w+)/,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }

  // 生成函数备注
  generateFunctionComment(functionName, line) {
    if (!functionName) return null;

    // 根据函数名生成特定备注
    const namePatterns = {
      'Component': '// 组件定义 - 这是一个 React 组件',
      'Page': '// 页面组件 - 这是一个 Next.js 页面组件',
      'use': '// 自定义 Hook - 这是一个自定义的 React Hook',
      'Store': '// 状态存储 - 这是一个状态管理存储',
      'store': '// 状态存储 - 这是一个状态管理存储',
      'Handler': '// 事件处理器 - 这是一个事件处理函数',
      'handler': '// 事件处理器 - 这是一个事件处理函数',
      'Utils': '// 工具函数 - 这是一个工具函数',
      'utils': '// 工具函数 - 这是一个工具函数',
      'Config': '// 配置函数 - 这是一个配置相关的函数',
      'config': '// 配置函数 - 这是一个配置相关的函数',
      'Service': '// 服务函数 - 这是一个服务层的函数',
      'service': '// 服务函数 - 这是一个服务层的函数',
      'API': '// API 函数 - 这是一个 API 相关的函数',
      'api': '// API 函数 - 这是一个 API 相关的函数',
      'Provider': '// 提供者组件 - 这是一个 Context Provider 组件',
      'provider': '// 提供者组件 - 这是一个 Context Provider 组件',
      'Context': '// 上下文组件 - 这是一个 React Context 组件',
      'context': '// 上下文组件 - 这是一个 React Context 组件',
      'Hook': '// 自定义 Hook - 这是一个自定义的 React Hook',
      'hook': '// 自定义 Hook - 这是一个自定义的 React Hook',
    };

    for (const [pattern, comment] of Object.entries(namePatterns)) {
      if (functionName.includes(pattern)) {
        return comment;
      }
    }

    // 根据函数类型生成通用备注
    if (line.includes('export default function')) {
      return `// ${functionName} 组件 - 这是页面的主要组件或模块的入口点`;
    } else if (line.includes('export function')) {
      return `// ${functionName} 组件 - 可复用的 UI 组件，可以在其他文件中导入使用`;
    } else if (line.includes('function ')) {
      return `// ${functionName} 函数 - 定义了一个函数，提供特定的功能`;
    } else if (line.includes('const ') && (line.includes('= (') || line.includes('= function'))) {
      return `// ${functionName} 函数 - 使用箭头函数定义的函数`;
    }

    return `// ${functionName} - 函数定义`;
  }
}

// 详细的备注生成器
class DetailedCommentGenerator {
  constructor() {
    this.analyzer = new CodeAnalyzer();
  }

  // 生成文件头部备注
  generateFileHeader(filePath) {
    const fileName = path.basename(filePath);
    const fileExt = path.extname(filePath);
    const dirPath = path.dirname(filePath);
    const relativePath = path.relative('apps/web/src', filePath);
    
    // 根据文件路径和名称生成特定的文件描述
    let fileDescription = this.getFileDescription(fileName, relativePath, fileExt);
    
    return `// ${fileName} - ${fileDescription}
// 此文件包含 ${fileDescription.toLowerCase()} 的相关代码
// 文件路径: ${relativePath}
// 最后更新: ${new Date().toLocaleDateString('zh-CN')}

`;
  }

  // 根据文件信息生成文件描述
  getFileDescription(fileName, relativePath, fileExt) {
    const pathParts = relativePath.split(path.sep);
    
    // 根据目录结构判断文件类型
    if (pathParts[0] === 'app') {
      if (fileName === 'layout.tsx') {
        return 'Next.js 根布局组件';
      } else if (fileName === 'page.tsx') {
        return 'Next.js 页面组件';
      } else if (fileName === 'metadata.ts') {
        return 'Next.js 元数据配置';
      } else if (pathParts.includes('api')) {
        return 'Next.js API 路由';
      } else {
        return 'Next.js 应用页面';
      }
    } else if (pathParts[0] === 'components') {
      if (pathParts.includes('ui')) {
        return '基础 UI 组件';
      } else if (pathParts.includes('editor')) {
        return '视频编辑器组件';
      } else if (pathParts.includes('landing')) {
        return '落地页组件';
      } else {
        return 'React 组件';
      }
    } else if (pathParts[0] === 'stores') {
      return 'Zustand 状态管理存储';
    } else if (pathParts[0] === 'hooks') {
      return '自定义 React Hook';
    } else if (pathParts[0] === 'lib') {
      return '工具库和辅助函数';
    } else if (pathParts[0] === 'types') {
      return 'TypeScript 类型定义';
    } else if (pathParts[0] === 'constants') {
      return '常量定义和配置';
    } else if (pathParts[0] === 'data') {
      return '静态数据和配置';
    } else if (fileName === 'middleware.ts') {
      return 'Next.js 中间件';
    } else if (fileName === 'env.ts') {
      return '环境变量配置';
    } else if (fileExt === '.tsx') {
      return 'React 组件文件';
    } else if (fileExt === '.ts') {
      return 'TypeScript 文件';
    } else {
      return '代码文件';
    }
  }

  // 为导入语句添加详细备注
  addImportComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是导入语句
      if (line.startsWith('import ')) {
        const comment = this.analyzer.analyzeImport(line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为函数和组件添加详细备注
  addFunctionComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是函数定义
      if (line.includes('function ') || 
          (line.includes('const ') && (line.includes('= (') || line.includes('= function'))) ||
          line.includes('export default function') ||
          line.includes('export function')) {
        
        const functionName = this.analyzer.extractFunctionName(line);
        const comment = this.analyzer.generateFunctionComment(functionName, line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为类型定义添加详细备注
  addTypeComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是类型定义
      if (line.startsWith('interface ') || 
          line.startsWith('type ') || 
          line.startsWith('enum ') ||
          line.startsWith('export interface') ||
          line.startsWith('export type') ||
          line.startsWith('export enum')) {
        
        const comment = this.analyzer.analyzeType(line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为状态管理添加详细备注
  addStateComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是状态管理相关
      if (line.includes('useState(') ||
          line.includes('useReducer(') ||
          line.includes('create(') ||
          line.includes('setState(') ||
          line.includes('dispatch(')) {
        
        const comment = this.analyzer.analyzeState(line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为 Hook 使用添加详细备注
  addHookComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是 Hook 使用
      if (line.includes('useEffect(') ||
          line.includes('useCallback(') ||
          line.includes('useMemo(') ||
          line.includes('useRef(') ||
          line.includes('useContext(')) {
        
        const comment = this.analyzer.analyzeHook(line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为常量定义添加详细备注
  addConstantComments(content) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查是否是常量定义
      if (line.startsWith('export const ') ||
          line.startsWith('const ') ||
          line.startsWith('export enum ') ||
          line.startsWith('enum ')) {
        
        const comment = this.analyzer.analyzeConstant(line);
        
        // 添加备注
        if (comment && !lines[i - 1]?.trim().startsWith('//')) {
          newLines.push(comment);
        }
      }
      
      newLines.push(lines[i]);
    }
    
    return newLines.join('\n');
  }

  // 为特殊文件添加配置备注
  addConfigComments(content, filePath) {
    const fileName = path.basename(filePath);
    
    // 为配置文件添加特殊备注
    if (fileName.includes('config') || fileName.includes('Config')) {
      const configComments = {
        'next.config': {
          'compiler:': '// 编译器配置 - 控制代码转换、优化和输出选项',
          'reactStrictMode:': '// React 严格模式 - 启用额外的开发时检查和警告',
          'productionBrowserSourceMaps:': '// 生产环境源码映射 - 在浏览器中显示原始源码，便于调试',
          'output:': '// 输出模式 - 控制构建输出格式（standalone、export 等）',
          'images:': '// 图片优化配置 - 控制 Next.js 图片组件的优化行为',
          'remotePatterns:': '// 远程图片域名 - 允许从外部域名加载和优化图片',
          'protocol:': '// 协议类型 - 支持的图片协议（http、https）',
          'hostname:': '// 主机名 - 允许的图片域名',
          'port:': '// 端口号 - 允许的端口号（可选）',
          'pathname:': '// 路径名 - 允许的路径模式（可选）',
        },
        'tailwind.config': {
          'content:': '// 内容路径 - 指定需要扫描的文件，用于生成 CSS',
          'theme:': '// 主题配置 - 自定义 Tailwind CSS 的设计系统',
          'extend:': '// 扩展配置 - 在默认主题基础上扩展自定义值',
          'colors:': '// 颜色配置 - 自定义颜色调色板，覆盖默认颜色',
          'fontFamily:': '// 字体配置 - 自定义字体族，定义可用的字体',
          'spacing:': '// 间距配置 - 自定义间距比例，影响 margin、padding 等',
          'screens:': '// 断点配置 - 自定义响应式断点，定义媒体查询',
          'plugins:': '// 插件配置 - 第三方 Tailwind 插件列表',
          'darkMode:': '// 深色模式 - 配置深色模式的触发方式',
          'prefix:': '// 前缀配置 - 为所有 Tailwind 类添加前缀',
        },
        'drizzle.config': {
          'schema:': '// 数据库模式 - 指定包含表定义的文件路径',
          'out:': '// 输出目录 - 指定迁移文件的输出位置',
          'driver:': '// 数据库驱动 - 指定数据库类型（pg、mysql、sqlite 等）',
          'dbCredentials:': '// 数据库凭据 - 数据库连接信息（URL 或对象）',
          'migrations:': '// 迁移配置 - 迁移文件的存储和命名配置',
          'verbose:': '// 详细模式 - 启用详细的日志输出',
          'strict:': '// 严格模式 - 启用严格的类型检查',
        },
        'tsconfig.json': {
          'compilerOptions:': '// 编译器选项 - TypeScript 编译器的配置选项',
          'target:': '// 目标版本 - 指定输出的 JavaScript 版本（ES2017、ES2020 等）',
          'lib:': '// 库文件 - 包含的类型定义库（DOM、ESNext 等）',
          'module:': '// 模块系统 - 指定模块解析方式（esnext、commonjs 等）',
          'moduleResolution:': '// 模块解析 - 指定模块查找策略（bundler、node 等）',
          'paths:': '// 路径映射 - 模块路径别名配置',
          'strict:': '// 严格模式 - 启用所有严格的类型检查选项',
          'jsx:': '// JSX 配置 - 指定 JSX 的编译方式（preserve、react-jsx 等）',
          'esModuleInterop:': '// ES 模块互操作 - 启用 CommonJS 和 ES 模块的互操作',
          'skipLibCheck:': '// 跳过库检查 - 跳过声明文件的类型检查',
          'forceConsistentCasingInFileNames:': '// 强制文件名大小写一致性 - 确保文件名大小写一致',
        }
      };

      for (const [configType, patterns] of Object.entries(configComments)) {
        if (fileName.includes(configType)) {
          for (const [pattern, comment] of Object.entries(patterns)) {
            const regex = new RegExp(`^\\s*${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm');
            content = content.replace(regex, (match) => {
              const indent = match.match(/^\s*/)[0];
              return `${indent}${comment}\n${match}`;
            });
          }
          break;
        }
      }
    }

    return content;
  }

  // 处理单个文件
  processFile(filePath) {
    try {
      console.log(`详细处理文件: ${filePath}`);
      
      // 读取文件内容
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 如果文件已经有详细备注，跳过
      if (content.includes('// 文件路径:') && content.includes('// 最后更新:')) {
        console.log(`文件 ${filePath} 已有详细备注，跳过`);
        return;
      }
      
      // 添加文件头部备注
      content = this.generateFileHeader(filePath) + content;
      
      // 添加导入语句备注
      content = this.addImportComments(content);
      
      // 添加函数和组件备注
      content = this.addFunctionComments(content);
      
      // 添加类型定义备注
      content = this.addTypeComments(content);
      
      // 添加状态管理备注
      content = this.addStateComments(content);
      
      // 添加 Hook 使用备注
      content = this.addHookComments(content);
      
      // 添加常量定义备注
      content = this.addConstantComments(content);
      
      // 添加配置备注
      content = this.addConfigComments(content, filePath);
      
      // 写回文件
      fs.writeFileSync(filePath, content, 'utf8');
      
      console.log(`✓ 详细完成: ${filePath}`);
    } catch (error) {
      console.error(`✗ 错误处理文件 ${filePath}:`, error.message);
    }
  }

  // 递归处理目录
  processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过 node_modules 和 .git 目录
        if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
          this.processDirectory(fullPath, extensions);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          this.processFile(fullPath);
        }
      }
    }
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'apps/web/src';
  
  console.log('🚀 开始详细代码备注处理...');
  console.log(`目标路径: ${targetPath}`);
  console.log('=' .repeat(60));
  
  const generator = new DetailedCommentGenerator();
  
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    
    if (stat.isFile()) {
      generator.processFile(targetPath);
    } else if (stat.isDirectory()) {
      generator.processDirectory(targetPath);
    }
  } else {
    console.error(`错误: 路径 ${targetPath} 不存在`);
    process.exit(1);
  }
  
  console.log('=' .repeat(60));
  console.log('✅ 详细代码备注处理完成！');
  console.log('📝 备注内容包括:');
  console.log('   • 详细的文件头部说明（包含路径和更新时间）');
  console.log('   • 精确的导入语句解释（根据模块类型）');
  console.log('   • 智能的函数和组件说明（根据命名模式）');
  console.log('   • 完整的类型定义注释（接口、类型、枚举）');
  console.log('   • 详细的状态管理注释（Zustand、React 状态）');
  console.log('   • 专业的 Hook 使用说明（所有 React Hooks）');
  console.log('   • 完整的常量配置说明（导出常量、枚举等）');
  console.log('   • 配置文件特殊备注（Next.js、Tailwind、Drizzle 等）');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = { DetailedCommentGenerator, CodeAnalyzer }; 