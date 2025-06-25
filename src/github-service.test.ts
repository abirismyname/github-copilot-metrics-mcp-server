import { beforeEach, describe, expect, test, vi } from "vitest";

import { GitHubService } from "./github-service.js";

// Mock the dependencies
const mockOctokit = {
  rest: {
    copilot: {
      addCopilotSeatsForUsers: vi.fn(),
      cancelCopilotSeatAssignmentForUsers: vi.fn(),
      copilotMetricsForOrganization: vi.fn(),
      getCopilotSeatDetailsForUser: vi.fn(),
      listCopilotSeats: vi.fn(),
    },
  },
};

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(() => mockOctokit),
}));

vi.mock("./logger.js", () => ({
  Logger: {
    getInstance: () => ({
      debug: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
    }),
  },
}));

describe("GitHubService", () => {
  let service: GitHubService;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    service = new GitHubService({ token: "test-token" });
  });

  describe("Constructor", () => {
    test("should initialize with token", () => {
      expect(service).toBeInstanceOf(GitHubService);
    });

    test("should throw error without credentials", () => {
      expect(() => new GitHubService({})).toThrow(
        "Either token or GitHub App credentials must be provided",
      );
    });

    test("should initialize with GitHub App credentials", () => {
      const appService = new GitHubService({
        appId: "test-app-id",
        installationId: "test-installation-id",
        privateKey: "test-private-key",
      });
      expect(appService).toBeInstanceOf(GitHubService);
    });
  });

  describe("getCopilotUsageForOrg", () => {
    test("should get usage metrics successfully", async () => {
      const mockResponse = { data: { total_seats: 10 } };
      mockOctokit.rest.copilot.copilotMetricsForOrganization.mockResolvedValue(
        mockResponse,
      );

      const result = await service.getCopilotUsageForOrg("test-org");

      expect(
        mockOctokit.rest.copilot.copilotMetricsForOrganization,
      ).toHaveBeenCalledWith({
        org: "test-org",
        page: 1,
        per_page: 50,
        since: undefined,
        until: undefined,
      });
      expect(result).toBe(mockResponse);
    });

    test("should validate organization name", async () => {
      await expect(service.getCopilotUsageForOrg("")).rejects.toThrow(
        ValidationError,
      );
      await expect(
        service.getCopilotUsageForOrg(
          "invalid-org-name-that-is-too-long-for-github",
        ),
      ).rejects.toThrow(ValidationError);
    });

    test("should validate date parameters", async () => {
      await expect(
        service.getCopilotUsageForOrg("test-org", "invalid-date"),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.getCopilotUsageForOrg("test-org", "2024-01-01", "invalid-date"),
      ).rejects.toThrow(ValidationError);
    });

    test("should validate pagination parameters", async () => {
      await expect(
        service.getCopilotUsageForOrg("test-org", undefined, undefined, 0),
      ).rejects.toThrow(ValidationError);
      await expect(
        service.getCopilotUsageForOrg("test-org", undefined, undefined, 1, 101),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("getCopilotSeatsForOrg", () => {
    test("should list seats successfully", async () => {
      const mockResponse = { data: { seats: [] } };
      mockOctokit.rest.copilot.listCopilotSeats.mockResolvedValue(mockResponse);

      const result = await service.getCopilotSeatsForOrg("test-org");

      expect(mockOctokit.rest.copilot.listCopilotSeats).toHaveBeenCalledWith({
        org: "test-org",
        page: 1,
        per_page: 50,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe("addCopilotSeatsForUsers", () => {
    test("should add seats successfully", async () => {
      const mockResponse = { data: { seats_created: 2 } };
      mockOctokit.rest.copilot.addCopilotSeatsForUsers.mockResolvedValue(
        mockResponse,
      );

      const result = await service.addCopilotSeatsForUsers("test-org", [
        "user1",
        "user2",
      ]);

      expect(
        mockOctokit.rest.copilot.addCopilotSeatsForUsers,
      ).toHaveBeenCalledWith({
        org: "test-org",
        selected_usernames: ["user1", "user2"],
      });
      expect(result).toBe(mockResponse);
    });

    test("should validate usernames", async () => {
      await expect(
        service.addCopilotSeatsForUsers("test-org", []),
      ).rejects.toThrow("selected_usernames must be a non-empty array");
      await expect(
        service.addCopilotSeatsForUsers("test-org", [
          "invalid-username-that-is-too-long-for-github",
        ]),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("removeCopilotSeatsForUsers", () => {
    test("should remove seats successfully", async () => {
      const mockResponse = { data: { seats_cancelled: 1 } };
      mockOctokit.rest.copilot.cancelCopilotSeatAssignmentForUsers.mockResolvedValue(
        mockResponse,
      );

      const result = await service.removeCopilotSeatsForUsers("test-org", [
        "user1",
      ]);

      expect(
        mockOctokit.rest.copilot.cancelCopilotSeatAssignmentForUsers,
      ).toHaveBeenCalledWith({
        org: "test-org",
        selected_usernames: ["user1"],
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe("getCopilotSeatDetails", () => {
    test("should get seat details successfully", async () => {
      const mockResponse = { data: { assignee: { login: "user1" } } };
      mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(
        mockResponse,
      );

      const result = await service.getCopilotSeatDetails("test-org", "user1");

      expect(
        mockOctokit.rest.copilot.getCopilotSeatDetailsForUser,
      ).toHaveBeenCalledWith({
        org: "test-org",
        username: "user1",
      });
      expect(result).toBe(mockResponse);
    });

    test("should validate username", async () => {
      await expect(
        service.getCopilotSeatDetails("test-org", ""),
      ).rejects.toThrow(ValidationError);
    });
  });

  test("should accept valid username with dash", async () => {
    const mockResponse = { data: { assignee: { login: "test-user" } } };
    mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(
      mockResponse,
    );
    await expect(
      service.getCopilotSeatDetails("test-org", "test-user"),
    ).resolves.toBe(mockResponse);
  });

  test("should not accept valid username with underscore before the end", async () => {
    const mockResponse = { data: { assignee: { login: "test_my-user" } } };
    mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(
      mockResponse,
    );
    await expect(
      service.getCopilotSeatDetails("test-org", "test_my-user"),
    ).rejects.toThrow(ValidationError);
  });

  test("should accept valid username with underscore before the end", async () => {
    const mockResponse = { data: { assignee: { login: "test-my_idp" } } };
    mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(
      mockResponse,
    );
    await expect(
      service.getCopilotSeatDetails("test-org", "test-my_idp"),
    ).resolves.toBe(mockResponse);
  });

  test("should accept valid username with underscore before the end", async () => {
    const mockResponse = { data: { assignee: { login: "username_idp" } } };
    mockOctokit.rest.copilot.getCopilotSeatDetailsForUser.mockResolvedValue(
      mockResponse,
    );
    await expect(
      service.getCopilotSeatDetails("test-org", "username_idp"),
    ).resolves.toBe(mockResponse);
  });
});
