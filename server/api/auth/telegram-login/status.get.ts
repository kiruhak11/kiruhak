import { getTelegramLoginMode, isTelegramLoginEnabled } from "../../../utils/telegram-login";

export default defineEventHandler((event) => {
  setResponseHeader(event, "Cache-Control", "no-store");

  const config = useRuntimeConfig();
  const mode = getTelegramLoginMode(config.telegramLoginMode);

  return {
    enabled: isTelegramLoginEnabled(mode),
    ownerCanary: mode === "owner_canary",
  };
});
