import { NextRequest, NextResponse } from 'next/server'
import { setWebhook, deleteWebhook } from '@/lib/telegram'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }
    
    const webhookUrl = `${url}/api/telegram/webhook`
    const result = await setWebhook(webhookUrl)
    
    return NextResponse.json({
      success: result.ok,
      webhook_url: webhookUrl,
      result
    })
  } catch (error) {
    console.error('Setup webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to set webhook' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const result = await deleteWebhook()
    
    return NextResponse.json({
      success: result.ok,
      result
    })
  } catch (error) {
    console.error('Delete webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}