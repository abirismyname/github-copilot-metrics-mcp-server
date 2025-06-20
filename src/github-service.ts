import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { Logger } from "./logger.js";
import { 
  handleAPIError, 
  validateOrganizationName, 
  validateUsername, 
  validateDateString, 
  validatePaginationParams,
  retryOperation 
} from "./error-handling.js";

const logger = Logger.getInstance();

export interface GitHubConfig {
  token?: string;
  appId?: string;
  privateKey?: string;
  installationId?: string;
}

export class GitHubService {
  private octokit: Octokit;

  constructor(config: GitHubConfig) {
    logger.info("Initializing GitHub service", { 
      hasToken: !!config.token,
      hasAppCreds: !!(config.appId && config.privateKey && config.installationId)
    });

    if (config.token) {
      this.octokit = new Octokit({ auth: config.token });
    } else if (config.appId && config.privateKey && config.installationId) {
      this.octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: config.appId,
          privateKey: config.privateKey,
          installationId: config.installationId,
        },
      });
    } else {
      throw new Error("Either token or GitHub App credentials must be provided");
    }
  }

  async getCopilotUsageForOrg(org: string, since?: string, until?: string, page = 1, per_page = 50) {
    validateOrganizationName(org);
    validatePaginationParams(page, per_page);
    if (since) validateDateString(since, 'since');
    if (until) validateDateString(until, 'until');

    logger.info("Getting Copilot usage for organization", { org, since, until, page, per_page });

    return await retryOperation(
      () => this.octokit.rest.copilot.usageMetricsForOrg({ org, since, until, page, per_page }),
      3,
      1000,
      `get Copilot usage for org ${org}`
    ).catch(error => handleAPIError(error, `get Copilot usage for org ${org}`));
  }

  async getCopilotUsageForEnterprise(enterprise: string, since?: string, until?: string, page = 1, per_page = 50) {
    validateOrganizationName(enterprise); // Same validation rules apply
    validatePaginationParams(page, per_page);
    if (since) validateDateString(since, 'since');
    if (until) validateDateString(until, 'until');

    logger.info("Getting Copilot usage for enterprise", { enterprise, since, until, page, per_page });

    return await retryOperation(
      () => this.octokit.rest.copilot.usageMetricsForOrg({ org: enterprise, since, until, page, per_page }),
      3,
      1000,
      `get Copilot usage for enterprise ${enterprise}`
    ).catch(error => handleAPIError(error, `get Copilot usage for enterprise ${enterprise}`));
  }

  async getCopilotSeatsForOrg(org: string, page = 1, per_page = 50) {
    validateOrganizationName(org);
    validatePaginationParams(page, per_page);

    logger.info("Getting Copilot seats for organization", { org, page, per_page });

    return await retryOperation(
      () => this.octokit.rest.copilot.listCopilotSeats({ org, page, per_page }),
      3,
      1000,
      `get Copilot seats for org ${org}`
    ).catch(error => handleAPIError(error, `get Copilot seats for org ${org}`));
  }

  async addCopilotSeatsForUsers(org: string, selected_usernames: string[]) {
    validateOrganizationName(org);
    if (!Array.isArray(selected_usernames) || selected_usernames.length === 0) {
      throw new Error("selected_usernames must be a non-empty array");
    }
    selected_usernames.forEach(username => validateUsername(username));

    logger.info("Adding Copilot seats for users", { org, userCount: selected_usernames.length, users: selected_usernames });

    return await retryOperation(
      () => this.octokit.rest.copilot.addCopilotSeatsForUsers({ org, selected_usernames }),
      3,
      1000,
      `add Copilot seats for users in org ${org}`
    ).catch(error => handleAPIError(error, `add Copilot seats for users in org ${org}`));
  }

  async removeCopilotSeatsForUsers(org: string, selected_usernames: string[]) {
    validateOrganizationName(org);
    if (!Array.isArray(selected_usernames) || selected_usernames.length === 0) {
      throw new Error("selected_usernames must be a non-empty array");
    }
    selected_usernames.forEach(username => validateUsername(username));

    logger.info("Removing Copilot seats for users", { org, userCount: selected_usernames.length, users: selected_usernames });

    return await retryOperation(
      () => this.octokit.rest.copilot.cancelCopilotSeatAssignmentForUsers({ org, selected_usernames }),
      3,
      1000,
      `remove Copilot seats for users in org ${org}`
    ).catch(error => handleAPIError(error, `remove Copilot seats for users in org ${org}`));
  }

  async getCopilotSeatDetails(org: string, username: string) {
    validateOrganizationName(org);
    validateUsername(username);

    logger.info("Getting Copilot seat details for user", { org, username });

    return await retryOperation(
      () => this.octokit.rest.copilot.getCopilotSeatDetailsForUser({ org, username }),
      3,
      1000,
      `get Copilot seat details for user ${username} in org ${org}`
    ).catch(error => handleAPIError(error, `get Copilot seat details for user ${username} in org ${org}`));
  }
}
