import { defineEventHandler, getRequestHeader, readBody } from "h3";

import { recordAnalyticsPageView } from "./analytics";
import { resolveClientIp } from "./client-ip";

export const analyticsTrackHandler = defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    return await recordAnalyticsPageView({
      siteId: body?.siteId,
      page: body?.page,
      referrer: body?.referrer,
      userAgent: body?.userAgent,
      event: body?.event,
      origin: getRequestHeader(event, "origin"),
      ip: resolveClientIp(event).address,
    });
  } catch (error) {
    console.error("Error tracking visit:", error);
    return { success: false, error: "Failed to track visit" };
  }
});
