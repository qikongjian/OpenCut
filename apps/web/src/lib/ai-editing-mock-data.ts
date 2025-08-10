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
    director_intent: "",
    success: true,
    editing_plan: {
      finalized_dialogue_track: {
        final_srt_content: "1\n00:00:12,000 --> 00:00:15,000\nDelta squad, reinforce section gamma. Now. Move now.\n\n2\n00:00:15,200 --> 00:00:20,800\nThey said it was a fortress. Logic's final, perfect kingdom.\n\n3\n00:00:23,500 --> 00:00:25,800\nBut the universe doesn't follow logic.\n\n4\n00:00:27,958 --> 00:00:29,458\nIt just happens.\n\n5\n00:00:52,458 --> 00:00:55,158\nAll units, hold! Hold positions! Report damage!\n\n6\n00:01:12,258 --> 00:01:13,758\nNo. No, no, no...\n\n7\n00:01:16,258 --> 00:01:21,558\nAutomated repair impossible. Manual override required. Probability of catastrophic failure: 97.3%.\n\n8\n00:01:22,258 --> 00:01:25,258\nMy whole life... I trusted the numbers.\n\n9\n00:01:25,758 --> 00:01:27,558\nThe numbers said I was safe.\n\n10\n00:01:27,758 --> 00:01:29,758\nThe numbers said they were safe.\n\n11\n00:01:33,258 --> 00:01:35,758\nRecommended action: Abort.\n\n12\n00:01:48,558 --> 00:01:53,558\nThe numbers are a lie. There's only what you do. And what you don't.\n\n13\n00:02:09,090 --> 00:02:10,690\nPlease. Just this once.\n\n14\n00:02:15,690 --> 00:02:16,290\nFly!",
        final_dialogue_segments: [
          {
            sequence_clip_id: "v1_clip_002",
            source_clip_id: "E01-S01-C03_to_C04",
            start_timecode: "00:00:12.000",
            end_timecode: "00:00:15.000",
            transcript: "Delta squad, reinforce section gamma. Now. Move now.",
            speaker: "Dr. Elara Vance [CH-001]"
          },
          {
            sequence_clip_id: "v1_clip_003",
            source_clip_id: "[E01-S01-C05]",
            start_timecode: "00:00:15.200",
            end_timecode: "00:00:20.800",
            transcript: "They said it was a fortress. Logic's final, perfect kingdom.",
            speaker: "Dr. Elara Vance (旁白)"
          },
          {
            sequence_clip_id: "v1_clip_004",
            source_clip_id: "E01-S01-C06-C07",
            start_timecode: "00:00:23.500",
            end_timecode: "00:00:25.800",
            transcript: "But the universe doesn't follow logic.",
            speaker: "Dr. Elara Vance [画外音]"
          },
          {
            sequence_clip_id: "v1_clip_004",
            source_clip_id: "E01-S01-C06-C07",
            start_timecode: "00:00:27.958",
            end_timecode: "00:00:29.458",
            transcript: "It just happens.",
            speaker: "Dr. Elara Vance [画外音]"
          },
          {
            sequence_clip_id: "v1_clip_008",
            source_clip_id: "E01-S02-C06, E01-S02-C07",
            start_timecode: "00:00:52.458",
            end_timecode: "00:00:55.158",
            transcript: "All units, hold! Hold positions! Report damage!",
            speaker: "Dr. Elara Vance"
          },
          {
            sequence_clip_id: "v1_clip_010",
            source_clip_id: "E01-S03-C02_C03",
            start_timecode: "00:01:12.258",
            end_timecode: "00:01:13.758",
            transcript: "No. No, no, no...",
            speaker: "Dr. Elara Vance"
          },
          {
            sequence_clip_id: "v1_clip_011",
            source_clip_id: "E01-S03-C04, E01-S03-C05",
            start_timecode: "00:01:16.258",
            end_timecode: "00:01:21.558",
            transcript: "Automated repair impossible. Manual override required. Probability of catastrophic failure: 97.3%.",
            speaker: "画外音 (Computer Voice)"
          },
          {
            sequence_clip_id: "v1_clip_012",
            source_clip_id: "IMF_E01-S03-C06_C07",
            start_timecode: "00:01:22.258",
            end_timecode: "00:01:25.258",
            transcript: "My whole life... I trusted the numbers.",
            speaker: "Dr. Elara Vance [CH-001] (画外音)"
          },
          {
            sequence_clip_id: "v1_clip_012",
            source_clip_id: "IMF_E01-S03-C06_C07",
            start_timecode: "00:01:25.758",
            end_timecode: "00:01:27.558",
            transcript: "The numbers said I was safe.",
            speaker: "Dr. Elara Vance [CH-001] (画外音)"
          },
          {
            sequence_clip_id: "v1_clip_012",
            source_clip_id: "IMF_E01-S03-C06_C07",
            start_timecode: "00:01:27.758",
            end_timecode: "00:01:29.758",
            transcript: "The numbers said they were safe.",
            speaker: "Dr. Elara Vance [CH-001] (画外音)"
          },
          {
            sequence_clip_id: "v1_clip_013",
            source_clip_id: "E01-S03-C08",
            start_timecode: "00:01:33.258",
            end_timecode: "00:01:35.758",
            transcript: "Recommended action: Abort.",
            speaker: "电脑画外音"
          },
          {
            sequence_clip_id: "v1_clip_015",
            source_clip_id: "E01-S04-C02_C03",
            start_timecode: "00:01:48.558",
            end_timecode: "00:01:53.558",
            transcript: "The numbers are a lie. There's only what you do. And what you don't.",
            speaker: "Dr. Elara Vance [CH-001] (画外音)"
          },
          {
            sequence_clip_id: "v1_clip_018",
            source_clip_id: "E01-S04-C06_E01-S04-C07",
            start_timecode: "00:02:09.090",
            end_timecode: "00:02:10.690",
            transcript: "Please. Just this once.",
            speaker: "Dr. Elara Vance"
          },
          {
            sequence_clip_id: "v1_clip_020",
            source_clip_id: "E01-S04-C06_E01-S04-C07",
            start_timecode: "00:02:15.690",
            end_timecode: "00:02:16.290",
            transcript: "Fly!",
            speaker: "Dr. Elara Vance"
          }
        ]
      },
      material_classification_results: {
        discarded_footage_list: [],
        alternative_footage_list: [
          {
            clip_id: "E01-S01-C02",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ2_b60ace5b-43b4-49f0-8587-f928d6dbc88c-20250809072303.mp4",
            shortcoming: "存在轻微但持续的AI生成瑕疵：主角工作服上的徽章文字存在不一致的乱码。",
            potential_use_cases: "核心叙事素材，但在使用前需要通过数字修复（Digital Cleanup）技术擦除并替换错误的徽章文字，以保证影片的沉浸感和专业度。"
          },
          {
            clip_id: "[E01-S01-C05]",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ4_c6cfe18e-3af1-4251-ae2d-21e05f3b6b70-20250809072340.mp4",
            shortcoming: "AI生成的机器人移动存在轻微的'滑动感'，物理真实性略有欠缺。",
            potential_use_cases: "可作为风格化镜头使用。此瑕疵无需修复，可被解读为一种艺术选择，用以增强机器的'非人'特质和场景的冰冷工业感，服务于影片主题。"
          },
          {
            clip_id: "E01-S02-C05",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ9_8ad58220-17a0-4059-a5ab-8b30947bf8e0-20250809072414.mp4",
            shortcoming: "存在潜在的AI生成瑕疵：碎片和尘埃的运动轨迹可能不完全符合物理规律；机器人倒地后的抽搐动作可能过于平滑，有引发'恐怖谷效应'的风险。",
            potential_use_cases: "作为灾难高潮的核心镜头，叙事价值极高。在使用前，强烈建议通过VFX对碎片运动和机器人动画进行精修，以确保物理真实性和情感冲击力。"
          },
          {
            clip_id: "E01-S03-C02_C03",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ12_cde372c1-8b45-4360-b5e3-203de4213a99-20250809072204.mp4",
            shortcoming: "存在中度恐怖谷效应风险（00:00:04.500后），面部微表情转换可能僵硬；AI生成的发丝在头部运动时可能存在物理不一致性。",
            potential_use_cases: "作为场景的核心转折镜头，叙事价值极高。建议通过交叉剪辑（如切入显示器错误代码的特写）来规避最不自然的表演帧，或通过后期微调修复，以保留其前半段出色的紧张感营造。"
          },
          {
            clip_id: "E01-S04-C09-C10",
            video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ22_c52099c9-93a7-465c-8cff-f91c88ad7dfa-20250809072621.mp4",
            shortcoming: "在最终的特写镜头中，AI生成的'深刻平静'表情存在潜在的恐怖谷效应风险，可能缺乏人类细微的表情变化而显得不自然。",
            potential_use_cases: "影片的决定性高潮镜头。在使用前，建议通过精细的面部重塑或动态捕捉修正，由VFX艺术家对表情进行微调，以确保其情感表达的真实性和感染力。"
          }
        ]
      },
      editing_sequence_plans: [
        {
          version_name: "总剪辑师终剪版 (Supervising Editor's Cut)",
          version_summary: "本最终剪辑方案旨在将所有孤立的素材片段编排成一个具有强大情感力量和清晰叙事弧光的完整序列。核心意图是精确描绘主角伊拉拉·万斯博士从一个冰冷的逻辑信奉者，在面临末日危机时，其信仰崩塌，最终通过一次非理性的、充满人性的信仰之跃，完成自我救赎的完整心路历程。剪辑节奏遵循'建立-崩溃-抉择-宣泄'的宏观结构：以宏大而压抑的工业景观开场，通过一次突发的灾难性事故将节奏推向紧张高潮，随即在死寂的控制室中将节奏降至冰点以展现内心的绝望，然后在缓慢、庄重的抉择中积蓄力量，最终通过一次黑屏的呼吸停顿，将所有情感能量在引擎点火的瞬间彻底释放，并以主角获得内心平静的特写收尾。",
          timeline_clips: [
            {
              sequence_clip_id: "v1_clip_001",
              source_clip_id: "E01-S01-C01",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ1_82256814-574d-4493-8f2c-a6826b486f22-20250809072229.mp4",
              corresponding_script_scene_id: "E01-S01-C01",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:00.000",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:08.000",
              clip_duration_in_sequence: "8.0s",
              transition_from_previous: {
                transition_type: "fade_in",
                transition_duration_ms: 1500,
                audio_sync_offset_ms: -500,
                reason_for_transition: "J-Cut。工业噪音先于画面进入，从听觉上建立压抑、冷酷的氛围，再通过视觉的宏大场面予以确认，最大化开场的沉浸感。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：作为建立镜头（Establishing Shot），迅速定义世界的规模、基调和核心冲突。效果：让观众在影片开始的几秒钟内就感受到一种敬畏、压迫和孤立感，为主角的困境奠定情感基础。",
                emotion_priority: "唤起观众的焦虑感和对人类在其中渺小地位的共情。",
                story_priority: "清晰地传达了故事的核心背景：一项规模浩大、看似不可能的工程正在紧急进行。",
                rhythm_priority: "建立一种沉重、稳定、近乎凝滞的初始节奏，为即将到来的紧张情节积蓄能量。",
                eyeline_priority: "俯视角度将观众视线引向画面中央的火箭和机器人活动。",
                space_priority: "完美地建立了场景的三维空间感，为后续镜头提供了空间参照系。",
                lens_language_application: "极远景（Extreme Wide Shot）和固定机位，最大化地强调了环境的规模和主角的孤立。"
              },
              continuity_correction_suggestion: {
                error_exists: false,
                error_type: "N/A",
                occurrence_location: "N/A",
                error_description: "N/A",
                is_intentional_artistic_choice: false,
                artistic_purpose_explanation: "N/A",
                correction_suggestions: [],
                reason_for_correction: "N/A"
              },
              sound_design_suggestions: [
                {
                  sound_type: "ambient_sound",
                  description: "强化无数伺服电机持续的、低沉的嗡鸣声，混响要大，以突出空间的巨大空旷感。",
                  timing_in_clip: "贯穿始终",
                  intensity_suggestion: "中低音量，形成一种心理压迫的底噪。"
                }
              ],
              visual_enhancement_suggestions: [
                {
                  enhancement_type: "color_grading",
                  description: "轻微增强画面中的蓝色和灰色，进一步降低饱和度，在暗部区域增加微弱的蓝色调，强化冷感和科技感。",
                  reason: "为了极致化导演意图中的'冷酷、去饱和'的工业美学。"
                }
              ]
            },
            {
              sequence_clip_id: "v1_clip_002",
              source_clip_id: "E01-S01-C03_to_C04",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ3_380f39a9-0ff2-459f-95fb-548ae5661620-20250809072305.mp4",
              corresponding_script_scene_id: "SC-001_Shot_1",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:08.000",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:07.000",
              clip_duration_in_sequence: "7.0s",
              transition_from_previous: {
                transition_type: "cut",
                transition_duration_ms: 0,
                audio_sync_offset_ms: 0,
                reason_for_transition: "从宏大远景硬切至人物特写，将外部环境的压迫感瞬间内化为主角的个人压力，形成强烈的节奏变化。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：实现'信息-危机-人物'的快速叙事浓缩，将宏大背景与个人联系起来。效果：立刻感受到压倒性的紧迫感和对主角困境的代入感。",
                emotion_priority: "通过特写镜头放大其紧绷的下颚、专注而焦虑的眼神，最大化传递其在巨大压力下保持权威的复杂情绪。",
                story_priority: "高效地交代了核心冲突（结构警报）、主角身份（工程师）和她的行动。",
                rhythm_priority: "镜头内部节奏从静态（平板）到动态（上摇），再到表演高潮（下令），形成一个'起-承-转'的微型叙事弧光。",
                eyeline_priority: "摄像机的上摇运动完美引导了观众的视线，从客观的技术问题转移到主观的人物压力。",
                space_priority: "在特写镜头中通过浅景深建立了空间感和主角的孤立感。",
                lens_language_application: "从设备特写转为人物特写的镜头语言，是典型的从'事'到'人'的叙事聚焦手法。"
              },
              continuity_correction_suggestion: {
                error_exists: false,
                error_type: "N/A",
                occurrence_location: "N/A",
                error_description: "N/A",
                is_intentional_artistic_choice: false,
                artistic_purpose_explanation: "N/A",
                correction_suggestions: [],
                reason_for_correction: "N/A"
              },
              sound_design_suggestions: [
                {
                  sound_type: "dialogue_enhancement",
                  description: "对白施加轻微的数字通讯效果，以符合其通过通讯设备下令的情境。",
                  timing_in_clip: "00:00:04.000 - 00:00:07.000",
                  intensity_suggestion: "保持对白主体清晰。"
                }
              ],
              visual_enhancement_suggestions: [
                {
                  enhancement_type: "color_grading",
                  description: "提升平板电脑上红色警报的饱和度和亮度，使其成为画面中最刺眼的元素，象征迫在眉睫的危险。",
                  reason: "利用色彩引导观众的注意力焦点和情绪。"
                }
              ]
            },
            {
              sequence_clip_id: "v1_clip_003",
              source_clip_id: "[E01-S01-C05]",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ4_c6cfe18e-3af1-4251-ae2d-21e05f3b6b70-20250809072340.mp4",
              corresponding_script_scene_id: "SC-001",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:15.000",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:08.000",
              clip_duration_in_sequence: "8.0s",
              transition_from_previous: {
                transition_type: "cut",
                transition_duration_ms: 0,
                audio_sync_offset_ms: 0,
                reason_for_transition: "作为对Elara命令的反应镜头，展示机器人大军的行动，并引入她的内心独白。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：通过旁白和画面，引出主角的内心困境和故事的核心矛盾：逻辑与人性的对抗。效果：让观众在感受宏大工业奇观的同时，开始对这个'逻辑王国'进行深层思考。",
                emotion_priority: "营造一种冰冷、压抑、缺乏生命力的情感基调，与旁白中隐含的人性反思形成对比。",
                story_priority: "奠定核心冲突：一个看似完美的逻辑系统正被其创造者所质疑。",
                rhythm_priority: "平稳的摄影机移动和舒缓的旁白语速，共同构建了一种沉思、庄严的节奏。",
                eyeline_priority: "摄影机的平移运动自然地引导观众视线跟随机器人小队。",
                space_priority: "清晰地建立了'巨型工厂'这一核心场景的三维空间感。",
                lens_language_application: "仰视全景镜头赋予了机器人一种纪念碑式的压迫感。"
              },
              continuity_correction_suggestion: {
                error_exists: true,
                error_type: "AI生成瑕疵 (AI Generation Artifact)",
                occurrence_location: "贯穿整个片段",
                error_description: "机器人的移动存在轻微的非自然'滑动感'，步伐与位移不完全匹配。",
                is_intentional_artistic_choice: true,
                artistic_purpose_explanation: "此瑕疵被艺术化利用，它打破了完美CG的虚假感，反而增强了机器的'非人'特质和场景的冰冷工业感，符合影片整体氛围。因此，建议不进行修复。",
                correction_suggestions: ["保留现状，将其视为风格化的一部分"],
                reason_for_correction: "修复成本高，且可能失去现有的'粗糙'质感。保留瑕疵反而能服务于叙事，强化'逻辑王国'并非真正完美的潜台词。"
              },
              sound_design_suggestions: [],
              visual_enhancement_suggestions: []
            },
            {
              sequence_clip_id: "v1_clip_004",
              source_clip_id: "E01-S01-C06-C07",
              video_url: "https://video-base-imf.oss-ap-southeast-7.aliyuncs.com/uploads/FJ5_d68f2200-c962-4ff9-8f0c-bdf501dcf8b6-20250809072200.mp4",
              corresponding_script_scene_id: "E01-S01-C06",
              clip_type: "video_and_audio",
              sequence_start_timecode: "00:00:23.000",
              source_in_timecode: "00:00:00.000",
              source_out_timecode: "00:00:08.500",
              clip_duration_in_sequence: "8.5s",
              transition_from_previous: {
                transition_type: "cut",
                transition_duration_ms: 0,
                audio_sync_offset_ms: 0,
                reason_for_transition: "从机器人视角切回主角，深化她的内心反思。"
              },
              clip_placement_reasons: {
                core_intent_and_audience_effect: "意图：通过一个包含硬切的镜头，在视觉上强化角色内心'断裂'和'顿悟'的瞬间。效果：观众在被特写镜头震惊的同时，能从她的眼神中读出恐惧、疲惫和决心，并随着镜头的缓慢拉远，再次感受到这份决心背后的巨大孤独。",
                emotion_priority: "这是情感的顶点。从'思考'到'感受'的转变。",
                story_priority: "标志着主角放弃逻辑挣扎，接受现实并下定决心行动的关键节点。",
                rhythm_priority: "节奏从硬切的'激变'转为慢速拉远的'缓释'。",
                eyeline_priority: "特写强制将观众的视线锁定在主角的眼睛上。",
                space_priority: "从极度压缩的心理空间（特写）向广阔的物理空间（拉远后的全景）过渡，用空间变化来叙事。",
                lens_language_application: "从特写到慢速拉远的运镜，连接人物内心世界与外部环境，强化了'孤独的决心'这一核心主题。"
              },
              continuity_correction_suggestion: {
                error_exists: false,
                error_type: "N/A",
                occurrence_location: "N/A",
                error_description: "N/A",
                is_intentional_artistic_choice: false,
                artistic_purpose_explanation: "N/A",
                correction_suggestions: [],
                reason_for_correction: "N/A"
              },
              sound_design_suggestions: [
                {
                  sound_type: "sfx",
                  description: "在内部硬切发生的瞬间，抽掉所有环境音，制造一瞬间的真空感，时长约0.2秒，以强化视觉冲击。",
                  timing_in_clip: "在源素材00:00:03.458处",
                  intensity_suggestion: "极短暂的静音。"
                }
              ],
              visual_enhancement_suggestions: []
            }
          ]
        }
      ],
      production_suggestions: [
        {
          suggestion_type: "missing_shot",
          description: "在整个序列中，尤其是在灾难发生时，缺少主角Elara面部反应的特写镜头。例如，在鼻锥坠落和撞击时，需要交叉剪辑她震惊、恐惧的表情。",
          reason: "根据'动作-反应'剪辑原则，观众在看到灾难后，迫切需要看到角色的反应来理解事件的情感重量。缺少Elara的反应特写，会极大削弱整个危机场景的情感共鸣，使灾难沦为纯粹的视觉奇观。",
          estimated_duration: "2-4s per shot",
          suggested_content_elements: "特写或中近景，Elara的面部。瞳孔收缩，表情从难以置信转为惊恐。背景可以是失焦的、闪烁着警报红光的控制台。"
        },
        {
          suggestion_type: "vfx_required",
          description: "多个AI生成的关键镜头存在潜在瑕疵，包括徽章乱码、机器人滑动、碎片物理不真实、面部表情僵硬等。强烈建议分配充足的VFX资源进行后期精修。",
          reason: "为了确保影片最终的质量、沉浸感和情感冲击力，必须通过VFX手段弥补AI生成内容的固有缺陷。这是实现导演意图、保证影片达到工业级标准的关键步骤。",
          estimated_duration: "N/A",
          suggested_content_elements: "VFX任务应包括：数字修复、动画关键帧调整、物理模拟校正、面部微表情重塑等。"
        },
        {
          suggestion_type: "sound_recording_enhancement",
          description: "建议为巨型工厂场景和关键事件（如引擎点火）制作更复杂、更有层次的环境音和SFX。当前的音轨略显单一。",
          reason: "增加更多层次的音效能极大地提升空间的真实感、深度和场景的潜在紧张感，让这个世界感觉更'活'，从而升华整体观影体验。",
          estimated_duration: "N/A",
          suggested_content_elements: "多轨道音效设计：多种频率的工业噪音，包含高频（电火花）、中频（机械臂）、低频（持续嗡鸣）；为引擎点火设计包含LFE在内的多层次冲击音效。"
        }
      ]
    }
  };
};
