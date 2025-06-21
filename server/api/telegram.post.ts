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
        parse_mode: 'HTML'
      }
    })
    
    return {
      success: true,
      data: response
    }
    
  } catch (error) {
    console.error('Telegram API error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send message to Telegram'
    })
  }
})