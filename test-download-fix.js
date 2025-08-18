// 测试下载API修复
// 这个脚本测试修复后的下载API是否正常工作

const testDownloadAPI = async () => {
  console.log('🧪 测试下载API修复...\n');

  // 测试无效ID的情况
  console.log('1️⃣ 测试无效ID处理...');
  try {
    const response = await fetch('http://localhost:3000/api/export/download/invalid-id');
    const result = await response.json();
    console.log(`   状态码: ${response.status}`);
    console.log(`   响应: ${JSON.stringify(result)}`);
    
    if (response.status === 404 && result.error === 'File not found or expired') {
      console.log('   ✅ 无效ID处理正常\n');
    } else {
      console.log('   ❌ 无效ID处理异常\n');
    }
  } catch (error) {
    console.log(`   ❌ 请求失败: ${error.message}\n`);
  }

  // 测试HEAD请求
  console.log('2️⃣ 测试HEAD请求...');
  try {
    const response = await fetch('http://localhost:3000/api/export/download/test-id', {
      method: 'HEAD'
    });
    console.log(`   状态码: ${response.status}`);
    
    if (response.status === 404) {
      console.log('   ✅ HEAD请求处理正常\n');
    } else {
      console.log('   ❌ HEAD请求处理异常\n');
    }
  } catch (error) {
    console.log(`   ❌ HEAD请求失败: ${error.message}\n`);
  }

  console.log('🎉 下载API修复测试完成！');
  console.log('💡 现在可以在浏览器中重新测试导出功能了');
};

testDownloadAPI().catch(console.error);
