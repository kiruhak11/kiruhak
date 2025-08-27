export const useApi = () => {
  const getAuthHeaders = () => {
    if (process.client) {
      const token = localStorage.getItem("auth_token");
      if (token) {
        return {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
      }
    }
    return {
      "Content-Type": "application/json",
    };
  };

  const apiFetch = async (url: string, options: any = {}) => {
    const authHeaders = getAuthHeaders();
    const headers = {
      ...authHeaders,
      ...options.headers,
    };

    console.log("🔐 useApi: Отправка запроса", {
      url,
      headers: {
        ...headers,
        Authorization: headers.Authorization ? "Bearer ***" : undefined,
      },
      hasAuth: !!headers.Authorization,
      tokenLength: headers.Authorization ? headers.Authorization.length : 0,
    });

    return await $fetch(url, {
      ...options,
      headers,
    });
  };

  return {
    apiFetch,
    getAuthHeaders,
  };
};
