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
import { MCPClientDetector } from "./mcp-client-detector.js";
import { readFileSync, existsSync } from "fs";

// Load environment variables
config();

const logger = Logger.getInstance();

// Initialize MCP client detector
const clientDetector = MCPClientDetector.getInstance();
const clientInfo = clientDetector.getClientInfo();

// Get Docker information
const dockerInfo = getDockerInfo();

// Log MCP client and Docker information at startup
logger.info('Server startup information:', { 
  clientInfo,
  dockerInfo,
  nodeVersion: process.version,
  platform: process.platform
});

// Validate configuration on startup
const appConfig = validateConfig();

const githubService = new GitHubService({
  appId: appConfig.GITHUB_APP_ID,
  installationId: appConfig.GITHUB_INSTALLATION_ID,
  privateKey: appConfig.GITHUB_PRIVATE_KEY,
  token: appConfig.GITHUB_TOKEN,
});

const server = new FastMCP({
  name: "GitHub Copilot Metrics Manager",
  version: "1.0.0",
});

// Helper function to provide user-friendly guidance for missing date ranges
function createDateRangeGuidance(org: string): string {
  const suggestions = generateDateRangeSuggestions();

  const baseGuidance = `
📅 **Date Range Recommended for Your Client**

To ensure the best experience with your MCP client, please specify a date range. Here are some suggestions:

**Recommended prompts:**
• "Get Copilot usage metrics for organization '${org}' for the last 7 days"
• "Get Copilot usage metrics for organization '${org}' for the last 30 days"  
• "Get Copilot usage metrics for organization '${org}' from ${suggestions.last30Days.since} to ${suggestions.last30Days.until}"

**Why specify dates for your client?**
- Prevents potential compatibility issues with your current MCP client
- Provides more predictable results and better error handling
- Helps avoid fallback logic that may cause delays

**Current date suggestions:**
- Last 7 days: ${suggestions.last7Days.since} to ${suggestions.last7Days.until}
- Last 30 days: ${suggestions.last30Days.since} to ${suggestions.last30Days.until}
- Current month: ${suggestions.currentMonth.since} to ${suggestions.currentMonth.until}`.trim();

  return clientDetector.getClientSpecificGuidance(
    baseGuidance,
    clientInfo.type,
  );
}

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

// Helper function to provide date range suggestions
function generateDateRangeSuggestions(): {
  currentMonth: { since: string; until: string };
  last30Days: { since: string; until: string };
  last7Days: { since: string; until: string };
} {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Last 7 days
  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 7);

  // Last 30 days
  const last30Start = new Date(today);
  last30Start.setDate(today.getDate() - 30);

  // Current month
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  return {
    currentMonth: {
      since: formatDate(monthStart),
      until: formatDate(today),
    },
    last30Days: {
      since: formatDate(last30Start),
      until: formatDate(today),
    },
    last7Days: {
      since: formatDate(last7Start),
      until: formatDate(today),
    },
  };
}

// Helper function to detect if we should provide guidance (client-aware approach)
function shouldProvideGuidance(args: {
  org: string;
  since?: string;
  until?: string;
}): boolean {
  // Don't provide guidance - let the tool handle missing dates
  return false;
}

// Helper function to add default date range if missing
function addDefaultDateRange(args: {
  org: string;
  since?: string;
  until?: string;
  page?: number;
  per_page?: number;
}): typeof args {
  // If no date range provided, use last 30 days
  if (!args.since && !args.until) {
    const suggestions = generateDateRangeSuggestions();
    return {
      ...args,
      since: suggestions.last30Days.since,
      until: suggestions.last30Days.until,
    };
  }
  return args;
}

// Helper function to detect Docker environment and get image info
function getDockerInfo(): {
  isDocker: boolean;
  imageSha?: string;
  imageId?: string;
  containerInfo?: any;
} {
  const dockerInfo: any = {
    isDocker: false,
  };

  try {
    // Method 1: Check for /.dockerenv file
    if (existsSync('/.dockerenv')) {
      dockerInfo.isDocker = true;
    }

    // Method 2: Check cgroup for docker
    if (existsSync('/proc/1/cgroup')) {
      const cgroup = readFileSync('/proc/1/cgroup', 'utf8');
      if (cgroup.includes('docker') || cgroup.includes('containerd')) {
        dockerInfo.isDocker = true;
      }
    }

    // Method 3: Check if we're PID 1 (common in containers)
    if (process.pid === 1) {
      dockerInfo.isDocker = true;
    }

    // If we detected Docker, try to get image information
    if (dockerInfo.isDocker) {
      // Try to get image SHA from environment variables
      dockerInfo.imageSha = process.env.IMAGE_SHA || process.env.DOCKER_IMAGE_SHA;
      dockerInfo.imageId = process.env.IMAGE_ID || process.env.DOCKER_IMAGE_ID;

      // Try to read Docker metadata if available
      try {
        if (existsSync('/proc/self/mountinfo')) {
          const mountinfo = readFileSync('/proc/self/mountinfo', 'utf8');
          const dockerMatch = mountinfo.match(/\/docker\/containers\/([a-f0-9]{64})/);
          if (dockerMatch) {
            dockerInfo.containerId = dockerMatch[1].substring(0, 12); // Short container ID
          }
        }
      } catch (e) {
        // Ignore errors reading mount info
      }

      // Check for common Docker environment variables
      const dockerEnvVars = Object.keys(process.env).filter(key => 
        key.startsWith('DOCKER_') || 
        key === 'HOSTNAME' ||
        key === 'PATH'
      );
      
      if (dockerEnvVars.length > 0) {
        dockerInfo.dockerEnvVars = dockerEnvVars;
      }
    }

  } catch (error) {
    // If there's any error detecting Docker, just mark as not Docker
    dockerInfo.isDocker = false;
    dockerInfo.detectionError = error instanceof Error ? error.message : String(error);
  }

  return dockerInfo;
}

