// page.tsx - 剪辑计划页面
// 此文件包含剪辑计划管理页面的相关代码
// 文件路径: app/editing-plan/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { EditingPlanManager } from "@/components/editing-plan/editing-plan-manager";
import { EditingPlanCreator } from "@/components/editing-plan/editing-plan-creator";
import { EditingPlanViewer } from "@/components/editing-plan/editing-plan-viewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  Target,
  Sparkles,
  Bot,
  Film,
  Scissors
} from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useEditingPlanStore } from "@/stores/editing-plan-store";
import { cn } from "@/lib/utils";

// 剪辑计划页面组件
export default function EditingPlanPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const { activeProject } = useProjectStore();
  const { 
    editingPlans, 
    currentPlan, 
    isLoading,
    loadEditingPlans,
    createNewPlan,
    selectPlan 
  } = useEditingPlanStore();

  // 页面加载时获取剪辑计划
  useEffect(() => {
    if (activeProject) {
      loadEditingPlans(activeProject.id);
    }
  }, [activeProject, loadEditingPlans]);

  // 处理创建新计划
  const handleCreatePlan = () => {
    if (!activeProject) return;
    createNewPlan(activeProject.id);
    setActiveTab("creator");
  };

  // 处理选择计划
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    selectPlan(planId);
    setActiveTab("viewer");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="relative">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 py-8">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Film className="w-8 h-8 text-blue-500" />
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                剪辑计划
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              智能化剪辑计划管理，让创作更有条理
            </p>
          </div>

          {/* 主要内容区域 */}
          <div className="max-w-7xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  概览
                </TabsTrigger>
                <TabsTrigger value="manager" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  管理
                </TabsTrigger>
                <TabsTrigger value="creator" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  创建
                </TabsTrigger>
                <TabsTrigger value="viewer" className="flex items-center gap-2">
                  <Scissors className="w-4 h-4" />
                  查看
                </TabsTrigger>
              </TabsList>

              {/* 概览标签页 */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* 统计卡片 */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总计划数</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{editingPlans.length}</div>
                      <p className="text-xs text-muted-foreground">
                        +2 较上周
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">进行中</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {editingPlans.filter(p => p.status === 'in_progress').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        活跃计划
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">已完成</CardTitle>
                      <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {editingPlans.filter(p => p.status === 'completed').length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        成功交付
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">AI辅助</CardTitle>
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {editingPlans.filter(p => p.isAIGenerated).length}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        智能生成
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* 快速操作 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      快速开始
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={handleCreatePlan}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      <Plus className="w-6 h-6" />
                      创建新计划
                    </Button>
                    
                    <Button 
                      onClick={() => setActiveTab("manager")}
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                    >
                      <FileText className="w-6 h-6" />
                      管理计划
                    </Button>
                    
                    <Button 
                      className="h-20 flex flex-col gap-2"
                      variant="outline"
                      disabled
                    >
                      <Bot className="w-6 h-6" />
                      AI智能分析
                      <Badge variant="secondary" className="text-xs">即将推出</Badge>
                    </Button>
                  </CardContent>
                </Card>

                {/* 最近的计划 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      最近的计划
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editingPlans.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>还没有剪辑计划</p>
                        <p className="text-sm">点击上方按钮创建第一个计划</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {editingPlans.slice(0, 3).map((plan) => (
                          <div 
                            key={plan.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-3 h-3 rounded-full",
                                plan.status === 'completed' ? 'bg-green-500' :
                                plan.status === 'in_progress' ? 'bg-blue-500' :
                                'bg-gray-500'
                              )} />
                              <div>
                                <p className="font-medium">{plan.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(plan.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {plan.isAIGenerated && (
                                <Badge variant="secondary" className="text-xs">
                                  <Bot className="w-3 h-3 mr-1" />
                                  AI
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {plan.status === 'completed' ? '已完成' :
                                 plan.status === 'in_progress' ? '进行中' :
                                 '草稿'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 管理标签页 */}
              <TabsContent value="manager">
                <EditingPlanManager 
                  onSelectPlan={handleSelectPlan}
                  onCreatePlan={handleCreatePlan}
                />
              </TabsContent>

              {/* 创建标签页 */}
              <TabsContent value="creator">
                <EditingPlanCreator 
                  onPlanCreated={(planId) => {
                    setSelectedPlanId(planId);
                    setActiveTab("viewer");
                  }}
                />
              </TabsContent>

              {/* 查看标签页 */}
              <TabsContent value="viewer">
                {selectedPlanId && currentPlan ? (
                  <EditingPlanViewer 
                    plan={currentPlan}
                    onEdit={() => setActiveTab("creator")}
                  />
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">选择一个计划查看</h3>
                      <p className="text-muted-foreground mb-4">
                        从管理页面选择一个剪辑计划来查看详细信息
                      </p>
                      <Button onClick={() => setActiveTab("manager")}>
                        前往管理页面
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
