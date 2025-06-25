import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

import {
  handleAPIError,
  retryOperation,
  validateDateString,
  validateOrganizationName,
  validatePaginationParams,
  validateUsername,
} from "./error-handling.js";
import { Logger } from "./logger.js";

const logger = Logger.getInstance();

export interface GitHubConfig {
  appId?: string;
  installationId?: string;
  privateKey?: string;
  token?: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    logger.info("Initializing GitHub service", {
      hasAppCreds: !!(
        config.appId &&
        config.privateKey &&
        config.installationId
      ),
      hasToken: !!config.token,
      tokenPrefix: config.token
        ? config.token.substring(0, 20) + "..."
        : undefined,
    });

    if (config.token) {
      this.octokit = new Octokit({ auth: config.token });
      logger.info("GitHub service initialized with token authentication");
    } else if (config.appId && config.privateKey && config.installationId) {
      this.octokit = new Octokit({
        auth: {
          appId: config.appId,
          installationId: config.installationId,
          privateKey: config.privateKey,
        },
        authStrategy: createAppAuth,
      });
      logger.info("GitHub service initialized with GitHub App authentication");
    } else {
      throw new Error(
        "Either token or GitHub App credentials must be provided",
      );
    }
  }

  async addCopilotSeatsForUsers(org: string, selected_usernames: string[]) {
    validateOrganizationName(org);
    if (!Array.isArray(selected_usernames) || selected_usernames.length === 0) {
      throw new Error("selected_usernames must be a non-empty array");
    }
    selected_usernames.forEach((username) => validateUsername(username));

    logger.info("Adding Copilot seats for users", {
      org,
      userCount: selected_usernames.length,
      users: selected_usernames,
    });

    return await retryOperation(
      () =>
        this.octokit.rest.copilot.addCopilotSeatsForUsers({
          org,
          selected_usernames,
        }),
      3,
      1000,
      `add Copilot seats for users in org ${org}`,
    ).catch((error) =>
      handleAPIError(error, `add Copilot seats for users in org ${org}`),
    );
  }

  async getCopilotSeatDetails(org: string, username: string) {
    validateOrganizationName(org);
    validateUsername(username);

    logger.info("Getting Copilot seat details for user", { org, username });

    return await retryOperation(
      () =>
        this.octokit.rest.copilot.getCopilotSeatDetailsForUser({
          org,
          username,
        }),
      3,
      1000,
      `get Copilot seat details for user ${username} in org ${org}`,
    ).catch((error) =>
      handleAPIError(
        error,
        `get Copilot seat details for user ${username} in org ${org}`,
      ),
    );
  }

  async getCopilotSeatsForOrg(org: string, page = 1, per_page = 50) {
    validateOrganizationName(org);
    validatePaginationParams(page, per_page);

    logger.info("Getting Copilot seats for organization", {
      org,
      page,
      per_page,
    });

    return await retryOperation(
      () => this.octokit.rest.copilot.listCopilotSeats({ org, page, per_page }),
      3,
      1000,
      `get Copilot seats for org ${org}`,
    ).catch((error) =>
      handleAPIError(error, `get Copilot seats for org ${org}`),
    );
  }

  async getCopilotUsageForEnterprise(
    enterprise: string,
    since?: string,
    until?: string,
    page = 1,
    per_page = 50,
  ) {
    validateOrganizationName(enterprise); // Same validation rules apply
    validatePaginationParams(page, per_page);
    if (since) validateDateString(since, "since");
    if (until) validateDateString(until, "until");

    logger.info("Getting Copilot usage for enterprise", {
      enterprise,
      page,
      per_page,
      since,
      until,
    });

    return await retryOperation(
      () =>
        this.octokit.rest.copilot.copilotMetricsForOrganization({
          org: enterprise,
          page,
          per_page,
          since,
          until,
        }),
      3,
      1000,
      `get Copilot usage for enterprise ${enterprise}`,
    ).catch((error) =>
      handleAPIError(error, `get Copilot usage for enterprise ${enterprise}`),
    );
  }

  async getCopilotUsageForOrg(
    org: string,
    since?: string,
    until?: string,
    page = 1,
    per_page = 50,
  ) {
    validateOrganizationName(org);
    validatePaginationParams(page, per_page);
    if (since) validateDateString(since, "since");
    if (until) validateDateString(until, "until");

    logger.info("Getting Copilot usage for organization", {
      org,
      page,
      per_page,
      since,
      until,
    });

    try {
      const result = await retryOperation(
        async () => {
          logger.info("Making API call to GitHub", {
            endpoint: `/orgs/${org}/copilot/usage`,
            params: { org, page, per_page, since, until },
          });
          const response =
            await this.octokit.rest.copilot.copilotMetricsForOrganization({
              org,
              page,
              per_page,
              since,
              until,
            });
          logger.info("API call successful", {
            dataKeys: Object.keys(response.data || {}),
            dataLength: Array.isArray(response.data)
              ? response.data.length
              : "not-array",
            status: response.status,
          });
          return response;
        },
        3,
        1000,
        `get Copilot usage for org ${org}`,
      );
      return result;
    } catch (error) {
      logger.error("API call failed", {
        endpoint: `/orgs/${org}/copilot/usage`,
        error: error instanceof Error ? error.message : String(error),
        org,
      });
      throw handleAPIError(error, `get Copilot usage for org ${org}`);
    }
  }

  async removeCopilotSeatsForUsers(org: string, selected_usernames: string[]) {
    validateOrganizationName(org);
    if (!Array.isArray(selected_usernames) || selected_usernames.length === 0) {
      throw new Error("selected_usernames must be a non-empty array");
    }
    selected_usernames.forEach((username) => validateUsername(username));

    logger.info("Removing Copilot seats for users", {
      org,
      userCount: selected_usernames.length,
      users: selected_usernames,
    });

    return await retryOperation(
      () =>
        this.octokit.rest.copilot.cancelCopilotSeatAssignmentForUsers({
          org,
          selected_usernames,
        }),
      3,
      1000,
      `remove Copilot seats for users in org ${org}`,
    ).catch((error) =>
      handleAPIError(error, `remove Copilot seats for users in org ${org}`),
    );
  }
}
