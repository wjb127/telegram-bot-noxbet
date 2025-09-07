import { NextRequest, NextResponse } from 'next/server'
import { TelegramUpdate, sendMessage, sendInlineKeyboard, answerCallbackQuery } from '@/lib/telegram'
import { 
  getOrCreateUser, 
  logMessage, 
  getUserStats,
  saveUserSetting,
  getUserSetting,
  getAllUserSettings,
  saveUserState,
  getUserState,
  deleteUserData
} from '@/lib/user-service'

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
  const telegramUser = message.from
  
  // 사용자 자동 등록/업데이트
  const { isNew } = await getOrCreateUser(telegramUser)
  
  // 신규 사용자 환영 메시지
  if (isNew) {
    await sendMessage(chatId, `🎉 환영합니다 ${telegramUser.first_name}님! 처음 오셨네요!`)
  }
  
  // 메시지 로깅
  const messageType = text?.startsWith('/') ? 'command' : 'text'
  await logMessage(telegramUser.id, text || '', messageType, chatId)
  
  // 사용자 상태 확인
  const userState = await getUserState(telegramUser.id)
  
  // 상태 기반 처리
  if (userState?.current_state === 'waiting_feedback') {
    await handleFeedback(chatId, telegramUser.id, text)
    return
  }
  
  if (userState?.current_state === 'waiting_name') {
    await handleNameInput(chatId, telegramUser.id, text)
    return
  }
  
  // 일반 명령어 처리
  if (!text) return
  
  if (text === '/start') {
    const welcomeMessage = `
👋 <b>안녕하세요 ${telegramUser.first_name}님!</b>

이 봇은 <b>로그인/회원가입 없이</b> 사용 가능합니다.
텔레그램 ID로 자동 인식됩니다.

<b>사용 가능한 명령어:</b>
/profile - 내 프로필
/settings - 설정 관리
/stats - 사용 통계
/privacy - 개인정보 관리
/help - 도움말
    `
    await sendMessage(chatId, welcomeMessage)
    
  } else if (text === '/profile') {
    const stats = await getUserStats(telegramUser.id)
    const settings = await getAllUserSettings(telegramUser.id)
    
    const profileMessage = `
👤 <b>프로필</b>

<b>기본 정보:</b>
• ID: <code>${telegramUser.id}</code>
• 이름: ${telegramUser.first_name} ${telegramUser.last_name || ''}
• 사용자명: ${telegramUser.username ? '@' + telegramUser.username : '없음'}
• 언어: ${telegramUser.language_code || '미설정'}

<b>활동 정보:</b>
• 총 메시지: ${stats.messageCount}개
• 가입일: ${stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('ko-KR') : 'N/A'}
• 마지막 활동: ${stats.lastActive ? new Date(stats.lastActive).toLocaleDateString('ko-KR') : 'N/A'}

<b>설정:</b>
• 알림: ${settings.notifications !== false ? '켜짐' : '꺼짐'}
• 언어: ${settings.language || '한국어'}
• 닉네임: ${settings.nickname || '미설정'}
    `
    await sendMessage(chatId, profileMessage)
    
  } else if (text === '/settings') {
    const buttons = [
      [
        { text: '🔔 알림 설정', callback_data: 'settings_notifications' },
        { text: '🌐 언어 설정', callback_data: 'settings_language' }
      ],
      [
        { text: '✏️ 닉네임 변경', callback_data: 'settings_nickname' },
        { text: '🎨 테마 설정', callback_data: 'settings_theme' }
      ],
      [
        { text: '↩️ 설정 초기화', callback_data: 'settings_reset' }
      ]
    ]
    await sendInlineKeyboard(chatId, '⚙️ 설정을 선택하세요:', buttons)
    
  } else if (text === '/stats') {
    const stats = await getUserStats(telegramUser.id)
    
    let recentCommandsList = '없음'
    if (stats.recentCommands.length > 0) {
      recentCommandsList = stats.recentCommands
        .map((cmd) => `• ${cmd.message_text}`)
        .join('\n')
    }
    
    const statsMessage = `
📊 <b>사용 통계</b>

<b>활동 요약:</b>
• 총 메시지 수: ${stats.messageCount}개
• 가입일: ${stats.memberSince ? new Date(stats.memberSince).toLocaleDateString('ko-KR') : 'N/A'}
• 활동 기간: ${calculateDaysSince(stats.memberSince)}일

<b>최근 명령어:</b>
${recentCommandsList}
    `
    await sendMessage(chatId, statsMessage)
    
  } else if (text === '/privacy') {
    const buttons = [
      [
        { text: '📥 내 데이터 다운로드', callback_data: 'privacy_download' }
      ],
      [
        { text: '🗑️ 모든 데이터 삭제', callback_data: 'privacy_delete' }
      ],
      [
        { text: '❌ 취소', callback_data: 'privacy_cancel' }
      ]
    ]
    
    const privacyMessage = `
🔐 <b>개인정보 관리</b>

저장된 데이터:
• 프로필 정보 (이름, ID)
• 메시지 기록
• 설정값
• 사용 통계

GDPR 준수를 위해 언제든 데이터를 다운로드하거나 삭제할 수 있습니다.
    `
    await sendInlineKeyboard(chatId, privacyMessage, buttons)
    
  } else if (text === '/feedback') {
    await saveUserState(telegramUser.id, 'waiting_feedback')
    await sendMessage(chatId, '💬 피드백을 입력해주세요:')
    
  } else if (text.startsWith('/')) {
    await sendMessage(chatId, '❌ 알 수 없는 명령어입니다. /help를 입력해보세요.')
    
  } else {
    // 일반 대화 처리
    await sendMessage(chatId, `메시지를 받았습니다: "${text}"`)
  }
}

