import {
  ChatMessage,
  MessageBlock,
  FetchMessagesRequest,
  SendMessageRequest,
  ChatConfig,
  ApiResponse,
  RealApiMessage,
  ApiMessageContent,
  MessagesResponse,
  FunctionName,
  ProjectInit,
  ScriptSummary,
  CharacterGeneration,
  SketchGeneration,
  ShotSketchGeneration,
  ShotVideoGeneration
} from "./types";
import { authFetchWithSmartToken, getSmartToken, initializeTokenSystem } from "@/lib/ai-editing-auth";
import {
  SMART_CHAT_CONFIG,
  SmartChatError,
  categorizeError,
  shouldRetry,
  calculateRetryDelay,
  logSmartChatEvent,
  SmartChatPerformanceMonitor
} from "./auth-config";

// 🚀 升级版post请求函数 - 集成健全token处理系统
async function post<T>(url: string, data?: any): Promise<T> {
  console.log('🚀 SmartChatBox API调用:', {
    url: url,
    hasData: !!data,
    timestamp: new Date().toISOString()
  });

  // 🔐 确保token系统已初始化
  await initializeTokenSystem();

  // 🔍 获取最佳token
  const tokenInfo = await getSmartToken();

  if (tokenInfo) {
    console.log(`🔑 SmartChatBox使用${tokenInfo.source}来源的token`);
  } else {
    console.log('⚠️ SmartChatBox未找到token，使用fallback token');
  }

  // 🌐 构建完整URL
  const baseUrl = process.env.NEXT_PUBLIC_SMART_API || 'https://77.smartvideo.py.qikongjian.com';
  const fullUrl = `${baseUrl}${url}`;

  // 🚀 使用智能token处理的fetch
  const response = await authFetchWithSmartToken(fullUrl, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    console.error('❌ SmartChatBox API请求失败:', {
      status: response.status,
      statusText: response.statusText,
      url: url
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  // 检查业务状态码 - 保持video-flow的错误处理逻辑
  if (result.code !== 0) {
    console.error('❌ SmartChatBox业务错误:', {
      code: result.code,
      message: result.message,
      url: url
    });
    throw new Error(result.message || '请求失败');
  }

  console.log('✅ SmartChatBox API调用成功:', {
    url: url,
    code: result.code,
    hasData: !!result.data
  });

  return result;
}

// 🔄 带重试机制的智能API调用 - 升级版
async function postWithRetry<T>(url: string, data?: any, maxRetries: number = SMART_CHAT_CONFIG.retry.maxRetries): Promise<T> {
  const operationId = `API_${url.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  SmartChatPerformanceMonitor.start(operationId);

  let lastError: SmartChatError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logSmartChatEvent('info', `第${attempt}次尝试调用API`, { url, attempt, maxRetries });

      const result = await post<T>(url, data);

      SmartChatPerformanceMonitor.end(operationId);
      logSmartChatEvent('info', 'API调用成功', { url, attempt });

      return result;
    } catch (error) {
      // 分类错误
      lastError = categorizeError(error);

      logSmartChatEvent('error', `第${attempt}次API调用失败`, {
        url,
        attempt,
        maxRetries,
        error: lastError.message,
        errorType: lastError.type,
        errorCode: lastError.code
      });

      // 判断是否应该重试
      if (!shouldRetry(lastError, attempt, maxRetries)) {
        logSmartChatEvent('warn', '不满足重试条件，停止重试', {
          url,
          attempt,
          errorType: lastError.type
        });
        break;
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        const delay = calculateRetryDelay(attempt, lastError);

        if (delay > 0) {
          logSmartChatEvent('info', `${delay}ms后重试`, { url, attempt, delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  // 所有重试都失败了
  SmartChatPerformanceMonitor.end(operationId);

  const finalError = new SmartChatError(
    `API调用失败，已重试${maxRetries}次: ${lastError?.message}`,
    lastError?.code,
    lastError?.type
  );

  logSmartChatEvent('error', '所有重试都失败了', {
    url,
    maxRetries,
    finalError: finalError.message,
    errorType: finalError.type
  });

  throw finalError;
}

// 完全复制video-flow的类型检查函数
function isProjectInit(data: any): data is ProjectInit {
  return data && 'project_data' in data && 'script' in data.project_data;
}

function isScriptSummary(data: any): data is ScriptSummary {
  return data && 'summary' in data;
}

function isCharacterGeneration(data: any): data is CharacterGeneration {
  return data && 'character_name' in data && 'image_path' in data && 'completed_count' in data && 'total_count' in data;
}

function isSketchGeneration(data: any): data is SketchGeneration {
  return data && 'sketch_name' in data && 'image_path' in data && 'completed_count' in data && 'total_count' in data;
}

function isShotSketchGeneration(data: any): data is ShotSketchGeneration {
  return data && 'shot_type' in data && 'atmosphere' in data && 'key_action' in data && 'url' in data && 'completed_count' in data && 'total_count' in data;
}

function isShotVideoGeneration(data: any): data is ShotVideoGeneration {
  return data && 'prompt_json' in data && 'urls' in data && 'completed_count' in data && 'total_count' in data;
}

/**
 * 系统消息转换为blocks数组 - 完全复制video-flow版本
 */
function transformSystemMessage(
  functionName: FunctionName,
  content: string,
  customData: ProjectInit | ScriptSummary | CharacterGeneration | SketchGeneration | ShotSketchGeneration | ShotVideoGeneration
): MessageBlock[] {
  let blocks: MessageBlock[] = [];

  switch (functionName) {
    case 'create_project':
      if (isProjectInit(customData)) {
        blocks = [{
          type: 'text',
          text: `🎬 根据您输入的 "${customData.project_data.script}"，我已完成项目的初始化。\n${content}`
        }];
      }
      break;

    case 'generate_script_summary':
      if (isScriptSummary(customData)) {
        blocks = [
          { type: 'text',  text: `🎬 剧本摘要生成完成\n\n${customData.summary}\n\n${content}` }
        ];
      }
      break;

    case 'generate_character':
      if (isCharacterGeneration(customData)) {
        blocks = [
          { type: 'text', text: `🎭 演员 "${customData.character_name}" 已就位` },
          { type: 'image', url: customData.image_path, alt: customData.character_name },
          { type: 'text', text: '图片中演员形象仅供参考，后续可根据视频生成后进行调整。' },
          { type: 'progress', value: customData.completed_count, total: customData.total_count, label: `已完成 ${customData.completed_count} 个演员，共有 ${customData.total_count} 个` },
          { type: 'text', text: `\n${content}` }
        ];
      }
      break;

    case 'generate_sketch':
      if (isSketchGeneration(customData)) {
        blocks = [
          { type: 'text', text: `🎨 场景 "${customData.sketch_name}" 参考图片已生成 \n` },
          { type: 'image', url: customData.image_path, alt: customData.sketch_name },
          { type: 'text', text: '图片中场景仅供参考，后续可根据视频生成后进行调整。' },
          { type: 'progress', value: customData.completed_count, total: customData.total_count, label: `已完成 ${customData.completed_count} 个场景，共有 ${customData.total_count} 个` },
          { type: 'text', text: `\n${content}` }
        ];
      }
      break;

    case 'generate_shot_sketch':
      if (isShotSketchGeneration(customData)) {
        blocks = [
          { type: 'text', text: `🎬 故事板静帧生成 \n镜头类型：${customData.shot_type}\n氛围：${customData.atmosphere}\n关键动作：${customData.key_action}` },
          { type: 'image', url: customData.url, alt: '故事板静帧' },
          { type: 'text', text: '图片中故事板静帧仅供参考，后续可根据视频生成后进行调整。' },
          { type: 'progress', value: customData.completed_count, total: customData.total_count, label: `已完成 ${customData.completed_count} 个故事板静帧，共有 ${customData.total_count} 个` },
          { type: 'text', text: `\n${content}` }
        ];
      }
      break;

    case 'generate_video':
      if (isShotVideoGeneration(customData)) {
        blocks.push({
          type: 'text',
          text: `🎬 该分镜下包含${customData.urls.length} 个视频。 \n核心氛围：${customData.prompt_json.core_atmosphere}`
        });
        customData.urls.forEach((url: string) => {
          blocks.push({
            type: 'video',
            url: url
          });
        });
        blocks.push({
          type: 'text',
          text: '后续可在剪辑线上进行编辑。'
        }, {
          type: 'progress',
          value: customData.completed_count,
          total: customData.total_count,
          label: `已完成 ${customData.completed_count} 个分镜，共有 ${customData.total_count} 个分镜`
        }, {
          type: 'text',
          text: `\n${content}`
        });
      }
      break;

    default:
      blocks = [{ type: 'text', text: content }];
      break;
  }

  return blocks;
}

// 空消息 默认展示
const EMPTY_MESSAGES: RealApiMessage[] = [
  {
    id: 1,
    role: 'assistant',
    content: JSON.stringify([{
      type: 'text',
      content: '🌟Welcome to MovieFlow 🎬✨\nTell me your idea～💡\nI am your AI assistant🤖, I can help you:\n🎭 Generate actor images\n📽️ Generate scene & shot sketches\n🎞️ Complete video creation\n\nLet\'s start our creative journey together!❤️'
    }]),
    created_at: new Date().toISOString(),
    function_name: undefined,
    custom_data: undefined,
    status: 'success',
    intent_type: 'function_call'
  }
];

// 用户积分不足消息
const NoEnoughCreditsMessageBlocks: MessageBlock[] = [
  {
    type: 'text',
    text: 'Insufficient credits.'
  },
  {
    type: 'link',
    text: 'Upgrade to continue.',
    url: '/pricing'
  }
];

/**
 * 将API响应转换为ChatMessage格式 - 完全复制video-flow版本
 */
function transformMessage(apiMessage: RealApiMessage): ChatMessage {
  try {
    const { id, role, content, created_at, function_name, custom_data, status, intent_type, error_message } = apiMessage;
    let message: ChatMessage = {
      id: id ? id.toString() : Date.now().toString(),
      role: role,
      createdAt: new Date(created_at).getTime(),
      blocks: [],
      chatType: intent_type,
      status: status || 'success',
    };

    if (error_message && error_message === 'no enough credits') {
      message.blocks = NoEnoughCreditsMessageBlocks;
    } else {
      if (role === 'assistant' || role === 'user') {
        try {
          const contentObj = JSON.parse(content);
          const contentArray = Array.isArray(contentObj) ? contentObj : [contentObj];
          contentArray.forEach((c: ApiMessageContent) => {
            if (c.type === "text") {
              message.blocks.push({ type: "text", text: c.content });
            } else if (c.type === "image") {
              message.blocks.push({ type: "image", url: c.content });
            } else if (c.type === "video") {
              message.blocks.push({ type: "video", url: c.content });
            } else if (c.type === "audio") {
              message.blocks.push({ type: "audio", url: c.content });
            } else if (c.type === "link") {
              message.blocks.push({ type: "link", text: c.content, url: c.url || '' });
            }
          });
        } catch (error) {
          // 如果 JSON 解析失败，将整个 content 作为文本内容
          message.blocks.push({ type: "text", text: content });
        }
      } else if (role === 'system' && function_name && custom_data) {
        // 处理系统消息
        message.blocks = transformSystemMessage(function_name, content, custom_data);
      } else {
        message.blocks.push({ type: "text", text: content });
      }
    }

    // 处理函数调用相关的数据
    if (function_name && custom_data) {
      try {
        const customDataObj = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;

        // 根据不同的函数名处理不同的数据结构
        switch (function_name as FunctionName) {
          case 'project_init':
            message.projectInit = customDataObj as ProjectInit;
            break;
          case 'script_summary':
            message.scriptSummary = customDataObj as ScriptSummary;
            break;
          case 'character_generation':
            message.characterGeneration = customDataObj as CharacterGeneration;
            break;
          case 'sketch_generation':
            message.sketchGeneration = customDataObj as SketchGeneration;
            break;
          case 'shot_sketch_generation':
            message.shotSketchGeneration = customDataObj as ShotSketchGeneration;
            break;
          case 'shot_video_generation':
            message.shotVideoGeneration = customDataObj as ShotVideoGeneration;
            break;
        }
      } catch (error) {
        console.error('解析custom_data失败:', error);
      }
    }

    return message;
  } catch (error) {
    console.error('转换消息失败:', error);
    // 返回一个基本的错误消息
    return {
      id: Date.now().toString(),
      role: 'system',
      createdAt: Date.now(),
      blocks: [{ type: "text", text: "消息解析失败" }],
      chatType: 'chat',
      status: 'error',
    };
  }
}







/**
 * 获取消息列表 - 升级版，集成健全token处理
 */
export async function fetchMessages(
  config: ChatConfig,
  offset: number = 0,
  limit: number = 50
): Promise<{
  messages: ChatMessage[],
  hasMore: boolean,
  totalCount: number,
}> {
  const request: FetchMessagesRequest = {
    session_id: `project_${config.projectId}_user_${config.userId}`,
    limit,
    offset,
  };

  try {
    console.log('🔍 SmartChatBox获取消息历史:', {
      projectId: config.projectId,
      userId: config.userId,
      offset,
      limit
    });

    // 🚀 使用带重试机制的API调用
    const response = await postWithRetry<ApiResponse<MessagesResponse>>("/intelligent/history", request);

    console.log('✅ SmartChatBox消息历史获取成功:', {
      messageCount: response.data?.messages?.length || 0,
      hasMore: response.data?.has_more || false,
      totalCount: response.data?.total_count || 0
    });

    // 确保 response.data 和 messages 存在
    if (!response.data || !response.data.messages) {
      console.error('Invalid history response format:', response);
      return {
        messages: [],
        hasMore: false,
        totalCount: 0
      };
    }

    // 转换消息并按时间排序
    if (response.data.messages.length === 0) {
      return {
        messages: EMPTY_MESSAGES.map(transformMessage),
        hasMore: false,
        totalCount: 0
      };
    }
    return {
      messages: response.data.messages
      .map(transformMessage)
      .sort((a, b) => Number(a.id) - Number(b.id)),
      hasMore: response.data.has_more,
      totalCount: response.data.total_count
    };
  } catch (error) {
    console.error("Failed to fetch message history:", error);
    throw error;
  }
}

/**
 * 发送新消息 - 升级版，集成健全token处理和重试机制
 */
export async function sendMessage(
  blocks: MessageBlock[],
  config: ChatConfig,
  videoId?: string
): Promise<void> {
  // 提取文本、图片和视频
  const textBlocks = blocks.filter(b => b.type === "text");
  const imageBlocks = blocks.filter(b => b.type === "image");
  const videoBlocks = blocks.filter(b => b.type === "video");

  const request: SendMessageRequest = {
    session_id: `project_${config.projectId}_user_${config.userId}`,
    user_input: textBlocks.map(b => (b as { text: string }).text).join("\n"),
    project_id: config.projectId,
    user_id: config.userId.toString(),
  };

  // 如果有图片，添加第一张图片的URL
  if (imageBlocks.length > 0) {
    request.image_url = (imageBlocks[0] as { url: string }).url;
  }

  // 如果有视频，添加视频URL
  if (videoBlocks.length > 0) {
    request.video_url = (videoBlocks[0] as { url: string }).url;
  }

  // 如果有视频ID，添加到请求中
  if (videoId) {
    request.video_id = videoId;
  }

  try {
    console.log('💬 SmartChatBox发送消息:', {
      projectId: config.projectId,
      userId: config.userId,
      textLength: request.user_input.length,
      hasImage: !!request.image_url,
      hasVideo: !!request.video_url,
      videoId: videoId
    });

    // 🚀 使用带重试机制的API调用
    await postWithRetry<ApiResponse<RealApiMessage>>("/intelligent/chat", request);

    console.log('✅ SmartChatBox消息发送成功');
  } catch (error) {
    console.error("❌ SmartChatBox消息发送失败:", error);
    throw error;
  }
}

/**
 * 重试发送消息
 */
export async function retryMessage(
  messageId: string,
  config: ChatConfig
): Promise<void> {
  // TODO: 实现实际的重试逻辑，可能需要保存原始消息内容
  // 这里简单重用发送消息的接口
  return sendMessage([{ type: "text", text: "Retry message" }], config);
}
