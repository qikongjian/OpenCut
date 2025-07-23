#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 代码备注模板映射
const commentTemplates = {
  // 导入语句备注
  imports: {
    'react': '// 导入 React 核心库',
    'next': '// 导入 Next.js 相关模块',
    'zustand': '// 导入 Zustand 状态管理库',
    'tailwind': '// 导入 Tailwind CSS 相关模块',
    'lucide': '// 导入 Lucide 图标库',
    'framer': '// 导入 Framer Motion 动画库',
    'radix': '// 导入 Radix UI 组件库',
    'sonner': '// 导入 Sonner 通知组件',
    'clsx': '// 导入 clsx 类名合并工具',
    'zod': '// 导入 Zod 类型验证库',
    'drizzle': '// 导入 Drizzle ORM',
    'ffmpeg': '// 导入 FFmpeg 视频处理库',
    'wavesurfer': '// 导入 WaveSurfer 音频波形库',
    'better-auth': '// 导入 Better Auth 认证库',
    'upstash': '// 导入 Upstash Redis 客户端',
    'embla': '// 导入 Embla 轮播组件',
    'recharts': '// 导入 Recharts 图表库',
    'react-hook-form': '// 导入 React Hook Form 表单库',
    'react-markdown': '// 导入 React Markdown 渲染器',
    'unified': '// 导入 Unified 文本处理库',
    'dayjs': '// 导入 Day.js 日期处理库',
    'cmdk': '// 导入 CMDK 命令面板组件',
    'vaul': '// 导入 Vaul 抽屉组件',
    'motion': '// 导入 Motion 动画库',
    'input-otp': '// 导入 Input OTP 一次性密码组件',
    'react-phone-number-input': '// 导入手机号码输入组件',
    'react-resizable-panels': '// 导入可调整大小面板组件',
    'react-day-picker': '// 导入日期选择器组件',
    'react-icons': '// 导入 React Icons 图标库',
    'class-variance-authority': '// 导入 CVA 类名变体工具',
    'tailwind-merge': '// 导入 Tailwind Merge 类名合并工具',
    'tailwindcss-animate': '// 导入 Tailwind CSS 动画插件',
    'useState': '// 导入 useState 状态钩子',
    'useEffect': '// 导入 useEffect 副作用钩子',
    'useCallback': '// 导入 useCallback 回调钩子',
    'useRef': '// 导入 useRef 引用钩子',
    'useMemo': '// 导入 useMemo 记忆钩子',
    'useContext': '// 导入 useContext 上下文钩子',
    'useReducer': '// 导入 useReducer 状态管理钩子',
    'useLayoutEffect': '// 导入 useLayoutEffect 布局副作用钩子',
    'useImperativeHandle': '// 导入 useImperativeHandle 命令式句柄钩子',
    'useDebugValue': '// 导入 useDebugValue 调试值钩子',
    'useId': '// 导入 useId 唯一标识钩子',
    'useTransition': '// 导入 useTransition 过渡钩子',
    'useDeferredValue': '// 导入 useDeferredValue 延迟值钩子',
    'useSyncExternalStore': '// 导入 useSyncExternalStore 同步外部存储钩子',
    'useInsertionEffect': '// 导入 useInsertionEffect 插入副作用钩子',
  },

  // 组件备注模板
  components: {
    'export default function': '// 默认导出组件',
    'export function': '// 导出组件',
    'function Component': '// 组件函数',
    'const Component': '// 组件常量',
    'interface Props': '// 组件属性接口',
    'type Props': '// 组件属性类型',
  },

  // 状态管理备注模板
  state: {
    'useState(': '// 状态管理',
    'useReducer(': '// 复杂状态管理',
    'create(': '// 创建状态存储',
    'setState(': '// 设置状态',
    'dispatch(': '// 分发状态更新',
  },

  // 钩子备注模板
  hooks: {
    'useEffect(': '// 副作用处理',
    'useCallback(': '// 回调函数优化',
    'useMemo(': '// 值记忆化',
    'useRef(': '// 引用管理',
    'useContext(': '// 上下文消费',
  },

  // 类型定义备注模板
  types: {
    'interface ': '// 接口定义',
    'type ': '// 类型定义',
    'enum ': '// 枚举定义',
    'export type': '// 导出类型',
    'export interface': '// 导出接口',
  },

  // 工具函数备注模板
  utils: {
    'export function': '// 工具函数',
    'const ': '// 常量定义',
    'function ': '// 函数定义',
    'export const': '// 导出常量',
  },

  // 配置备注模板
  config: {
    'export default': '// 默认配置导出',
    'const config': '// 配置对象',
    'module.exports': '// 模块导出',
  }
};

// 文件类型映射
const fileTypeMap = {
  '.tsx': 'React 组件文件',
  '.ts': 'TypeScript 文件',
  '.js': 'JavaScript 文件',
  '.jsx': 'React 组件文件',
  '.json': '配置文件',
  '.config.js': '配置文件',
  '.config.ts': '配置文件',
};

// 获取文件类型描述
function getFileTypeDescription(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  if (fileName.includes('config')) {
    return '配置文件';
  }
  
  return fileTypeMap[ext] || '代码文件';
}

