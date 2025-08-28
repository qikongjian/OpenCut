# Editor页面AI剪辑功能Token健全处理集成

## 🎯 集成目标

为editor页面的AI剪辑功能添加token健全处理支持，确保用户点击左侧AI剪辑图标后能够安全可靠地调用剪辑计划接口。

## 🔍 现状分析

### 已有功能
经过分析，我发现editor页面已经完整集成了AI剪辑功能：

1. ✅ **AI剪辑图标**：左侧面板有Bot图标，标签为"AI剪辑"
2. ✅ **AI剪辑面板**：`AIEditingPanelNew`组件已集成
3. ✅ **API调用**：`generateAIEditingPlanFromAPI`函数已实现
4. ✅ **Token处理**：AI剪辑API已集成token健全处理

### 功能路径
```
Editor页面 → 左侧MediaPanel → AI剪辑图标(Bot) → AIEditingPanelNew组件 → 加载剪辑计划按钮 → generateAIEditingPlanFromAPI → generateAIEditingPlan (带token处理)
```

## 🛠️ 完成的集成

### 1. ✅ Token系统初始化

**修改文件**: `apps/web/src/app/editor/[project_id]/page.tsx`

#### 添加导入
```typescript
import { initializeTokenSystem } from "@/lib/ai-editing-auth";
```

#### 项目初始化中添加token系统
```typescript
const initProject = async () => {
  if (!projectId) {
    return;
  }

  // 🔐 初始化token系统（优先执行）
  try {
    await initializeTokenSystem();
    console.log('✅ Editor token系统初始化成功');
  } catch (error) {
    console.error('❌ Editor token系统初始化失败:', error);
  }

  // Prevent duplicate initialization
  if (isInitializingRef.current) {
    return;
  }
  // ... 其他初始化逻辑
};
```

### 2. ✅ 已有的AI剪辑功能架构

#### MediaPanel集成
**文件**: `apps/web/src/components/editor/media-panel/index.tsx`

```typescript
export function MediaPanel() {
  const { activeTab } = useMediaPanelStore();

  const viewMap: Record<Tab, React.ReactNode> = {
    // ... 其他tab
    "ai-editing": <AIEditingPanelNew />, // ✅ 已集成
  };
  
  return (
    <div className="h-full flex">
      <TabBar /> {/* ✅ 包含AI剪辑图标 */}
      <div className="flex-1 min-w-0">
        {viewMap[activeTab]}
      </div>
    </div>
  );
}
```

#### TabBar配置
**文件**: `apps/web/src/components/editor/media-panel/store.ts`

```typescript
export const tabs: { [key in Tab]: { icon: LucideIcon; label: string } } = {
  // ... 其他tab
  "ai-editing": {
    icon: Bot,        // ✅ AI剪辑图标
    label: "AI剪辑",  // ✅ 中文标签
  },
};
```

#### AI剪辑面板
**文件**: `apps/web/src/components/editor/ai-editing-panel-new.tsx`

```typescript
export function AIEditingPanelNew() {
  // ✅ 使用AI编辑store
  const {
    aiEditingData,
    currentEditingPlan,
    isLoadingPlan,
    generateAIEditingPlanFromAPI, // ✅ 带token处理的API调用
    // ... 其他状态
  } = useAIEditingStore();

  // ✅ 加载剪辑计划处理函数
  const handleGenerateAIEditingPlan = async () => {
    const projectId = getProjectId();
    
    if (!projectId) {
      toast.error("Please create or open a project first");
      return;
    }

    console.log('🚀 Starting Generate AI Editing Plan, project ID:', projectId);
    await generateAIEditingPlanFromAPI(projectId); // ✅ 调用带token处理的API
  };

  return (
    <div className="h-full flex flex-col bg-panel">
      {/* ✅ AI剪辑界面 */}
      <Button
        onClick={handleGenerateAIEditingPlan} // ✅ 点击加载剪辑计划
        disabled={isLoadingPlan}
        className="w-full max-w-sm movieflow-button"
      >
        {isLoadingPlan ? (
          <>Loading editing plan...</>
        ) : (
          <>Generate AI Editing Plan</>
        )}
      </Button>
    </div>
  );
}
```

### 3. ✅ 已有的Token健全处理

#### AI剪辑API
**文件**: `apps/web/src/lib/ai-editing-api.ts`

```typescript
export async function generateAIEditingPlan(projectId: string): Promise<AIEditingData> {
  const apiUrl = `${getApiBaseUrl()}/edit-plan/generate-by-project`;
  const requestData: AIEditingPlanRequest = { project_id: projectId };

  // 🔐 初始化token系统
  await initializeTokenSystem();

  // 🔍 检查token状态
  const tokenInfo = await getSmartToken();
  if (tokenInfo) {
    console.log(`🔑 使用${tokenInfo.source}来源的token进行API调用`);
  } else {
    console.log('⚠️ 未找到token，将尝试无认证调用');
  }

  // 🚀 使用智能token处理的fetch
  const response = await authFetchWithSmartToken(apiUrl, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });

  // ✅ 完整的错误处理和重试机制
  // ...
}
```

