export const useApi = () => {
  const apiFetch = async (url: string, options: any = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Добавляем токен если он есть
    let currentToken = null;
    if (process.client) {
      currentToken = localStorage.getItem("auth_token");
    }

    if (currentToken) {
      headers.Authorization = `Bearer ${currentToken}`;
    }

    console.log("🔐 useApi: Отправка запроса", {
      url,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "Bearer ***" : undefined,
      },
      token: currentToken ? currentToken.substring(0, 50) + "..." : "null",
      tokenLength: currentToken ? currentToken.length : 0,
    });

    return await $fetch(url, {
      ...options,
      headers,
    });
  };

  return {
    apiFetch,
  };
};
