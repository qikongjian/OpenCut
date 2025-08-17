// 调试缩略图生成问题
console.log('🔍 调试缩略图生成问题')

// 测试默认缩略图生成
function testDefaultThumbnailGeneration() {
  console.log('🧪 测试默认缩略图生成...')

  function generateDefaultVideoThumbnail(index = 0) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjNGE1NTY4Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZpbGw9IiNmZmYiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+VmlkZW88L3RleHQ+Cjwvc3ZnPg=='
    }

    canvas.width = 320
    canvas.height = 180

    const colors = [
      '#4a5568', // 灰色
      '#4c51bf', // 紫色
      '#059669', // 绿色
      '#dc2626', // 红色
      '#d97706', // 橙色
      '#0891b2', // 青色
    ]

    const bgColor = colors[index % colors.length]

    // 绘制默认背景
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 绘制播放图标
    ctx.fillStyle = '#ffffff'
    ctx.font = '48px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('▶', canvas.width / 2, canvas.height / 2)

    // 添加文字和片段编号
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px Arial'
    ctx.fillText(
      `AI剪辑 ${index + 1}`,
      canvas.width / 2,
      canvas.height / 2 + 40
    )

    return canvas.toDataURL('image/jpeg', 0.8)
  }

  // 测试生成多个缩略图
  for (let i = 0; i < 5; i++) {
    const thumbnail = generateDefaultVideoThumbnail(i)
    console.log(`✅ 默认缩略图 ${i + 1}:`, {
      length: thumbnail.length,
      prefix: thumbnail.substring(0, 50),
      isValid: thumbnail.startsWith('data:image/'),
    })
  }
}

// 测试媒体项查找
function testMediaItemLookup() {
  console.log('🧪 测试媒体项查找...')

  // 模拟媒体项数据
  const mockMediaItems = [
    {
      id: 'original-video-clip-001-123456-0',
      name: '原视频-clip-001',
      type: 'video',
      url: 'https://example.com/video1.mp4',
      thumbnailUrl: 'data:image/jpeg;base64,test123',
      duration: 120,
    },
    {
      id: 'original-video-clip-002-123456-1',
      name: '原视频-clip-002',
      type: 'video',
      url: 'https://example.com/video2.mp4',
      thumbnailUrl: 'data:image/jpeg;base64,test456',
      duration: 90,
    },
  ]

  // 模拟时间轴元素
  const mockTimelineElements = [
    {
      id: 'element-1',
      name: '原视频-clip-001',
      mediaId: 'original-video-clip-001-123456-0',
      type: 'media',
    },
    {
      id: 'element-2',
      name: '原视频-clip-002',
      mediaId: 'original-video-clip-002-123456-1',
      type: 'media',
    },
  ]

  // 测试查找逻辑
  mockTimelineElements.forEach((element) => {
    const mediaItem = mockMediaItems.find((item) => item.id === element.mediaId)
    console.log(`🔍 元素 ${element.id}:`, {
      elementName: element.name,
      mediaId: element.mediaId,
      found: !!mediaItem,
      mediaName: mediaItem?.name,
      hasThumbnail: !!mediaItem?.thumbnailUrl,
      thumbnailLength: mediaItem?.thumbnailUrl?.length || 0,
    })
  })
}

// 运行测试
testDefaultThumbnailGeneration()
testMediaItemLookup()

console.log('🎯 调试建议:')
console.log('1. 检查浏览器控制台是否有缩略图生成相关的错误')
console.log('2. 确认媒体项是否正确添加到媒体库')
console.log('3. 验证时间轴元素的mediaId是否与媒体项的id匹配')
console.log('4. 检查缩略图URL是否为有效的data URL')
console.log('5. 确认时间轴元素渲染时能找到对应的媒体项')

console.log('\n🚀 测试步骤:')
console.log('1. 打开浏览器开发者工具')
console.log('2. 创建新项目')
console.log("3. 点击'生成AI剪辑计划'")
console.log("4. 点击'显示完整原视频'")
console.log('5. 观察控制台日志，查找缩略图生成和媒体项相关的信息')