async function handleCallbackQuery(callbackQuery: NonNullable<TelegramUpdate['callback_query']>) {
  const callbackId = callbackQuery.id
  const chatId = callbackQuery.message?.chat.id
  const data = callbackQuery.data
  const userId = callbackQuery.from.id
  
  // 설정 관련 콜백
  if (data === 'settings_notifications') {
    const current = await getUserSetting(userId, 'notifications')
    const newValue = current === false ? true : false
    await saveUserSetting(userId, 'notifications', newValue)
    await answerCallbackQuery(callbackId, `알림이 ${newValue ? '켜졌습니다' : '꺼졌습니다'}`)
    await sendMessage(chatId, `🔔 알림이 ${newValue ? '켜졌습니다' : '꺼졌습니다'}`)
    
  } else if (data === 'settings_language') {
    const buttons = [
      [{ text: '🇰🇷 한국어', callback_data: 'lang_ko' }],
      [{ text: '🇺🇸 English', callback_data: 'lang_en' }],
      [{ text: '🇯🇵 日本語', callback_data: 'lang_ja' }]
    ]
    await sendInlineKeyboard(chatId, '언어를 선택하세요:', buttons)
    await answerCallbackQuery(callbackId)
    
  } else if (data.startsWith('lang_')) {
    const lang = data.replace('lang_', '')
    await saveUserSetting(userId, 'language', lang)
    const langNames: Record<string, string> = {
      ko: '한국어',
      en: 'English',
      ja: '日本語'
    }
    await answerCallbackQuery(callbackId, `언어가 ${langNames[lang]}로 변경되었습니다`)
    await sendMessage(chatId, `✅ 언어가 ${langNames[lang]}로 설정되었습니다`)
    
  } else if (data === 'settings_nickname') {
    await saveUserState(userId, 'waiting_name')
    await sendMessage(chatId, '✏️ 새로운 닉네임을 입력해주세요:')
    await answerCallbackQuery(callbackId)
    
  } else if (data === 'settings_theme') {
    const buttons = [
      [{ text: '☀️ 라이트', callback_data: 'theme_light' }],
      [{ text: '🌙 다크', callback_data: 'theme_dark' }],
      [{ text: '🌈 컬러풀', callback_data: 'theme_colorful' }]
    ]
    await sendInlineKeyboard(chatId, '테마를 선택하세요:', buttons)
    await answerCallbackQuery(callbackId)
    
  } else if (data.startsWith('theme_')) {
    const theme = data.replace('theme_', '')
    await saveUserSetting(userId, 'theme', theme)
    await answerCallbackQuery(callbackId, `테마가 변경되었습니다`)
    await sendMessage(chatId, `✅ 테마가 설정되었습니다`)
    
  } else if (data === 'settings_reset') {
    // 모든 설정 초기화
    await saveUserSetting(userId, 'notifications', true)
    await saveUserSetting(userId, 'language', 'ko')
    await saveUserSetting(userId, 'nickname', null)
    await saveUserSetting(userId, 'theme', 'light')
    await answerCallbackQuery(callbackId, '설정이 초기화되었습니다')
    await sendMessage(chatId, '✅ 모든 설정이 초기화되었습니다')
    
  } else if (data === 'privacy_download') {
    await answerCallbackQuery(callbackId, '데이터 준비 중...')
    // 실제로는 데이터를 JSON으로 내보내기
    await sendMessage(chatId, '📥 데이터 다운로드 기능은 준비 중입니다')
    
  } else if (data === 'privacy_delete') {
    const buttons = [
      [{ text: '⚠️ 정말 삭제', callback_data: 'privacy_delete_confirm' }],
      [{ text: '❌ 취소', callback_data: 'privacy_cancel' }]
    ]
    await sendInlineKeyboard(chatId, '⚠️ 정말로 모든 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!', buttons)
    await answerCallbackQuery(callbackId)
    
  } else if (data === 'privacy_delete_confirm') {
    await deleteUserData(userId)
    await answerCallbackQuery(callbackId, '데이터가 삭제되었습니다')
    await sendMessage(chatId, '✅ 모든 데이터가 삭제되었습니다. 안녕히 가세요!')
    
  } else if (data === 'privacy_cancel') {
    await answerCallbackQuery(callbackId, '취소되었습니다')
    await sendMessage(chatId, '❌ 작업이 취소되었습니다')
  }
}

async function handleFeedback(chatId: number, userId: number, text: string) {
  // 피드백 저장
  await saveUserSetting(userId, `feedback_${Date.now()}`, text)
  await saveUserState(userId, 'idle')
  await sendMessage(chatId, '✅ 피드백이 저장되었습니다. 감사합니다!')
}

async function handleNameInput(chatId: number, userId: number, text: string) {
  // 닉네임 저장
  await saveUserSetting(userId, 'nickname', text)
  await saveUserState(userId, 'idle')
  await sendMessage(chatId, `✅ 닉네임이 "${text}"로 설정되었습니다!`)
}

function calculateDaysSince(dateString: string | null): number {
  if (!dateString) return 0
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export async function GET() {
  return NextResponse.json({ 
    status: 'Telegram Bot Webhook V2 (No Auth)',
    timestamp: new Date().toISOString()
  })
}