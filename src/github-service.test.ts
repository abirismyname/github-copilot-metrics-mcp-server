import { describe, test, expect, beforeEach, vi } from 'vitest';
import { GitHubService } from './github-service.js';
import { ValidationError, GitHubAPIError } from './error-handling.js';

// Mock the dependencies
const mockOctokit = {
  rest: {
    copilot: {
      usageMetricsForOrg: vi.fn(),
      listCopilotSeats: vi.fn(),
      addCopilotSeatsForUsers: vi.fn(),
      cancelCopilotSeatAssignmentForUsers: vi.fn(),
      getCopilotSeatDetailsForUser: vi.fn(),
    }
  }
};

vi.mock('@octokit/rest', () => ({
  Octokit: vi.fn(() => mockOctokit)
}));

vi.mock('./logger.js', () => ({
  Logger: {
    getInstance: () => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })
  }
}));

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    service = new GitHubService({ token: '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' });
  });

  describe('Constructor', () => {
    test('should initialize with token', () => {
      expect(service).toBeInstanceOf(GitHubService);
    });

    test('should throw error without credentials', () => {
      expect(() => new GitHubService({})).toThrow('Either token or GitHub App credentials must be provided');
    });

    test('should initialize with GitHub App credentials', () => {
      const appService = new GitHubService({
        appId: 'test-app-id',
        privateKey: 'test-private-key',
        installationId: 'test-installation-id'
      });
      expect(appService).toBeInstanceOf(GitHubService);
    });
  });

  describe('getCopilotUsageForOrg', () => {
    test('should get usage metrics successfully', async () => {
      const mockResponse = { data: { total_seats: 10 } };
      mockOctokit.rest.copilot.usageMetricsForOrg.mockResolvedValue(mockResponse);

      const result = await service.getCopilotUsageForOrg('octodemo');
      
      expect(mockOctokit.rest.copilot.usageMetricsForOrg).toHaveBeenCalledWith({
        org: 'octodemo',
        since: undefined,
        until: undefined,
        page: 1,
        per_page: 50
      });
      expect(result).toBe(mockResponse);
    });

    test('should validate organization name', async () => {
      await expect(service.getCopilotUsageForOrg('')).rejects.toThrow(ValidationError);
      await expect(service.getCopilotUsageForOrg('invalid-org-name-that-is-too-long-for-github')).rejects.toThrow(ValidationError);
    });

    test('should validate date parameters', async () => {
      await expect(service.getCopilotUsageForOrg('octodemo', 'invalid-date')).rejects.toThrow(ValidationError);
      await expect(service.getCopilotUsageForOrg('octodemo', '2024-01-01', 'invalid-date')).rejects.toThrow(ValidationError);
    });

    test('should validate pagination parameters', async () => {
      await expect(service.getCopilotUsageForOrg('octodemo', undefined, undefined, 0)).rejects.toThrow(ValidationError);
      await expect(service.getCopilotUsageForOrg('octodemo', undefined, undefined, 1, 101)).rejects.toThrow(ValidationError);
    });
  });

  describe('getCopilotSeatsForOrg', () => {
    test('should list seats successfully', async () => {
      const mockResponse = { data: { seats: [] } };
      mockOctokit.rest.copilot.listCopilotSeats.mockResolvedValue(mockResponse);

      const result = await service.getCopilotSeatsForOrg('octodemo');
      
      expect(mockOctokit.rest.copilot.listCopilotSeats).toHaveBeenCalledWith({
        org: 'octodemo',
        page: 1,
        per_page: 50
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('addCopilotSeatsForUsers', () => {
    test('should add seats successfully', async () => {
      const mockResponse = { data: { seats_created: 2 } };
      mockOctokit.rest.copilot.addCopilotSeatsForUsers.mockResolvedValue(mockResponse);

      const result = await service.addCopilotSeatsForUsers('octodemo', ['user1', 'user2']);
      
      expect(mockOctokit.rest.copilot.addCopilotSeatsForUsers).toHaveBeenCalledWith({
        org: 'octodemo',
        selected_usernames: ['user1', 'user2']
      });
      expect(result).toBe(mockResponse);
    });

    test('should validate usernames', async () => {
      await expect(service.addCopilotSeatsForUsers('octodemo', [])).rejects.toThrow('selected_usernames must be a non-empty array');
      await expect(service.addCopilotSeatsForUsers('octodemo', ['invalid-username-that-is-too-long-for-github'])).rejects.toThrow(ValidationError);
    });
  });

  describe('removeCopilotSeatsForUsers', () => {
    test('should remove seats successfully', async () => {
      const mockResponse = { data: { seats_cancelled: 1 } };
      mockOctokit.rest.copilot.cancelCopilotSeatAssignmentForUsers.mockResolvedValue(mockResponse);

      const result = await service.removeCopilotSeatsForUsers('octodemo', ['user1']);
      
      expect(mockOctokit.rest.copilot.cancelCopilotSeatAssignmentForUsers).toHaveBeenCalledWith({
        org: 'octodemo',
        selected_usernames: ['user1']
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getCopilotSeatDetails', () => {
    test('should get seat details successfully', async () => {
      const mockResponse = { data: { assignee: { login: 'user1' } } };
      mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(mockResponse);

      const result = await service.getCopilotSeatDetails('octodemo', 'user1');
      
      expect(mockOctokit.rest.copilot.getCopilotSeatDetailsForUser).toHaveBeenCalledWith({
        org: 'octodemo',
        username: 'user1'
      });
      expect(result).toBe(mockResponse);
    });

    test('should validate username', async () => {
      await expect(service.getCopilotSeatDetails('octodemo', '')).rejects.toThrow(ValidationError);
    });
  });
});