// 为导入语句添加备注
function addImportComments(content) {
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否是导入语句
    if (line.startsWith('import ')) {
      // 查找匹配的备注模板
      let comment = '';
      for (const [key, template] of Object.entries(commentTemplates.imports)) {
        if (line.includes(key)) {
          comment = template;
          break;
        }
      }
      
      // 如果没有找到特定模板，使用通用模板
      if (!comment) {
        if (line.includes('from')) {
          const moduleName = line.match(/from ['"]([^'"]+)['"]/)?.[1];
          if (moduleName) {
            if (moduleName.startsWith('.')) {
              comment = `// 导入本地模块`;
            } else if (moduleName.startsWith('@/')) {
              comment = `// 导入项目模块`;
            } else {
              comment = `// 导入 ${moduleName} 模块`;
            }
          }
        } else {
          comment = '// 导入模块';
        }
      }
      
      // 添加备注
      if (comment && !lines[i - 1]?.trim().startsWith('//')) {
        newLines.push(comment);
      }
    }
    
    newLines.push(lines[i]);
  }
  
  return newLines.join('\n');
}

// 为组件和函数添加备注
function addFunctionComments(content) {
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否是组件或函数定义
    if (line.includes('export default function') || 
        line.includes('export function') ||
        line.includes('function ') ||
        line.includes('const ') && (line.includes('= (') || line.includes('= function'))) {
      
      // 提取函数名
      let functionName = '';
      if (line.includes('export default function')) {
        functionName = line.match(/export default function\s+(\w+)/)?.[1] || '';
      } else if (line.includes('export function')) {
        functionName = line.match(/export function\s+(\w+)/)?.[1] || '';
      } else if (line.includes('function ')) {
        functionName = line.match(/function\s+(\w+)/)?.[1] || '';
      } else if (line.includes('const ')) {
        functionName = line.match(/const\s+(\w+)/)?.[1] || '';
      }
      
      // 生成备注
      let comment = '';
      if (functionName) {
        if (functionName.includes('Component') || functionName.includes('Page')) {
          comment = `// ${functionName} 组件`;
        } else if (functionName.includes('use')) {
          comment = `// ${functionName} 自定义钩子`;
        } else if (functionName.includes('Store') || functionName.includes('store')) {
          comment = `// ${functionName} 状态管理`;
        } else if (functionName.includes('Handler') || functionName.includes('handler')) {
          comment = `// ${functionName} 事件处理器`;
        } else if (functionName.includes('Utils') || functionName.includes('utils')) {
          comment = `// ${functionName} 工具函数`;
        } else {
          comment = `// ${functionName} 函数`;
        }
      } else {
        comment = '// 函数定义';
      }
      
      // 添加备注
      if (comment && !lines[i - 1]?.trim().startsWith('//')) {
        newLines.push(comment);
      }
    }
    
    newLines.push(lines[i]);
  }
  
  return newLines.join('\n');
}

// 为接口和类型添加备注
function addTypeComments(content) {
  const lines = content.split('\n');
  const newLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查是否是类型定义
    if (line.startsWith('interface ') || line.startsWith('type ') || line.startsWith('enum ')) {
      const typeName = line.match(/(?:interface|type|enum)\s+(\w+)/)?.[1] || '';
      
      let comment = '';
      if (typeName) {
        if (line.startsWith('interface ')) {
          comment = `// ${typeName} 接口定义`;
        } else if (line.startsWith('type ')) {
          comment = `// ${typeName} 类型定义`;
        } else if (line.startsWith('enum ')) {
          comment = `// ${typeName} 枚举定义`;
        }
      } else {
        comment = '// 类型定义';
      }
      
      // 添加备注
      if (comment && !lines[i - 1]?.trim().startsWith('//')) {
        newLines.push(comment);
      }
    }
    
    newLines.push(lines[i]);
  }
  
  return newLines.join('\n');
}

// 为文件添加头部备注
function addFileHeader(content, filePath) {
  const fileType = getFileTypeDescription(filePath);
  const fileName = path.basename(filePath);
  
  const header = `// ${fileName} - ${fileType}
// 此文件包含 ${fileType.toLowerCase()} 的相关代码

`;
  
  return header + content;
}

// 处理单个文件
function processFile(filePath) {
  try {
    console.log(`处理文件: ${filePath}`);
    
    // 读取文件内容
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 如果文件已经有头部备注，跳过
    if (content.startsWith('//') && content.includes('文件')) {
      console.log(`文件 ${filePath} 已有备注，跳过`);
      return;
    }
    
    // 添加文件头部备注
    content = addFileHeader(content, filePath);
    
    // 添加导入语句备注
    content = addImportComments(content);
    
    // 添加函数和组件备注
    content = addFunctionComments(content);
    
    // 添加类型定义备注
    content = addTypeComments(content);
    
    // 写回文件
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`✓ 完成: ${filePath}`);
  } catch (error) {
    console.error(`✗ 错误处理文件 ${filePath}:`, error.message);
  }
}

// 递归处理目录
function processDirectory(dirPath, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 跳过 node_modules 和 .git 目录
      if (item !== 'node_modules' && item !== '.git' && !item.startsWith('.')) {
        processDirectory(fullPath, extensions);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(item);
      if (extensions.includes(ext)) {
        processFile(fullPath);
      }
    }
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || 'apps/web/src';
  
  console.log('🚀 开始批量添加代码备注...');
  console.log(`目标路径: ${targetPath}`);
  console.log('=' .repeat(50));
  
  if (fs.existsSync(targetPath)) {
    const stat = fs.statSync(targetPath);
    
    if (stat.isFile()) {
      processFile(targetPath);
    } else if (stat.isDirectory()) {
      processDirectory(targetPath);
    }
  } else {
    console.error(`错误: 路径 ${targetPath} 不存在`);
    process.exit(1);
  }
  
  console.log('=' .repeat(50));
  console.log('✅ 批量添加代码备注完成！');
}

// 运行脚本
if (require.main === module) {
  main();
}

module.exports = {
  processFile,
  processDirectory,
  addImportComments,
  addFunctionComments,
  addTypeComments,
  addFileHeader
}; 