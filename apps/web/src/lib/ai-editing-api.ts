// ai-editing-api.ts - AI剪辑计划API服务
// 此文件包含调用生成AI剪辑计划接口的相关代码
// 文件路径: lib/ai-editing-api.ts
// 最后更新: 2025/1/8

import { AIEditingData } from "@/types/timeline";
import { authFetchWithSmartToken, initializeTokenSystem, getSmartToken } from "./ai-editing-auth";

// API响应类型定义
export interface AIEditingPlanApiResponse {
  code: number;
  message: string;
  data: {
    project_id: string;
    director_intent: string;
    success: boolean;
    editing_plan: {
      finalized_dialogue_track: {
        final_srt_content: string;
        final_dialogue_segments: Array<{
          sequence_clip_id: string;
          source_clip_id: string;
          start_timecode: string;
          end_timecode: string;
          transcript: string;
          speaker: string;
        }>;
      };
      material_classification_results: {
        discarded_footage_list: Array<{
          clip_id: string;
          video_url: string;
          reason: string;
        }>;
        alternative_footage_list: Array<{
          clip_id: string;
          video_url: string;
          shortcoming: string;
          potential_use_cases: string;
        }>;
      };
      editing_sequence_plans: Array<{
        version_name: string;
        version_summary: string;
        timeline_clips: Array<{
          sequence_clip_id: string;
          source_clip_id: string;
          video_url: string;
          corresponding_script_scene_id: string;
          clip_type: string;
          sequence_start_timecode: string;
          source_in_timecode: string;
          source_out_timecode: string;
          clip_duration_in_sequence: string;
          transition_from_previous: {
            transition_type: string;
            transition_duration_ms: number;
            audio_sync_offset_ms: number;
            reason_for_transition: string;
          };
          clip_placement_reasons: {
            core_intent_and_audience_effect: string;
            emotion_priority: string;
            story_priority: string;
            rhythm_priority: string;
            eyeline_priority: string;
            space_priority: string;
            lens_language_application: string;
          };
          continuity_correction_suggestion: {
            error_exists: boolean;
            error_type: string;
            occurrence_location: string;
            error_description: string;
            is_intentional_artistic_choice: boolean;
            artistic_purpose_explanation: string;
            correction_suggestions: string[];
            reason_for_correction: string;
          };
          sound_design_suggestions: Array<{
            sound_type: string;
            description: string;
            timing_in_clip: string;
            intensity_suggestion: string;
          }>;
          visual_enhancement_suggestions: Array<{
            enhancement_type: string;
            description: string;
            reason: string;
          }>;
        }>;
      }>;
      production_suggestions: Array<{
        suggestion_type: string;
        description: string;
        reason: string;
        estimated_duration: string;
        suggested_content_elements: string;
      }>;
    };
    error: string | null;
    processing_time: number;
    video_count: number;
  };
  successful: boolean;
}

// API请求参数类型
export interface AIEditingPlanRequest {
  project_id: string;
}

// API错误类型
export class AIEditingApiError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AIEditingApiError';
  }
}

// 获取API基础URL
function getApiBaseUrl(): string {
  // 优先使用客户端环境变量
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AI_EDITING_PLAN_API_URL) {
    return process.env.NEXT_PUBLIC_AI_EDITING_PLAN_API_URL;
  }
  
  // 回退到默认URL
  return 'https://77.smartvideo.py.qikongjian.com';
}

// 重试配置
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1秒
  maxDelay: 10000, // 10秒
};

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 计算重试延迟（指数退避）
function calculateRetryDelay(attempt: number): number {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1);
  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * 调用生成AI剪辑计划接口
 * @param projectId 项目ID
 * @returns Promise<AIEditingData> 转换后的AI剪辑数据
 */
