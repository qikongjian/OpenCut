# URL项目ID支持测试

## 测试目标
验证系统是否支持在URL中指定项目ID，并且在点击"生成AI剪辑计划"时使用该ID调用API。

## 测试步骤

### 1. 测试URL项目ID加载
- 访问: `http://localhost:3000/editor/dae204bc-1a62-481a-93ba-af378a05294b`
- 预期结果: 
  - 页面正常加载
  - 不会重定向到新的项目ID
  - 项目ID保持为 `dae204bc-1a62-481a-93ba-af378a05294b`

### 2. 测试AI剪辑计划API调用
- 在上述页面中点击"生成AI剪辑计划"按钮
- 预期结果:
  - 控制台显示: "使用URL中的项目ID: dae204bc-1a62-481a-93ba-af378a05294b"
  - API调用使用正确的项目ID
  - 不会因为项目不存在而创建新项目

### 3. 测试项目持久性
- 刷新页面
- 预期结果:
  - URL保持不变
  - 项目ID仍然是 `dae204bc-1a62-481a-93ba-af378a05294b`

## 实现的修改

### 1. 项目存储 (project-store.ts)
- 修改 `createNewProject` 方法支持自定义ID
- 当项目不存在时，使用URL中的ID创建项目而不是生成新ID

### 2. 编辑器页面 (editor/[project_id]/page.tsx)
- 修改项目加载逻辑
- 当项目不存在时，使用URL中的项目ID创建新项目
- 避免不必要的重定向

### 3. AI剪辑面板组件
- 添加 `useParams` 获取URL参数
- 实现 `getProjectId` 方法优先使用URL中的ID
- 确保API调用使用正确的项目ID

## 关键代码变更

```typescript
// 获取项目ID - 优先使用URL中的ID
const getProjectId = () => {
  if (urlProjectId) {
    console.log('使用URL中的项目ID:', urlProjectId);
    return urlProjectId;
  }
  if (activeProject?.id) {
    console.log('使用activeProject的ID:', activeProject.id);
    return activeProject.id;
  }
  console.warn('没有找到有效的项目ID');
  return null;
};
```

## 验证方法

1. 打开浏览器开发者工具
2. 访问测试URL
3. 点击"生成AI剪辑计划"按钮
4. 检查控制台日志确认使用了正确的项目ID
5. 检查网络请求确认API调用参数正确

## 预期的控制台输出

```
🚀 开始生成AI剪辑计划，项目ID: dae204bc-1a62-481a-93ba-af378a05294b
使用URL中的项目ID: dae204bc-1a62-481a-93ba-af378a05294b
🚀 开始调用AI剪辑计划API: {url: "...", projectId: "dae204bc-1a62-481a-93ba-af378a05294b"}
```
