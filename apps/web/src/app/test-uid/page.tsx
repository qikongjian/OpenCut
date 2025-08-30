"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { SmartChatTrigger } from "@/components/smart-chat-trigger";

export default function TestUidPage() {
  const searchParams = useSearchParams();
  const uid = searchParams.get('uid');
  const user_id = searchParams.get('user_id');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">UID参数测试页面</h1>
        
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">当前URL参数</h2>
          <div className="space-y-2">
            <p><strong>uid:</strong> {uid || '未设置'}</p>
            <p><strong>user_id:</strong> {user_id || '未设置'}</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">测试说明</h2>
          <p className="text-gray-300 mb-2">
            1. 在URL中添加 <code className="bg-gray-700 px-2 py-1 rounded">?uid=11111</code> 来测试uid参数
          </p>
          <p className="text-gray-300 mb-2">
            2. 在URL中添加 <code className="bg-gray-700 px-2 py-1 rounded">?user_id=22222</code> 来测试user_id参数
          </p>
          <p className="text-gray-300 mb-2">
            3. 同时设置两个参数时，uid优先级更高
          </p>
          <p className="text-gray-300">
            4. 点击右下角的聊天按钮，检查控制台日志确认参数传递正确
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">测试链接</h2>
          <div className="space-y-2">
            <a 
              href="/test-uid?uid=11111" 
              className="block text-blue-400 hover:text-blue-300 underline"
            >
              测试 uid=11111
            </a>
            <a 
              href="/test-uid?user_id=22222" 
              className="block text-blue-400 hover:text-blue-300 underline"
            >
              测试 user_id=22222
            </a>
            <a 
              href="/test-uid?uid=11111&user_id=22222" 
              className="block text-blue-400 hover:text-blue-300 underline"
            >
              测试 uid=11111 和 user_id=22222 (uid优先级更高)
            </a>
          </div>
        </div>
      </div>

      {/* 聊天触发按钮 */}
      <SmartChatTrigger userId={1} />
    </div>
  );
}
