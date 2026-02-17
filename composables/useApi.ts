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

  const apiFetch = async <T>(url: string, options: Record<string, unknown> = {}) => {
    const authHeaders = getAuthHeaders();
    const headers = {
      ...authHeaders,
      ...options.headers,
    };

    return await $fetch<T>(url, {
      ...options,
      headers,
    });
  };

  return {
    apiFetch,
    getAuthHeaders,
  };
};
