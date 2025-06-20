import { z } from "zod";
import { Logger } from "./logger.js";

const logger = Logger.getInstance();

export const ConfigSchema = z
  .object({
    // GitHub Authentication
    GITHUB_TOKEN: z.string().optional(),
    GITHUB_APP_ID: z.string().optional(),
    GITHUB_PRIVATE_KEY: z.string().optional(),
    GITHUB_INSTALLATION_ID: z.string().optional(),

    // Server Configuration
    LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
    API_TIMEOUT: z
      .string()
      .transform((val) => parseInt(val))
      .default("30000"),
    CACHE_TTL: z
      .string()
      .transform((val) => parseInt(val))
      .default("300"), // 5 minutes

    // Rate Limiting
    RATE_LIMIT_ENABLED: z
      .string()
      .transform((val) => val === "true")
      .default("true"),
    RATE_LIMIT_MAX_REQUESTS: z
      .string()
      .transform((val) => parseInt(val))
      .default("100"),
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .transform((val) => parseInt(val))
      .default("60000"), // 1 minute
  })
  .refine(
    (data) => {
      // Must have either token OR app credentials
      const hasToken = !!data.GITHUB_TOKEN;
      const hasAppCreds = !!(
        data.GITHUB_APP_ID &&
        data.GITHUB_PRIVATE_KEY &&
        data.GITHUB_INSTALLATION_ID
      );
      return hasToken || hasAppCreds;
    },
    {
      message:
        "Either GITHUB_TOKEN or complete GitHub App credentials (GITHUB_APP_ID, GITHUB_PRIVATE_KEY, GITHUB_INSTALLATION_ID) must be provided",
    },
  );

export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(): Config {
  try {
    logger.info("Validating configuration...");

    const config = ConfigSchema.parse(process.env);

    logger.info("Configuration validated successfully", {
      hasToken: !!config.GITHUB_TOKEN,
      hasAppCreds: !!(
        config.GITHUB_APP_ID &&
        config.GITHUB_PRIVATE_KEY &&
        config.GITHUB_INSTALLATION_ID
      ),
      logLevel: config.LOG_LEVEL,
      apiTimeout: config.API_TIMEOUT,
      cacheTtl: config.CACHE_TTL,
    });

    return config;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Configuration validation failed", { error: errorMessage });
    throw new Error(`Configuration validation failed: ${errorMessage}`);
  }
}

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}
