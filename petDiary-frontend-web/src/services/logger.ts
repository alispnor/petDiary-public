/**
 * Logger estruturado do frontend.
 *
 * - DEV: imprime no console (legível) com level/event/context
 * - PROD: envia error/warn para Sentry (se DSN configurado)
 *
 * Uso:
 *   logger.info("event_name", { user_id, ... });
 *   logger.error("event_name", { error_code, ... });
 */

type Level = "debug" | "info" | "warn" | "error";

interface LogEntry {
  ts: string;
  level: Level;
  event: string;
  [key: string]: unknown;
}

const isDev = import.meta.env.DEV;

function emit(level: Level, event: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  if (isDev) {
    const fn = console[level === "debug" ? "log" : level];
    fn(`[${level.toUpperCase()}] ${event}`, context);
  } else if (level === "error" || level === "warn") {
    // Em produção, envia para Sentry se configurado.
    // Stub: integração com @sentry/react acontece quando o DSN vier.
    // window.Sentry?.captureMessage?.(event, { level, extra: context });
    console[level](JSON.stringify(entry));
  }
}

export const logger = {
  debug: (event: string, ctx?: Record<string, unknown>) => emit("debug", event, ctx),
  info: (event: string, ctx?: Record<string, unknown>) => emit("info", event, ctx),
  warn: (event: string, ctx?: Record<string, unknown>) => emit("warn", event, ctx),
  error: (event: string, ctx?: Record<string, unknown>) => emit("error", event, ctx),
};

export default logger;