export async function generateAIEditingPlan(projectId: string): Promise<AIEditingData> {
  const apiUrl = `${getApiBaseUrl()}/edit-plan/generate-by-project`;
  const requestData: AIEditingPlanRequest = { project_id: projectId };

  console.log('🚀 开始调用AI剪辑计划API:', {
    url: apiUrl,
    projectId,
  });

  // 🔐 初始化token系统
  await initializeTokenSystem();

  // 🔍 检查token状态
  const tokenInfo = await getSmartToken();
  if (tokenInfo) {
    console.log(`🔑 使用${tokenInfo.source}来源的token进行API调用`);
  } else {
    console.log('⚠️ 未找到token，将尝试无认证调用');
  }

  let lastError: Error | null = null;

  // 重试机制
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`📡 第${attempt}次尝试调用API...`);

      // 🚀 使用智能token处理的fetch
      const response = await authFetchWithSmartToken(apiUrl, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });

      console.log('📡 API响应状态:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (!response.ok) {
        throw new AIEditingApiError(
          `API请求失败: ${response.status} ${response.statusText}`,
          response.status
        );
      }

      const apiResponse: AIEditingPlanApiResponse = await response.json();

      console.log('📦 API响应数据:', {
        code: apiResponse.code,
        message: apiResponse.message,
        successful: apiResponse.successful,
        hasData: !!apiResponse.data,
      });

      // 🎯 详细打印data数据
      if (apiResponse.data) {
        console.log('📊 详细data数据:');
        console.log('- project_id:', apiResponse.data.project_id);
        console.log('- success:', apiResponse.data.success);
        console.log('- director_intent:', apiResponse.data.director_intent);
        console.log('- processing_time:', apiResponse.data.processing_time);
        console.log('- video_count:', apiResponse.data.video_count);
        console.log('- error:', apiResponse.data.error);

        if (apiResponse.data.editing_plan) {
          const plan = apiResponse.data.editing_plan;
          console.log('🎬 剪辑计划数据:');

          // 对话轨道信息
          if (plan.finalized_dialogue_track) {
            console.log('- 对话轨道片段数量:', plan.finalized_dialogue_track.final_dialogue_segments?.length || 0);
            console.log('- SRT内容长度:', plan.finalized_dialogue_track.final_srt_content?.length || 0);
          }

          // 素材分类结果
          if (plan.material_classification_results) {
            console.log('- 废弃素材数量:', plan.material_classification_results.discarded_footage_list?.length || 0);
            console.log('- 备选素材数量:', plan.material_classification_results.alternative_footage_list?.length || 0);
          }

          // 剪辑序列计划
          if (plan.editing_sequence_plans) {
            console.log('- 剪辑计划数量:', plan.editing_sequence_plans.length);
            plan.editing_sequence_plans.forEach((seqPlan, index) => {
              console.log(`  计划${index + 1}: ${seqPlan.version_name} (${seqPlan.timeline_clips?.length || 0}个片段)`);
            });
          }

          // 制作建议
          if (plan.production_suggestions) {
            console.log('- 制作建议数量:', plan.production_suggestions.length);
          }
        }

        // 🔍 完整data对象（可折叠查看）
        console.group('📋 完整data对象 (点击展开)');
        console.log(JSON.stringify(apiResponse.data, null, 2));
        console.groupEnd();
      }

      // 检查API响应状态
      if (apiResponse.code !== 0 || !apiResponse.successful) {
        throw new AIEditingApiError(
          `API返回错误: ${apiResponse.message}`,
          apiResponse.code,
          apiResponse.data?.error
        );
      }

      // 转换API响应为内部数据格式
      const aiEditingData = convertApiResponseToAIEditingData(apiResponse);

      console.log('✅ AI剪辑计划生成成功:', {
        projectId: aiEditingData.project_id,
        plansCount: aiEditingData.editing_plan.editing_sequence_plans.length,
        clipsCount: aiEditingData.editing_plan.editing_sequence_plans[0]?.timeline_clips.length || 0,
      });

      return aiEditingData;

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      console.error(`❌ 第${attempt}次API调用失败:`, {
        error: lastError.message,
        attempt,
        maxRetries: RETRY_CONFIG.maxRetries,
      });

      // 如果不是最后一次尝试，等待后重试
      if (attempt < RETRY_CONFIG.maxRetries) {
        const retryDelay = calculateRetryDelay(attempt);
        console.log(`⏳ ${retryDelay}ms后重试...`);
        await delay(retryDelay);
      }
    }
  }

  // 所有重试都失败了
  throw new AIEditingApiError(
    `AI剪辑计划生成失败，已重试${RETRY_CONFIG.maxRetries}次: ${lastError?.message}`,
    undefined,
    lastError
  );
}

/**
 * 将API响应转换为内部AIEditingData格式
 */
function convertApiResponseToAIEditingData(apiResponse: AIEditingPlanApiResponse): AIEditingData {
  return {
    project_id: apiResponse.data.project_id,
    script_content: "", // API响应中没有这个字段，使用空字符串
    director_intent: apiResponse.data.director_intent,
    success: apiResponse.data.success,
    editing_plan: apiResponse.data.editing_plan,
  };
}

/**
 * 验证项目ID格式
 */
export function validateProjectId(projectId: string): boolean {
  if (!projectId || typeof projectId !== 'string') {
    return false;
  }
  
  // 检查是否为有效的UUID格式
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(projectId);
}
