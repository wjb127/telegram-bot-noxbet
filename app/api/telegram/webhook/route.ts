import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate, sendMessage, sendInlineKeyboard, answerCallbackQuery } from '@/lib/telegram'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()
    
    if (update.message) {
      await handleMessage(update.message)
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query)
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function handleMessage(message: NonNullable<TelegramUpdate['message']>) {
  const chatId = message.chat.id
  const text = message.text
  const userId = message.from.id
  const username = message.from.username || message.from.first_name
  
  await logUserActivity(userId, username, text || '', 'message')
  
  if (!text) return
  
  if (text === '/start') {
    const welcomeMessage = `
🎉 <b>환영합니다!</b>

저는 Next.js + Vercel + Supabase로 만들어진 서버리스 텔레그램 봇입니다.

<b>사용 가능한 명령어:</b>
/help - 도움말 보기
/info - 내 정보 확인
/stats - 통계 보기
/menu - 메뉴 버튼 보기
    `
    await sendMessage(chatId, welcomeMessage)
    
  } else if (text === '/help') {
    const helpMessage = `
📚 <b>도움말</b>

이 봇은 완전 서버리스로 동작합니다:
• Vercel Edge Functions 사용
• Supabase로 데이터 저장
• 무료 티어로 운영 가능

<b>기술 스택:</b>
• Next.js 14 (App Router)
• TypeScript
• Supabase
• Vercel
    `
    await sendMessage(chatId, helpMessage)
    
  } else if (text === '/info') {
    const infoMessage = `
👤 <b>사용자 정보</b>

ID: <code>${userId}</code>
Username: @${username}
이름: ${message.from.first_name}
${message.from.last_name ? `성: ${message.from.last_name}` : ''}
    `
    await sendMessage(chatId, infoMessage)
    
  } else if (text === '/stats') {
    const stats = await getUserStats(userId)
    const statsMessage = `
📊 <b>통계</b>

총 메시지 수: ${stats.messageCount}
첫 사용일: ${stats.firstSeen}
마지막 사용: ${stats.lastSeen}
    `
    await sendMessage(chatId, statsMessage)
    
  } else if (text === '/menu') {
    const menuButtons = [
      [
        { text: '🌐 GitHub', url: 'https://github.com' },
        { text: '📚 문서', url: 'https://nextjs.org/docs' }
      ],
      [
        { text: '⚙️ 설정', callback_data: 'settings' },
        { text: '📊 대시보드', callback_data: 'dashboard' }
      ],
      [
        { text: '💬 피드백', callback_data: 'feedback' }
      ]
    ]
    await sendInlineKeyboard(chatId, '📱 메뉴를 선택하세요:', menuButtons)
    
  } else if (text.startsWith('/')) {
    await sendMessage(chatId, '❌ 알 수 없는 명령어입니다. /help를 입력해보세요.')
    
  } else {
    await sendMessage(chatId, `메시지를 받았습니다: "${text}"`)
  }
}

async function handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdate['callback_query']>) {
  const callbackId = callbackQuery.id
  const chatId = callbackQuery.message?.chat.id
  const data = callbackQuery.data
  
  if (!chatId) return
  
  if (data === 'settings') {
    await sendMessage(chatId, '⚙️ 설정 메뉴 (개발 중)')
    await answerCallbackQuery(callbackId, '설정 메뉴')
    
  } else if (data === 'dashboard') {
    await sendMessage(chatId, '📊 대시보드 (개발 중)')
    await answerCallbackQuery(callbackId, '대시보드')
    
  } else if (data === 'feedback') {
    await sendMessage(chatId, '💬 피드백을 남겨주세요!')
    await answerCallbackQuery(callbackId, '피드백')
  }
}

async function logUserActivity(userId: number, username: string, text: string, type: string) {
  try {
    const { error } = await supabase
      .from('kmong_17_telegram_logs')
      .insert({
        user_id: userId,
        username,
        message: text,
        type,
        created_at: new Date().toISOString()
      })
    
    if (error) console.error('Supabase error:', error)
  } catch (error) {
    console.error('Failed to log activity:', error)
  }
}

async function getUserStats(userId: number) {
  try {
    const { data, error } = await supabase
      .from('kmong_17_telegram_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error || !data || data.length === 0) {
      return {
        messageCount: 0,
        firstSeen: 'N/A',
        lastSeen: 'N/A'
      }
    }
    
    return {
      messageCount: data.length,
      firstSeen: new Date(data[0].created_at).toLocaleDateString('ko-KR'),
      lastSeen: new Date(data[data.length - 1].created_at).toLocaleDateString('ko-KR')
    }
  } catch (error) {
    console.error('Failed to get stats:', error)
    return {
      messageCount: 0,
      firstSeen: 'N/A',
      lastSeen: 'N/A'
    }
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram Bot Webhook is running',
    timestamp: new Date().toISOString()
  })
}