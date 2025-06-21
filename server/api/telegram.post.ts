export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { message } = body
    
    if (!message) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Message is required'
      })
    }
    
    const botToken = '6122558496:AAEXwnP3E4uIk5sSSNzD-13vQK6A4ybCBFI'
    const chatId = '502773482'
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`
    
    const response = await $fetch(telegramUrl, {
      method: 'POST',
      body: {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      }
    })
    
    console.log('Telegram message sent successfully:', response)
    
    return {
      success: true,
      data: response,
      message: 'Message sent successfully'
    }
    
  } catch (error: any) {
    console.error('Telegram API error:', error)
    
    // Проверяем, является ли ошибка связанной с Telegram API
    if (error.statusCode === 400) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid message format'
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send message to Telegram'
    })
  }
})