// Copilot Metrics Tools
server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get Copilot Usage Metrics for Organization",
  },
  description:
    "Retrieve GitHub Copilot usage metrics for an organization. Optionally specify 'since' and 'until' date parameters for specific time ranges. Falls back to seat information if usage metrics are not available.",
  execute: async (args) => {
    // Add default date range if missing (last 30 days)
    const argsWithDefaults = addDefaultDateRange(args);
    
    // Provide guidance if no date range is specified
    if (shouldProvideGuidance(argsWithDefaults)) {
      logger.info("No date range provided, offering user guidance", {
        clientConfidence: clientInfo.confidence,
        clientName: clientInfo.name,
        clientType: clientInfo.type,
        org: argsWithDefaults.org,
      });

      const guidance = createDateRangeGuidance(argsWithDefaults.org);

      // Still attempt to get seat information as a fallback with guidance
      try {
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
            guidance,
            note: "📍 No date range specified. Showing current seat information instead.",
            organization: argsWithDefaults.org,
            seats_data: JSON.parse(seatsData),
            suggestion:
              "For usage metrics, please specify a date range in your next request.",
          },
          null,
          2,
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_seatsError) {
        // If even seats fail, just return the guidance
        return JSON.stringify(
          {
            error: "Unable to retrieve data without a date range.",
            guidance,
            organization: argsWithDefaults.org,
            suggestion:
              "Please try again with a specific date range as shown above.",
          },
          null,
          2,
        );
      }
    }

    try {
      return await executeToolSafely(
        () =>
          githubService.getCopilotUsageForOrg(
            argsWithDefaults.org,
            argsWithDefaults.since,
            argsWithDefaults.until,
            argsWithDefaults.page,
            argsWithDefaults.per_page,
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
          { org: argsWithDefaults.org },
        );
        const seatsData = await executeToolSafely(
          () =>
            githubService.getCopilotSeatsForOrg(
              argsWithDefaults.org,
              argsWithDefaults.page,
              argsWithDefaults.per_page,
            ),
          "get_copilot_seats_org_fallback",
        );
        return JSON.stringify(
          {
            note: "Usage metrics not available for this organization. Showing seat information instead.",
            organization: argsWithDefaults.org,
            requested_period:
              argsWithDefaults.since && argsWithDefaults.until
                ? `${argsWithDefaults.since} to ${argsWithDefaults.until}`
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
  description:
    "Retrieve GitHub Copilot usage metrics for an enterprise. Optionally specify 'since' and 'until' date parameters for specific time ranges.",
  execute: async (args) => {
    // Provide guidance if no date range is specified for enterprise metrics
    if (
      shouldProvideGuidance({
        org: args.enterprise,
        since: args.since,
        until: args.until,
      })
    ) {
      logger.info(
        "No date range provided for enterprise metrics, offering user guidance",
        {
          clientName: clientInfo.name,
          clientType: clientInfo.type,
          enterprise: args.enterprise,
        },
      );

      const guidance = createDateRangeGuidance(args.enterprise).replace(
        "organization",
        "enterprise",
      );

      return JSON.stringify(
        {
          enterprise: args.enterprise,
          error:
            "Enterprise usage metrics work better with a date range for your client.",
          guidance,
          suggestion:
            "Please specify a date range for optimal results with your current MCP client.",
        },
        null,
        2,
      );
    }

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

// Debugging tool to show MCP client information
server.addTool({
  annotations: {
    openWorldHint: true,
    readOnlyHint: true,
    title: "Get MCP Client Information",
  },
  description:
    "Get information about the MCP client that's currently connected (for debugging and support)",
  execute: async () => {
    const dockerInfo = getDockerInfo();
    
    return JSON.stringify(
      {
        client: clientInfo,
        docker: dockerInfo,
        environment: {
          argv: process.argv,
          mcpEnvironmentVars: Object.keys(process.env).filter((key) =>
            key.startsWith("MCP_"),
          ),
          nodeVersion: process.version,
          pid: process.pid,
          platform: process.platform,
          ppid: process.ppid,
          title: process.title,
          vsCodeEnvironmentVars: Object.keys(process.env).filter((key) =>
            key.startsWith("VSCODE_"),
          ),
        },
        recommendations: {
          claude:
            "Claude Desktop handles flexible prompts well and has good error recovery",
          general:
            "Different MCP clients may behave differently with the same prompts",
          vscode:
            "For VS Code, use explicit date ranges in your prompts for best results",
        },
      },
      null,
      2,
    );
  },
  name: "get_mcp_client_info",
  parameters: z.object({}),
});

server.start({
  transportType: "stdio",
});
