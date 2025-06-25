#!/usr/bin/env node

import { config } from "dotenv";
import { FastMCP } from "fastmcp";
import { z } from "zod";

import { validateConfig } from "./config.js";
import {
  GitHubAPIError,
  RateLimitError,
  ValidationError,
} from "./error-handling.js";
import { GitHubService } from "./github-service.js";
import { Logger } from "./logger.js";

// Load environment variables
config();

const logger = Logger.getInstance();

// Validate configuration on startup
const appConfig = validateConfig();

const githubService = new GitHubService({
  appId: appConfig.GITHUB_APP_ID,
  installationId: appConfig.GITHUB_INSTALLATION_ID,
  privateKey: appConfig.GITHUB_PRIVATE_KEY,
  token: appConfig.GITHUB_TOKEN,
});

const server = new FastMCP({
  name: "GitHub Copilot Manager",
  version: "1.0.0",
});

// Helper function to handle tool execution with proper error handling
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeToolSafely<T extends { data: any }>(
  operation: () => Promise<T>,
  toolName: string,
): Promise<string> {
  try {
    logger.info(`Executing tool: ${toolName}`);
    const result = await operation();
    logger.info(`Tool executed successfully: ${toolName}`);
    return JSON.stringify(result.data, null, 2);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Tool execution failed: ${toolName}`, { error: errorMessage });

    if (error instanceof ValidationError) {
      throw new Error(`Invalid input: ${error.message}`);
    }

    if (error instanceof GitHubAPIError) {
      if (error.statusCode === 401) {
        throw new Error(
          "Authentication failed. Please check your GitHub token or app credentials.",
        );
      }
      if (error.statusCode === 403) {
        throw new Error(
          "Access forbidden. Check your permissions for this operation.",
        );
      }
      if (error.statusCode === 404) {
        throw new Error(
          "Resource not found. Please check the organization/user name.",
        );
      }
      throw new Error(`GitHub API error: ${error.message}`);
    }

    if (error instanceof RateLimitError) {
      const retryMessage = error.retryAfter
        ? ` Please try again in ${error.retryAfter} seconds.`
        : " Please try again later.";
      throw new Error(`Rate limit exceeded.${retryMessage}`);
    }

    throw new Error(`Unexpected error: ${errorMessage}`);
  }
}

// Copilot Metrics Tools
server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get Copilot Usage Metrics for Organization",
  },
  description:
    "Retrieve GitHub Copilot usage metrics for an organization. Falls back to seat information if usage metrics are not available.",
  execute: async (args) => {
    try {
      return await executeToolSafely(
        () =>
          githubService.getCopilotUsageForOrg(
            args.org,
            args.since,
            args.until,
            args.page,
            args.per_page,
          ),
        "get_copilot_usage_org",
      );
    } catch (error) {
      // If usage metrics fail with 404, try to get seat information instead
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        logger.info(
          "Usage metrics not available, falling back to seat information",
          { org: args.org },
        );
        const seatsData = await executeToolSafely(
          () =>
            githubService.getCopilotSeatsForOrg(
              args.org,
              args.page,
              args.per_page,
            ),
          "get_copilot_seats_org_fallback",
        );
        return JSON.stringify(
          {
            note: "Usage metrics not available for this organization. Showing seat information instead.",
            organization: args.org,
            requested_period:
              args.since && args.until
                ? `${args.since} to ${args.until}`
                : "Last 30 days (not available)",
            seats_data: JSON.parse(seatsData),
          },
          null,
          2,
        );
      }
      throw error;
    }
  },
  name: "get_copilot_usage_org",
  parameters: z.object({
    org: z.string().describe("The organization name"),
    page: z.number().default(1).describe("Page number for pagination"),
    per_page: z
      .number()
      .default(50)
      .describe("Number of results per page (max 100)"),
    since: z.string().optional().describe("Start date (YYYY-MM-DD format)"),
    until: z.string().optional().describe("End date (YYYY-MM-DD format)"),
  }),
});

server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get Copilot Usage Metrics for Enterprise",
  },
  description: "Retrieve GitHub Copilot usage metrics for an enterprise",
  execute: async (args) => {
    return executeToolSafely(
      () =>
        githubService.getCopilotUsageForEnterprise(
          args.enterprise,
          args.since,
          args.until,
          args.page,
          args.per_page,
        ),
      "get_copilot_usage_enterprise",
    );
  },
  name: "get_copilot_usage_enterprise",
  parameters: z.object({
    enterprise: z.string().describe("The enterprise slug"),
    page: z.number().default(1).describe("Page number for pagination"),
    per_page: z
      .number()
      .default(50)
      .describe("Number of results per page (max 100)"),
    since: z.string().optional().describe("Start date (YYYY-MM-DD format)"),
    until: z.string().optional().describe("End date (YYYY-MM-DD format)"),
  }),
});

server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "List Copilot Seats",
  },
  description: "List all GitHub Copilot seats for an organization",
  execute: async (args) => {
    return executeToolSafely(
      () =>
        githubService.getCopilotSeatsForOrg(args.org, args.page, args.per_page),
      "list_copilot_seats",
    );
  },
  name: "list_copilot_seats",
  parameters: z.object({
    org: z.string().describe("The organization name"),
    page: z.number().default(1).describe("Page number for pagination"),
    per_page: z
      .number()
      .default(50)
      .describe("Number of results per page (max 100)"),
  }),
});

// Copilot User Management Tools
server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Add Copilot Seats for Users",
  },
  description:
    "Add GitHub Copilot seats for specified users in an organization",
  execute: async (args) => {
    return executeToolSafely(
      () =>
        githubService.addCopilotSeatsForUsers(
          args.org,
          args.selected_usernames,
        ),
      "add_copilot_seats",
    );
  },
  name: "add_copilot_seats",
  parameters: z.object({
    org: z.string().describe("The organization name"),
    selected_usernames: z
      .array(z.string())
      .describe("Array of usernames to add Copilot seats for"),
  }),
});

server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: false,
    title: "Remove Copilot Seats for Users",
  },
  description:
    "Remove GitHub Copilot seats for specified users in an organization",
  execute: async (args) => {
    return executeToolSafely(
      () =>
        githubService.removeCopilotSeatsForUsers(
          args.org,
          args.selected_usernames,
        ),
      "remove_copilot_seats",
    );
  },
  name: "remove_copilot_seats",
  parameters: z.object({
    org: z.string().describe("The organization name"),
    selected_usernames: z
      .array(z.string())
      .describe("Array of usernames to remove Copilot seats for"),
  }),
});

server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get Copilot Seat Details for User",
  },
  description: "Get GitHub Copilot seat details for a specific user",
  execute: async (args) => {
    return executeToolSafely(
      () => githubService.getCopilotSeatDetails(args.org, args.username),
      "get_copilot_seat_details",
    );
  },
  name: "get_copilot_seat_details",
  parameters: z.object({
    org: z.string().describe("The organization name"),
    username: z.string().describe("The username to get seat details for"),
  }),
});

// Resource for Copilot documentation
server.addResource({
  async load() {
    return {
      text: `GitHub Copilot MCP Server

This server provides tools for managing GitHub Copilot metrics and user management.

Available Tools:
- get_copilot_usage_org: Get usage metrics for an organization
- get_copilot_usage_enterprise: Get usage metrics for an enterprise
- list_copilot_seats: List all Copilot seats in an organization
- add_copilot_seats: Add Copilot seats for users
- remove_copilot_seats: Remove Copilot seats for users
- get_copilot_seat_details: Get seat details for a specific user

Authentication:
Set GITHUB_TOKEN environment variable with a GitHub Personal Access Token
OR
Set GITHUB_APP_ID, GITHUB_PRIVATE_KEY, and GITHUB_INSTALLATION_ID for GitHub App authentication

Required Permissions:
- For Personal Access Token: 'copilot' scope
- For GitHub App: 'Copilot' permissions (read/write as needed)

Configuration:
- LOG_LEVEL: Set logging level (error, warn, info, debug)
- API_TIMEOUT: API request timeout in milliseconds
- CACHE_TTL: Cache time-to-live in seconds
`,
    };
  },
  mimeType: "text/plain",
  name: "GitHub Copilot Documentation",
  uri: "copilot://docs",
});

// Prompt for generating Copilot usage reports
server.addPrompt({
  arguments: [
    {
      description: "Copilot usage data in JSON format",
      name: "usage_data",
      required: true,
    },
    {
      description: "Organization or enterprise name",
      name: "entity_name",
      required: true,
    },
  ],
  description: "Generate a comprehensive Copilot usage report",
  load: async (args) => {
    return `Analyze the following GitHub Copilot usage data for ${args.entity_name} and generate a comprehensive report including:

1. Summary of total usage metrics
2. Active users and seat utilization
3. Trends and insights
4. Recommendations for optimization

Usage Data:
${args.usage_data}

Please provide actionable insights and recommendations based on this data.`;
  },
  name: "copilot-usage-report",
});

server.start({
  transportType: "stdio",
});
