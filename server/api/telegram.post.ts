export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const { phone, message, discount } = body;

  if (!phone) {
    throw createError({
      statusCode: 400,
      statusMessage: "Phone number is required",
    });
  }

  const telegramMessage = `🎯 Новая заявка со скидкой!\n\n📱 Телефон: ${phone}\n💰 Скидка: ${discount}%\n\n💭 Сообщение:\n${
    message || "Не указано"
  }`;

  if (!config.telegramToken || !config.telegramChatId) {
    throw createError({
      statusCode: 500,
      statusMessage: "Telegram integration is not configured",
    });
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${config.telegramToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: config.telegramChatId,
          text: telegramMessage,
          parse_mode: "HTML",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to send message to Telegram");
    }

    return {
      status: "success",
      message: "Message sent successfully",
    };
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to send message",
    });
  }
});
