import { Logger } from "./logger.js";

const logger = Logger.getInstance();

interface APIError {
  message?: string;
  response?: {
    data?: unknown;
    headers?: Record<string, string>;
  };
  status?: number;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = "GitHubAPIError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public resetTime?: Date,
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export function handleAPIError(error: unknown, operation: string): never {
  const apiError = error as APIError;

  logger.error(`GitHub API error during ${operation}`, {
    error: apiError.message,
    operation,
    response: apiError.response?.data,
    status: apiError.status,
  });

  if (apiError.status === 401) {
    throw new GitHubAPIError(
      "Authentication failed. Please check your GitHub token or app credentials.",
      401,
      apiError.response?.data,
    );
  }

  if (apiError.status === 403) {
    const resetTime = apiError.response?.headers?.["x-ratelimit-reset"];
    if (resetTime) {
      const resetDate = new Date(parseInt(resetTime) * 1000);
      throw new RateLimitError(
        "GitHub API rate limit exceeded. Please try again later.",
        resetDate,
        Math.ceil((resetDate.getTime() - Date.now()) / 1000),
      );
    }
    throw new GitHubAPIError(
      "Access forbidden. Check your permissions for this operation.",
      403,
      apiError.response?.data,
    );
  }

  if (apiError.status === 404) {
    throw new GitHubAPIError(
      "Resource not found. Please check the organization/user name.",
      404,
      apiError.response?.data,
    );
  }

  if (apiError.status && apiError.status >= 500) {
    throw new GitHubAPIError(
      "GitHub API server error. Please try again later.",
      apiError.status,
      apiError.response?.data,
    );
  }

  // Generic error
  throw new GitHubAPIError(
    apiError.message || "Unknown GitHub API error",
    apiError.status,
    apiError.response?.data,
  );
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 1000,
  operationName: string = "operation",
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Attempting ${operationName}`, { attempt, maxRetries });
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        logger.error(`${operationName} failed after ${maxRetries} attempts`, {
          attempts: maxRetries,
          error: lastError.message,
        });
        break;
      }

      // Don't retry on certain errors
      if (
        error instanceof ValidationError ||
        (error instanceof GitHubAPIError &&
          [401, 404].includes(error.statusCode || 0))
      ) {
        logger.debug(`Not retrying ${operationName} due to error type`, {
          error: error.message,
        });
        throw error;
      }

      const delay = backoffMs * Math.pow(2, attempt - 1);
      logger.warn(`${operationName} failed, retrying in ${delay}ms`, {
        attempt,
        delay,
        error: lastError.message,
        maxRetries,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function validateDateString(date: string, fieldName: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ValidationError(
      `${fieldName} must be in YYYY-MM-DD format`,
      fieldName,
    );
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ValidationError(`${fieldName} is not a valid date`, fieldName);
  }
}

export function validateOrganizationName(org: string): void {
  if (!org || typeof org !== "string") {
    throw new ValidationError(
      "Organization name is required and must be a string",
      "org",
    );
  }

  if (org.length < 1 || org.length > 39) {
    throw new ValidationError(
      "Organization name must be between 1 and 39 characters",
      "org",
    );
  }

  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(org)) {
    throw new ValidationError(
      "Organization name contains invalid characters",
      "org",
    );
  }
}

export function validatePaginationParams(page: number, per_page: number): void {
  if (page < 1) {
    throw new ValidationError("Page must be greater than 0", "page");
  }

  if (per_page < 1 || per_page > 100) {
    throw new ValidationError("per_page must be between 1 and 100", "per_page");
  }
}

export function validateUsername(username: string): void {
  if (!username || typeof username !== "string") {
    throw new ValidationError(
      "Username is required and must be a string",
      "username",
    );
  }

  if (username.length < 1 || username.length > 39) {
    throw new ValidationError(
      "Username must be between 1 and 39 characters",
      "username",
    );
  }

  const standardGithubRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
  const idpGithubRegex =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?_[a-zA-Z0-9]+$/;

  if (!standardGithubRegex.test(username) && !idpGithubRegex.test(username)) {
    throw new ValidationError(
      "Username contains invalid characters or does not follow allowed patterns (standard or IdP with _shortname)",
      "username",
    );
  }
}
