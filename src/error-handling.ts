import { Logger } from "./logger.js";

const logger = Logger.getInstance();

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any,
  ) {
    super(message);
    this.name = "GitHubAPIError";
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

export function handleAPIError(error: any, operation: string): never {
  logger.error(`GitHub API error during ${operation}`, {
    operation,
    error: error.message,
    status: error.status,
    response: error.response?.data,
  });

  if (error.status === 401) {
    throw new GitHubAPIError(
      "Authentication failed. Please check your GitHub token or app credentials.",
      401,
      error.response?.data,
    );
  }

  if (error.status === 403) {
    const resetTime = error.response?.headers["x-ratelimit-reset"];
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
      error.response?.data,
    );
  }

  if (error.status === 404) {
    throw new GitHubAPIError(
      "Resource not found. Please check the organization/user name.",
      404,
      error.response?.data,
    );
  }

  if (error.status >= 500) {
    throw new GitHubAPIError(
      "GitHub API server error. Please try again later.",
      error.status,
      error.response?.data,
    );
  }

  // Generic error
  throw new GitHubAPIError(
    error.message || "Unknown GitHub API error",
    error.status,
    error.response?.data,
  );
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

  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
    throw new ValidationError(
      "Username contains invalid characters",
      "username",
    );
  }
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

export function validatePaginationParams(page: number, per_page: number): void {
  if (page < 1) {
    throw new ValidationError("Page must be greater than 0", "page");
  }

  if (per_page < 1 || per_page > 100) {
    throw new ValidationError("per_page must be between 1 and 100", "per_page");
  }
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
          error: lastError.message,
          attempts: maxRetries,
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
        maxRetries,
        error: lastError.message,
        delay,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
