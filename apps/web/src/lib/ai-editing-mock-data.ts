// ai-editing-mock-data.ts - AI剪辑Mock数据生成器
// 此文件包含 基于真实剪辑计划数据的Mock数据生成 的相关代码
// 文件路径: lib/ai-editing-mock-data.ts
// 最后更新: 2025/1/8

import { AIEditingData } from "@/types/timeline";

// 基于剪辑计划.md文件的真实数据生成Mock数据
export const generateAIEditingMockData = (projectId: string): AIEditingData => {
  return {
    project_id: projectId,
    script_content: "",
    director_intent: "请根据剧本内容和素材分析，制定专业的剪辑计划，注重故事节奏、情感表达和视觉效果的统一。",
    success: true,
    editing_plan: {
      material_classification_results: {
        discarded_footage_list: [
          {
            clip_id: "alley_confrontation_rain_01",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ9-0-20250719071033.mp4",
            reason: "重大且无法修复的技术性连续性错误。素材中出现了一个短暂的'第二女人'伪影，这很可能是AI生成瑕疵，完全破坏了场景的沉浸感。"
          },
          {
            clip_id: "CLK_20240521_0815_noir_alley",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ14-1-20250719071259.mp4",
            reason: "根本性的叙事不符。镜头展示了一场涉及'钞票'的交易和一个男人的最终离开，这与剧本中陈俊递出'折叠的纸条'并'消失在阴影中'的情节直接冲突。"
          }
        ],
        alternative_footage_list: [
          {
            clip_id: "vid_clip_001_east_asian_woman_key",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ7-0-20250719070826.mp4",
            shortcoming: "技术缺陷：素材完全缺失音频轨道。表演上，情绪为单一的'悲伤'，可能限制其在复杂情绪场景中的使用。",
            potential_use_cases: "改造潜力巨大。其无声特性使其成为一个完美的'画布'，可用于承载画外音（V.O.）、关键音效（如剧本中的钟声）或情绪强烈的配乐。"
          }
        ]
      },
      editing_sequence_plans: [
        {
          version_name: "主剪辑版 (Final Cut)",
          version_summary: "本最终剪辑方案旨在构建一部遵循导演'新黑色电影'风格、并以'故事至上，情感为王'为核心信条的完整短片。整体节奏将遵循一条精心设计的情感曲线：始于三个场景的层层递进的压抑与心理博弈，通过不同质感的节奏展现三种'牢笼'的本质。",
          timeline_clips: [
            {
              sequence_clip_id: "v1_clip_001",
              source_clip_id: "CLIP_001_RainyNight",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ0-0-20250719070438.mp4",
              corresponding_script_scene_id: "SCENE 1",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:00.000",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:03.400",
              clip_duration_in_sequence: "3.4s",
              transition_from_previous: {
                transition_type: "fade_in",
                transition_duration_ms: 1000,
                audio_sync_offset_ms: 0,
                reason_for_transition: "淡入开场，将观众平缓带入1936年上海的雨夜，建立忧郁、神秘的基调。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：建立场景。通过玉莲在窗前的背影和雨声，迅速设定影片的黑色电影基调和主角的孤寂心境。效果：引发观众的好奇心，想知道她是谁，在等什么。",
                emotion_priority: "奠定忧郁、沉思的情感基调（强度0.5）。",
                story_priority: "引入主角玉莲和核心环境（雨夜公寓），为故事拉开序幕。",
                rhythm_priority: "以一个静态长镜头开始，建立缓慢、压抑的'呼吸感'。",
                eyeline_priority: "观众视线跟随玉莲望向窗外，共享她的视角和情绪。",
                space_priority: "建立公寓内部空间的基本方位感。",
                lens_language_application: "全景和近景的组合，框中框构图（窗户）暗示了玉莲被困的处境。"
              },
              continuity_correction_suggestion: {
                error_exists: false
              },
              sound_design_suggestions: [
                {
                  sound_type: "ambient_sound",
                  description: "持续的雨声，作为整个场景的情绪底色。",
                  timing_in_clip: "全程",
                  intensity_suggestion: "中等音量"
                }
              ],
              visual_enhancement_suggestions: [
                {
                  enhancement_type: "color_grading",
                  description: "确立全片基准色调：高对比度，阴影部分偏冷（青/蓝色），高光部分保持中性或微暖。",
                  reason: "统一视觉风格，强化新黑色电影美学。"
                }
              ]
            },
            {
              sequence_clip_id: "v1_clip_002",
              source_clip_id: "clip_vid_001_rain_dialogue",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ1-1-20250719070418.mp4",
              corresponding_script_scene_id: "SCENE 1",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:03.400",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:07.800",
              clip_duration_in_sequence: "7.8s",
              transition_from_previous: {
                transition_type: "cut",
                transition_duration_ms: 0,
                audio_sync_offset_ms: -300,
                reason_for_transition: "J-Cut。在切到李先生画面前，提前0.3秒引入他点打火机的声音，打破宁静，暗示威胁的到来。硬切保持了场景的紧张感。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：引入对抗者。通过李先生的第一句台词和居高临下的构图，建立其掠夺者和控制者的形象。效果：观众立刻感受到权力关系的不对等和潜在的冲突。",
                emotion_priority: "引入沉郁、世故的情绪，与玉莲的忧郁形成对比和张力。",
                story_priority: "引入反派角色李先生，并通过他的台词揭示故事背景的'肮脏'。",
                rhythm_priority: "延续缓慢节奏，但通过引入对话和人物互动，开始积蓄戏剧能量。",
                eyeline_priority: "李先生的视线投向背景中的玉莲，建立二人间的视觉联系。",
                space_priority: "通过浅景深和前后景关系，明确了李先生在空间和权力上的主导地位。",
                lens_language_application: "前景人物清晰、背景人物模糊的中景镜头，是权力关系的经典视觉表达。"
              },
              continuity_correction_suggestion: {
                error_exists: true,
                error_type: "lighting_inconsistency",
                occurrence_location: "00:00:02.500",
                error_description: "光线不一致：前景人物清晰但背景人物模糊，可能影响视觉连贯性",
                is_intentional_artistic_choice: true,
                artistic_purpose_explanation: "故意使用浅景深突出权力关系的视觉表达",
                correction_suggestions: ["调整背景亮度", "增加补光"],
                reason_for_correction: "提升视觉连贯性，同时保持艺术效果"
              },
              sound_design_suggestions: [],
              visual_enhancement_suggestions: []
            },
            {
              sequence_clip_id: "v1_clip_003",
              source_clip_id: "vid_clip_001_pachinko_style_rainy_window",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ2-1-20250719070428.mp4",
              corresponding_script_scene_id: "SCENE 1",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:11.200",
              source_in_timecode: "00:00:00.500",
              source_out_timecode: "00:00:08.100",
              clip_duration_in_sequence: "7.6s",
              transition_from_previous: {
                transition_type: "cut",
                transition_duration_ms: 0,
                audio_sync_offset_ms: 0,
                reason_for_transition: "切入玉莲的主观内心世界。从客观的权力展示切到主观的内心独白，形成强烈的叙事节奏变化。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：揭示玉莲的清醒认知。通过她的画外音，直接告诉观众她看穿了这些男人的本质。效果：让观众与主角建立更深的共情，理解她的静默并非顺从，而是审视。",
                emotion_priority: "传达玉莲内心的悲伤、疏离和被压抑感。",
                story_priority: "首次揭示核心主题：玉莲将男人视为'牢笼'的提供者。这是全剧的核心冲突。",
                rhythm_priority: "插入一段内心独白，暂时中断外部对话，形成节奏上的'留白'，深化人物。",
                eyeline_priority: "她空洞的眼神和窥视感的镜头，将观众的注意力完全引向她的内心世界。",
                space_priority: "透过雨窗拍摄，创造了物理和情感上的双重距离感，强调她的孤立。",
                lens_language_application: "极具风格化的'雨窗窥视'镜头，完美诠释了'被观察的物件'这一主题。"
              },
              continuity_correction_suggestion: {
                error_exists: false
              },
              sound_design_suggestions: [
                {
                  sound_type: "dialogue_enhancement",
                  description: "为旁白增加轻微的混响，使其与现场对白区分开，更具内心独白感",
                  timing_in_clip: "全程",
                  intensity_suggestion: "清晰但轻柔"
                },
                {
                  sound_type: "ambient_sound",
                  description: "增强雨声层次，营造更深的孤独感",
                  timing_in_clip: "00:00:02-00:00:06",
                  intensity_suggestion: "中等偏强"
                }
              ],
              visual_enhancement_suggestions: [
                {
                  enhancement_type: "color_grading",
                  description: "增强雨窗的反射效果，强化'窥视'的视觉主题",
                  reason: "通过视觉效果深化角色的心理状态表达"
                },
                {
                  enhancement_type: "contrast_adjustment",
                  description: "适当降低整体对比度，营造梦幻般的内心世界感觉",
                  reason: "区分内心独白与现实场景的视觉层次"
                }
              ]
            }
          ]
        }
      ],
      production_suggestions: [
        {
          suggestion_type: "missing_shot",
          description: "【关键转折镜头】缺少一个玉莲凝视自己倒影时，眼中神情从沉思变为决绝的'极端特写（Extreme Close-Up）'。",
          reason: "这是玉莲角色弧光的转折点，是她从被动观察到主动抉择的视觉证明。",
          estimated_duration: "3-4s",
          suggested_content_elements: "极端特写，仅包含玉莲的双眼。焦点精确，能捕捉到眼神中微妙的情绪变化。"
        }
      ]
    }
  };
};
