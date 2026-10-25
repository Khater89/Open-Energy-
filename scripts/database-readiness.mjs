const transientCodes = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "57P03",
]);
export function databaseErrorCode(error) {
  const code = error?.code || error?.errors?.find((item) => item.code)?.code;
  return typeof code === "string" && /^[A-Z0-9_]+$/.test(code)
    ? code
    : "UNKNOWN";
}
export async function connectWhenReady(
  connect,
  {
    timeoutMs = 60000,
    delayMs = 3000,
    now = Date.now,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    onRetry = () => {},
  } = {},
) {
  const deadline = now() + timeoutMs;
  while (true) {
    try {
      return await connect();
    } catch (error) {
      const code = databaseErrorCode(error);
      const remaining = deadline - now();
      if (!transientCodes.has(code) || remaining <= 0) throw error;
      onRetry(code);
      await sleep(Math.min(delayMs, remaining));
      if (now() >= deadline) throw error;
    }
  }
}
