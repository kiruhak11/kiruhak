import {
  assertProductionAuthTokenSecret,
  resolveAuthTokenSecret,
} from "../utils/security-config";

export default defineNitroPlugin(() => {
  const config = useRuntimeConfig();
  const secret = resolveAuthTokenSecret(
    process.env,
    process.env.NODE_ENV,
    String(config.authTokenSecret || "")
  );

  assertProductionAuthTokenSecret(secret);
});
