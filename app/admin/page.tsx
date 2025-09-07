'use client'

import { useState } from 'react'

export default function AdminPage() {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState<string>('')

  const setupWebhook = async () => {
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await response.json()
      setStatus(data.success ? '✅ Webhook 설정 완료' : '❌ 설정 실패')
    } catch {
      setStatus('❌ 오류 발생')
    }
  }

  const removeWebhook = async () => {
    try {
      const response = await fetch('/api/telegram/setup', {
        method: 'DELETE'
      })
      const data = await response.json()
      setStatus(data.success ? '✅ Webhook 제거 완료' : '❌ 제거 실패')
    } catch {
      setStatus('❌ 오류 발생')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">텔레그램 봇 관리</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vercel URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={setupWebhook}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
            >
              Webhook 설정
            </button>
            <button
              onClick={removeWebhook}
              className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Webhook 제거
            </button>
          </div>
          
          {status && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md">
              {status}
            </div>
          )}
        </div>
        
        <div className="mt-8 text-sm text-gray-600">
          <h2 className="font-semibold mb-2">사용 방법:</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Vercel에 배포</li>
            <li>배포된 URL 입력</li>
            <li>Webhook 설정 클릭</li>
            <li>텔레그램에서 봇 테스트</li>
          </ol>
        </div>
      </div>
    </div>
  )
}