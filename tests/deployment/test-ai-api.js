#!/usr/bin/env node

/**
 * AI剪辑计划API测试脚本
 * 用于验证API接口是否正常工作
 */

const API_URL =
  'https://77.smartvideo.py.qikongjian.com/edit-plan/generate-by-project'
const TEST_PROJECT_ID = 'dae204bc-1a62-481a-93ba-af378a05294b'

async function testAIEditingPlanAPI() {
  console.log('🚀 开始测试AI剪辑计划API...')
  console.log(`📡 API地址: ${API_URL}`)
  console.log(`🆔 测试项目ID: ${TEST_PROJECT_ID}`)
  console.log('')

  try {
    const requestData = {
      project_id: TEST_PROJECT_ID,
    }

    console.log('📤 发送请求...')
    console.log('请求数据:', JSON.stringify(requestData, null, 2))
    console.log('')

    const startTime = Date.now()

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log('📡 响应状态:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      duration: `${duration}ms`,
    })
    console.log('')

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status} ${response.statusText}`)
    }

    const responseData = await response.json()

    console.log('✅ API调用成功!')
    console.log('')

    // 分析响应数据
    console.log('📊 响应数据分析:')
    console.log(`- 响应代码: ${responseData.code}`)
    console.log(`- 响应消息: ${responseData.message}`)
    console.log(`- 成功状态: ${responseData.successful}`)

    if (responseData.data) {
      console.log('')
      console.log('🎯 详细data数据分析:')
      console.log(`- 项目ID: ${responseData.data.project_id}`)
      console.log(`- 处理成功: ${responseData.data.success}`)
      console.log(`- 处理时间: ${responseData.data.processing_time}秒`)
      console.log(`- 视频数量: ${responseData.data.video_count}`)
      console.log(`- 错误信息: ${responseData.data.error || '无'}`)

      // 导演意图
      if (responseData.data.director_intent) {
        console.log(
          `- 导演意图: ${responseData.data.director_intent.substring(
            0,
            100
          )}...`
        )
      }

      if (responseData.data.editing_plan) {
        const plan = responseData.data.editing_plan
        console.log('')
        console.log('🎬 剪辑计划详细信息:')
        console.log(
          `- 剪辑计划数量: ${plan.editing_sequence_plans?.length || 0}`
        )

        // 剪辑序列计划
        if (
          plan.editing_sequence_plans &&
          plan.editing_sequence_plans.length > 0
        ) {
          plan.editing_sequence_plans.forEach((seqPlan, index) => {
            console.log(`  计划${index + 1}: "${seqPlan.version_name}"`)
            console.log(
              `    - 片段数量: ${seqPlan.timeline_clips?.length || 0}`
            )
            console.log(
              `    - 计划描述: ${seqPlan.version_summary?.substring(0, 80)}...`
            )

            // 显示前3个片段的详细信息
            if (seqPlan.timeline_clips && seqPlan.timeline_clips.length > 0) {
              console.log(`    - 前3个片段:`)
              seqPlan.timeline_clips.slice(0, 3).forEach((clip, clipIndex) => {
                console.log(
                  `      片段${clipIndex + 1}: ${clip.sequence_clip_id}`
                )
                console.log(`        时长: ${clip.clip_duration_in_sequence}`)
                console.log(`        类型: ${clip.clip_type}`)
                console.log(
                  `        转场: ${
                    clip.transition_from_previous?.transition_type || '无'
                  }`
                )
              })
              if (seqPlan.timeline_clips.length > 3) {
                console.log(
                  `      ... 还有${seqPlan.timeline_clips.length - 3}个片段`
                )
              }
            }
          })
        }

        // 对话轨道
        if (plan.finalized_dialogue_track) {
          console.log('')
          console.log('🎙️ 对话轨道信息:')
          console.log(
            `- 对话片段数量: ${
              plan.finalized_dialogue_track.final_dialogue_segments?.length || 0
            }`
          )
          console.log(
            `- SRT内容长度: ${
              plan.finalized_dialogue_track.final_srt_content?.length || 0
            } 字符`
          )

          // 显示前3个对话片段
          if (
            plan.finalized_dialogue_track.final_dialogue_segments &&
            plan.finalized_dialogue_track.final_dialogue_segments.length > 0
          ) {
            console.log('- 前3个对话片段:')
            plan.finalized_dialogue_track.final_dialogue_segments
              .slice(0, 3)
              .forEach((segment, index) => {
                console.log(
                  `  对话${index + 1}: ${
                    segment.speaker
                  } - "${segment.transcript?.substring(0, 50)}..."`
                )
                console.log(
                  `    时间: ${segment.start_timecode} - ${segment.end_timecode}`
                )
              })
          }
        }

        // 素材分类结果
        if (plan.material_classification_results) {
          console.log('')
          console.log('📁 素材分类结果:')
          const results = plan.material_classification_results
          console.log(
            `- 废弃素材数量: ${results.discarded_footage_list?.length || 0}`
          )
          console.log(
            `- 备选素材数量: ${results.alternative_footage_list?.length || 0}`
          )

          // 显示废弃素材原因
          if (
            results.discarded_footage_list &&
            results.discarded_footage_list.length > 0
          ) {
            console.log('- 废弃素材原因:')
            results.discarded_footage_list
              .slice(0, 3)
              .forEach((item, index) => {
                console.log(`  ${index + 1}. ${item.clip_id}: ${item.reason}`)
              })
          }
        }

        // 制作建议
        if (
          plan.production_suggestions &&
          plan.production_suggestions.length > 0
        ) {
          console.log('')
          console.log('💡 制作建议:')
          console.log(`- 建议数量: ${plan.production_suggestions.length}`)
          plan.production_suggestions
            .slice(0, 3)
            .forEach((suggestion, index) => {
              console.log(
                `  ${index + 1}. ${
                  suggestion.suggestion_type
                }: ${suggestion.description?.substring(0, 60)}...`
              )
            })
        }
      }
    }

    console.log('')
    console.log('📄 完整响应数据:')
    console.log(JSON.stringify(responseData, null, 2))
  } catch (error) {
    console.error('❌ API调用失败:')
    console.error('错误类型:', error.constructor.name)
    console.error('错误消息:', error.message)

    if (error.cause) {
      console.error('错误原因:', error.cause)
    }

    console.log('')
    console.log('🔧 可能的解决方案:')
    console.log('1. 检查网络连接')
    console.log('2. 验证API地址是否正确')
    console.log('3. 确认项目ID格式是否正确')
    console.log('4. 检查API服务是否正常运行')

    process.exit(1)
  }
}

// 验证项目ID格式
function validateProjectId(projectId) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(projectId)
}

// 主函数
async function main() {
  console.log('🧪 AI剪辑计划API测试工具')
  console.log('================================')
  console.log('')

  // 验证项目ID
  if (!validateProjectId(TEST_PROJECT_ID)) {
    console.error('❌ 测试项目ID格式无效')
    process.exit(1)
  }

  await testAIEditingPlanAPI()

  console.log('')
  console.log('🎉 测试完成!')
}

// 运行测试
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 测试脚本执行失败:', error)
    process.exit(1)
  })
}

module.exports = {
  testAIEditingPlanAPI,
  validateProjectId,
}
