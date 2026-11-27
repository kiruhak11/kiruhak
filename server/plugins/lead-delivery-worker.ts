import { deliverQueuedLead, recoverLeadQueue } from "../utils/lead-queue";
import { prisma } from "../utils/prisma";
import { getTelegramBotToken } from "../utils/telegram-config";

export default defineNitroPlugin((nitroApp) => {
  let running: Promise<void> | undefined;
  let warnedUnavailable = false;
  let reportedReady = false;
  let warnedSenderConfig = false;
  let lastFingerprintCleanupAt = 0;

  const tick = () => {
    if (running) return;

    running = (async () => {
      await recoverLeadQueue();

      if (Date.now() - lastFingerprintCleanupAt >= 60 * 60 * 1e3) {
        await prisma.$executeRaw`
          UPDATE lead_deliveries SET client_fingerprint = NULL
          WHERE client_fingerprint IS NOT NULL AND created_at < NOW() - INTERVAL '24 hours'
        `;
        lastFingerprintCleanupAt = Date.now();
      }

      const token = getTelegramBotToken();
      const config = useRuntimeConfig();
      const recipient = String(
        config.adminTelegramId || process.env.NUXT_ADMIN_TELEGRAM_ID || process.env.ADMIN_TELEGRAM_ID || ""
      ).trim();

      if (token && /^\d{1,24}$/.test(recipient)) {
        warnedSenderConfig = false;
        await deliverQueuedLead(recipient, token);
        if (!reportedReady) {
          console.info("[lead-delivery] worker started; queue check completed");
          reportedReady = true;
        }
      } else if (!warnedSenderConfig) {
        console.error("[lead-delivery] sender configuration unavailable; queued requests remain persisted");
        warnedSenderConfig = true;
      }
      warnedUnavailable = false;
    })().catch(() => {
      if (!warnedUnavailable) {
        console.error("[lead-delivery] worker unavailable; queued requests remain persisted");
        warnedUnavailable = true;
      }
    }).finally(() => {
      running = undefined;
    });
  };

  const timer = setInterval(tick, 10_000);
  const firstRun = setTimeout(tick, 2_000);
  timer.unref?.();
  firstRun.unref?.();

  nitroApp.hooks.hook("close", async () => {
    clearTimeout(firstRun);
    clearInterval(timer);
    await running;
  });
});
