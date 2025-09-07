import axios from 'axios'

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      type: string
    }
    date: number
    text?: string
    entities?: Array<{
      offset: number
      length: number
      type: string
    }>
  }
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    message?: {
      message_id: number
      chat: {
        id: number
      }
    }
    data?: string
  }
}

export async function sendMessage(chatId: number, text: string, options?: any) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options
    })
    return response.data
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

export async function sendInlineKeyboard(
  chatId: number, 
  text: string, 
  buttons: Array<Array<{text: string, callback_data?: string, url?: string}>>
) {
  return sendMessage(chatId, text, {
    reply_markup: {
      inline_keyboard: buttons
    }
  })
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text
    })
  } catch (error) {
    console.error('Error answering callback query:', error)
  }
}

export async function setWebhook(url: string) {
  try {
    const response = await axios.post(`${TELEGRAM_API}/setWebhook`, {
      url
    })
    return response.data
  } catch (error) {
    console.error('Error setting webhook:', error)
    throw error
  }
}

export async function deleteWebhook() {
  try {
    const response = await axios.post(`${TELEGRAM_API}/deleteWebhook`)
    return response.data
  } catch (error) {
    console.error('Error deleting webhook:', error)
    throw error
  }
}