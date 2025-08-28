export type Role = "user" | "assistant" | "system";
export type MessageStatus = 'pending' | 'success' | 'error';
export type IntentType = 'chat' | 'function_call' | 'procedure';

export type MessageBlock =
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "video"; url: string; poster?: string }
  | { type: "audio"; url: string }
  | { type: "progress"; value: number; total?: number; label?: string }
  | { type: "link"; text: string; url: string };

export interface ChatMessage {
  id: string;
  role: Role;
  blocks: MessageBlock[];
  createdAt: number;
  chatType: IntentType;
  status: MessageStatus;
}

export interface MessagesState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMoreMessages: () => Promise<void>;
  backToLatest: () => void;
  isViewingHistory: boolean;
}

export interface MessagesActions {
  sendMessage: (blocks: MessageBlock[]) => Promise<void>;
  clearMessages: () => void;
  retryMessage: (messageId: string) => Promise<void>;
}

export interface SystemPushState {
  enabled: boolean;
  toggle: () => void;
}

export interface ChatConfig {
  projectId: string;
  userId: number;
}

export interface FetchMessagesRequest {
  session_id: string;
  limit: number;
  offset: number;
}

export interface SendMessageRequest {
  session_id: string;
  user_input: string;
  image_url?: string;
  video_id?: string;
  video_url?: string;
  project_id: string;
  user_id: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface MessagesResponse {
  session_id: string;
  total_count: number;
  messages: RealApiMessage[];
  has_more: boolean;
  current_page: {
    offset: number;
    limit: number;
    count: number;
  };
}

type ContentType = "text" | "image" | "video" | "audio" | "link";
export type FunctionName = "create_project" | "generate_script_summary" | "generate_character" | "generate_sketch" | "generate_shot_sketch" | "generate_video";

// 项目创建
export interface ProjectInit {
  project_data: {
    script: string; // 原始剧本
  }
}

// 剧本摘要
export interface ScriptSummary {
  summary: string; // 剧本摘要
}

// 角色生成
export interface CharacterGeneration {
  character_name: string; // 角色名称
  character_description?: string; // 角色描述
  image_path: string; // 角色图片
  completed_count: number; // 生成数量
  total_count: number; // 总数量
}

// 场景生成
export interface SketchGeneration {
  sketch_name: string; // 场景名称
  scene_description?: string; // 场景描述
  image_path: string; // 场景图片
  completed_count: number; // 生成数量
  total_count: number; // 总数量
}

// 分镜生成
export interface ShotSketchGeneration {
  shot_type: string; // 分镜类型
  atmosphere: string; // 氛围
  key_action: string; // 关键动作
  url: string; // 分镜图片
  completed_count: number; // 生成数量
  total_count: number; // 总数量
}

// 分镜视频生成
export interface ShotVideoGeneration {
  prompt_json: {
    core_atmosphere: string; // 核心氛围
  };
  urls: string[]; // 分镜视频
  completed_count: number; // 生成数量
  total_count: number; // 总数量
}

export interface ApiMessageContent {
  type: ContentType;
  content: string;
  url?: string;
}

export interface RealApiMessage {
  created_at: string;
  id: number;
  role: Role;
  content: string;
  function_name?: FunctionName;
  custom_data?: ProjectInit | ScriptSummary | CharacterGeneration | SketchGeneration | ShotSketchGeneration | ShotVideoGeneration;
  status: MessageStatus;
  intent_type: IntentType;
  error_message?: string;
}