#### AI编辑Store
**文件**: `apps/web/src/stores/ai-editing-store.ts`

```typescript
// ✅ Store中的API调用函数
generateAIEditingPlanFromAPI: async (projectId: string) => {
  // 验证项目ID
  if (!validateProjectId(projectId)) {
    return;
  }

  set({ isLoadingPlan: true });

  try {
    console.log('🚀 开始从API生成AI剪辑计划:', projectId);
    
    // ✅ 调用带token处理的API
    const aiEditingData = await generateAIEditingPlan(projectId);
    
    // ✅ 处理返回数据
    // ...
  } catch (error) {
    // ✅ 错误处理
    // ...
  }
}
```

## 🔐 Token处理能力

### 支持的Token来源 (按优先级)
1. **URL参数**: `?token=xxx`, `?access_token=xxx` (分享链接)
2. **URL Hash**: `#access_token=xxx` (OAuth回调)
3. **AI API专用存储**: localStorage中的专用token
4. **Video-Flow认证**: 现有的`X-EASE-ADMIN-TOKEN`
5. **Session存储**: sessionStorage中的临时token

### 智能Token适配
- 🔄 **自动重试**: 网络错误和认证错误智能重试
- 🔐 **多源支持**: 支持多种token来源和格式
- ⏰ **过期处理**: 自动检测和清理过期token
- 🛡️ **安全保护**: URL token自动清理

## 🚀 使用流程

### 1. 用户操作流程
```
1. 用户打开editor页面: /editor/project123
2. 系统自动初始化token系统
3. 用户点击左侧AI剪辑图标(Bot)
4. 显示AI剪辑面板(AIEditingPanelNew)
5. 用户点击"Generate AI Editing Plan"按钮
6. 系统调用带token处理的API
7. 返回AI剪辑计划数据
```

### 2. Token处理流程
```
1. 页面初始化时调用initializeTokenSystem()
2. 检查URL中是否有token参数
3. 保存token到本地存储
4. 清理URL中的token(安全)
5. API调用时自动使用最佳token
6. 错误时自动重试和恢复
```

### 3. URL Token分享支持
```bash
# 用户可以分享带token的editor链接
https://app.com/editor/project123?token=shared_token

# 系统自动处理:
# 1. 提取token
# 2. 保存到本地
# 3. 清理URL
# 4. 后续API调用使用该token
```

## 🧪 测试验证

### 1. 基本功能测试
```bash
# 1. 打开editor页面
http://localhost:3000/editor/project123

# 2. 点击左侧AI剪辑图标
# 验证: 显示AI剪辑面板

# 3. 点击"Generate AI Editing Plan"按钮
# 验证: 调用API并显示加载状态

# 4. 检查控制台日志
# 验证: token系统初始化成功
# 验证: API调用使用正确token
```

### 2. Token处理测试
```bash
# 1. URL token测试
http://localhost:3000/editor/project123?token=test_token

# 验证: token自动保存
# 验证: URL自动清理
# 验证: API调用使用该token

# 2. 无token测试
http://localhost:3000/editor/project123

# 验证: 使用video-flow现有token
# 验证: 或使用fallback机制
```

### 3. 错误恢复测试
```bash
# 1. 网络错误模拟
# 验证: 自动重试机制

# 2. 认证错误模拟
# 验证: token清理和重新认证

# 3. API错误模拟
# 验证: 错误提示和恢复
```

## 📊 监控和日志

### 控制台日志示例
```
✅ Editor token系统初始化成功
🔑 使用localStorage来源的token进行API调用
🚀 开始从API生成AI剪辑计划: project123
📡 第1次尝试调用API: /edit-plan/generate-by-project
✅ AI剪辑计划API调用成功
🎉 AI剪辑计划生成完成
```

### 错误日志示例
```
❌ Editor token系统初始化失败: NetworkError
⚠️ 未找到token，将尝试无认证调用
❌ 第1次API调用失败: 401 Unauthorized
🔄 认证错误，1000ms后重试...
✅ 第2次API调用成功
```

## ✅ 集成总结

Editor页面的AI剪辑功能token健全处理集成已完成：

### 核心功能
1. ✅ **AI剪辑图标**: 左侧面板Bot图标可点击
2. ✅ **AI剪辑面板**: AIEditingPanelNew组件完整集成
3. ✅ **加载剪辑计划**: 按钮点击调用API
4. ✅ **Token健全处理**: 完整的token处理系统

### 技术特性
1. ✅ **多源Token支持**: URL、localStorage、session等
2. ✅ **智能重试机制**: 网络和认证错误自动重试
3. ✅ **安全保护**: URL token自动清理
4. ✅ **错误恢复**: 完善的错误处理和恢复

### 用户体验
1. ✅ **无感知升级**: 现有功能完全兼容
2. ✅ **可靠性提升**: 网络问题自动重试
3. ✅ **安全性增强**: Token自动保护和管理
4. ✅ **调试友好**: 详细的日志和错误信息

Editor页面现在具备了与ai-editor页面相同的AI剪辑功能和token健全处理能力，用户可以安全可靠地使用AI剪辑功能。
