"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateAIEditingPlan, validateProjectId, AIEditingApiError } from "@/lib/ai-editing-api";
import { toast } from "sonner";

export default function TestAIApiPage() {
  const [projectId, setProjectId] = useState("dae204bc-1a62-481a-93ba-af378a05294b");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestApi = async () => {
    if (!projectId.trim()) {
      toast.error("请输入project ID");
      return;
    }

    if (!validateProjectId(projectId)) {
      toast.error("project ID格式无效，请输入有效的UUID格式");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log("🚀 开始测试API调用...");
      const data = await generateAIEditingPlan(projectId);
      
      setResult(data);
      toast.success("API调用成功！");
      console.log("✅ API调用成功:", data);
      
    } catch (err) {
      console.error("❌ API调用失败:", err);
      
      let errorMessage = "API调用失败";
      
      if (err instanceof AIEditingApiError) {
        errorMessage = `API错误: ${err.message}`;
        if (err.code) {
          errorMessage += ` (代码: ${err.code})`;
        }
      } else if (err instanceof Error) {
        errorMessage = `错误: ${err.message}`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI剪辑计划API测试</h1>
        <p className="text-muted-foreground">
          测试AI剪辑计划生成接口的连接和响应
        </p>
      </div>

      <div className="grid gap-6">
        {/* 测试输入 */}
        <Card>
          <CardHeader>
            <CardTitle>API测试</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="projectId">project ID</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="输入project ID (UUID格式)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                示例: dae204bc-1a62-481a-93ba-af378a05294b
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTestApi} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    调用中...
                  </>
                ) : (
                  "测试API调用"
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleClearResults}
                disabled={isLoading}
              >
                清空结果
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 错误显示 */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">错误信息</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* 结果显示 */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-700">🎉 API响应结果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>project ID</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded">
                    {result.project_id}
                  </p>
                </div>

                <div>
                  <Label>成功状态</Label>
                  <p className={`font-mono text-xs p-2 rounded ${
                    result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {result.success ? '成功' : '失败'}
                  </p>
                </div>

                <div>
                  <Label>剪辑计划数量</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded">
                    {result.editing_plan?.editing_sequence_plans?.length || 0}
                  </p>
                </div>

                <div>
                  <Label>视频Clip数量</Label>
                  <p className="font-mono text-xs bg-muted p-2 rounded">
                    {result.editing_plan?.editing_sequence_plans?.[0]?.timeline_clips?.length || 0}
                  </p>
                </div>
              </div>

              {/* 详细数据展示 */}
              {result.editing_plan && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">📊 详细数据分析</h4>

                  {/* 剪辑计划信息 */}
                  {result.editing_plan.editing_sequence_plans && result.editing_plan.editing_sequence_plans.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded">
                      <h5 className="font-medium text-sm mb-2">🎬 剪辑计划</h5>
                      {result.editing_plan.editing_sequence_plans.map((plan: any, index: number) => (
                        <div key={index} className="text-xs space-y-1">
                          <p><strong>计划{index + 1}:</strong> {plan.version_name}</p>
                          <p><strong>Clip数量:</strong> {plan.timeline_clips?.length || 0}</p>
                          <p><strong>描述:</strong> {plan.version_summary?.substring(0, 100)}...</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 对话轨道信息 */}
                  {result.editing_plan.finalized_dialogue_track && (
                    <div className="bg-purple-50 p-3 rounded">
                      <h5 className="font-medium text-sm mb-2">🎙️ 对话轨道</h5>
                      <div className="text-xs space-y-1">
                        <p><strong>对话Clip数量:</strong> {result.editing_plan.finalized_dialogue_track.final_dialogue_segments?.length || 0}</p>
                        <p><strong>SRT内容长度:</strong> {result.editing_plan.finalized_dialogue_track.final_srt_content?.length || 0} 字符</p>
                      </div>
                    </div>
                  )}

                  {/* 素材分类结果 */}
                  {result.editing_plan.material_classification_results && (
                    <div className="bg-orange-50 p-3 rounded">
                      <h5 className="font-medium text-sm mb-2">📁 素材分类</h5>
                      <div className="text-xs space-y-1">
                        <p><strong>废弃素材:</strong> {result.editing_plan.material_classification_results.discarded_footage_list?.length || 0} 个</p>
                        <p><strong>备选素材:</strong> {result.editing_plan.material_classification_results.alternative_footage_list?.length || 0} 个</p>
                      </div>
                    </div>
                  )}

                  {/* 制作建议 */}
                  {result.editing_plan.production_suggestions && result.editing_plan.production_suggestions.length > 0 && (
                    <div className="bg-green-50 p-3 rounded">
                      <h5 className="font-medium text-sm mb-2">💡 制作建议</h5>
                      <div className="text-xs">
                        <p><strong>建议数量:</strong> {result.editing_plan.production_suggestions.length}</p>
                        {result.editing_plan.production_suggestions.slice(0, 3).map((suggestion: any, index: number) => (
                          <p key={index} className="mt-1">
                            <strong>{index + 1}. {suggestion.suggestion_type}:</strong> {suggestion.description?.substring(0, 80)}...
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {result.director_intent && (
                <div>
                  <Label>导演意图</Label>
                  <Textarea
                    value={result.director_intent}
                    readOnly
                    className="mt-1 text-xs"
                    rows={3}
                  />
                </div>
              )}

              <div>
                <Label>完整响应数据 (JSON)</Label>
                <Textarea
                  value={JSON.stringify(result, null, 2)}
                  readOnly
                  className="mt-1 font-mono text-xs"
                  rows={10}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* API信息 */}
        <Card>
          <CardHeader>
            <CardTitle>API信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <Label>接口地址</Label>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                https://77.smartvideo.py.qikongjian.com/edit-plan/generate-by-project
              </p>
            </div>
            
            <div>
              <Label>请求方法</Label>
              <p className="font-mono text-xs bg-muted p-2 rounded">POST</p>
            </div>
            
            <div>
              <Label>请求格式</Label>
              <p className="font-mono text-xs bg-muted p-2 rounded">
                {`{ "project_id": "uuid-string" }`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
