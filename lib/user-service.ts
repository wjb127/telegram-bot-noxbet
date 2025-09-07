import { supabase } from './supabase'

export interface TelegramUser {
  telegram_id: number
  username?: string
  first_name: string
  last_name?: string
  language_code?: string
  is_bot: boolean
  is_premium?: boolean
}

// 사용자 조회 또는 생성 (Upsert)
interface TelegramUserInput {
  id: number
  username?: string
  first_name: string
  last_name?: string
  language_code?: string
  is_bot?: boolean
  is_premium?: boolean
}

export async function getOrCreateUser(telegramUser: TelegramUserInput) {
  const userData: TelegramUser = {
    telegram_id: telegramUser.id,
    username: telegramUser.username,
    first_name: telegramUser.first_name,
    last_name: telegramUser.last_name,
    language_code: telegramUser.language_code,
    is_bot: telegramUser.is_bot || false,
    is_premium: telegramUser.is_premium || false
  }

  try {
    // 사용자 존재 확인
    const { data: existingUser } = await supabase
      .from('kmong_17_users')
      .select('*')
      .eq('telegram_id', userData.telegram_id)
      .single()

    if (existingUser) {
      // 기존 사용자 업데이트 (최근 활동 시간 갱신)
      const { data } = await supabase
        .from('kmong_17_users')
        .update({
          ...userData,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('telegram_id', userData.telegram_id)
        .select()
        .single()

      return { user: data, isNew: false }
    } else {
      // 새 사용자 생성
      const { data } = await supabase
        .from('kmong_17_users')
        .insert([userData])
        .select()
        .single()

      return { user: data, isNew: true }
    }
  } catch (error) {
    console.error('Error in getOrCreateUser:', error)
    return { user: null, isNew: false, error }
  }
}

// 메시지 로그 저장
export async function logMessage(
  userId: number,
  messageText: string,
  messageType: string,
  chatId: number
) {
  try {
    const { error } = await supabase
      .from('kmong_17_messages')
      .insert({
        user_id: userId,
        message_text: messageText,
        message_type: messageType,
        chat_id: chatId
      })

    if (error) throw error
  } catch (error) {
    console.error('Error logging message:', error)
  }
}

// 사용자 설정 저장
export async function saveUserSetting(userId: number, key: string, value: unknown) {
  try {
    const { error } = await supabase
      .from('kmong_17_user_settings')
      .upsert({
        user_id: userId,
        key,
        value,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error saving setting:', error)
    return { success: false, error }
  }
}

// 사용자 설정 조회
export async function getUserSetting(userId: number, key: string) {
  try {
    const { data, error } = await supabase
      .from('kmong_17_user_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .single()

    if (error) throw error
    return data?.value
  } catch (error) {
    console.error('Error getting setting:', error)
    return null
  }
}

// 모든 사용자 설정 조회
export async function getAllUserSettings(userId: number) {
  try {
    const { data, error } = await supabase
      .from('kmong_17_user_settings')
      .select('key, value')
      .eq('user_id', userId)

    if (error) throw error
    
    // key-value 객체로 변환
    const settings: Record<string, unknown> = {}
    data?.forEach(item => {
      settings[item.key] = item.value
    })
    
    return settings
  } catch (error) {
    console.error('Error getting all settings:', error)
    return {}
  }
}

// 사용자 상태 저장 (대화 컨텍스트)
export async function saveUserState(userId: number, state: string, data?: unknown) {
  try {
    const { error } = await supabase
      .from('kmong_17_user_states')
      .upsert({
        user_id: userId,
        current_state: state,
        state_data: data,
        updated_at: new Date().toISOString()
      })

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error saving state:', error)
    return { success: false, error }
  }
}

// 사용자 상태 조회
export async function getUserState(userId: number) {
  try {
    const { data, error } = await supabase
      .from('kmong_17_user_states')
      .select('current_state, state_data')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting state:', error)
    return null
  }
}

// 사용자 통계 조회
export async function getUserStats(userId: number) {
  try {
    // 총 메시지 수
    const { count: messageCount } = await supabase
      .from('kmong_17_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    // 사용자 정보
    const { data: userData } = await supabase
      .from('kmong_17_users')
      .select('created_at, last_active_at')
      .eq('telegram_id', userId)
      .single()

    // 최근 명령어
    const { data: recentCommands } = await supabase
      .from('kmong_17_messages')
      .select('message_text, created_at')
      .eq('user_id', userId)
      .eq('message_type', 'command')
      .order('created_at', { ascending: false })
      .limit(5)

    return {
      messageCount: messageCount || 0,
      memberSince: userData?.created_at,
      lastActive: userData?.last_active_at,
      recentCommands: recentCommands || []
    }
  } catch (error) {
    console.error('Error getting stats:', error)
    return {
      messageCount: 0,
      memberSince: null,
      lastActive: null,
      recentCommands: []
    }
  }
}

// 사용자 삭제 (GDPR 대응)
export async function deleteUserData(userId: number) {
  try {
    // 모든 관련 데이터 삭제
    await supabase.from('kmong_17_messages').delete().eq('user_id', userId)
    await supabase.from('kmong_17_user_settings').delete().eq('user_id', userId)
    await supabase.from('kmong_17_user_states').delete().eq('user_id', userId)
    await supabase.from('kmong_17_users').delete().eq('telegram_id', userId)

    return { success: true }
  } catch (error) {
    console.error('Error deleting user data:', error)
    return { success: false, error }
  }
}