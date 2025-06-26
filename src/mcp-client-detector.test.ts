import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MCPClientDetector } from "./mcp-client-detector.js";

describe("MCPClientDetector", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];
  let originalTitle: string;
  let originalPpid: number | undefined;

  beforeEach(() => {
    // Save original process state
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
    originalTitle = process.title;
    originalPpid = process.ppid;

    // Clear environment variables
    Object.keys(process.env).forEach((key) => {
      if (
        key.startsWith("VSCODE_") ||
        key.startsWith("CLAUDE_") ||
        key.startsWith("ANTHROPIC_") ||
        key.startsWith("MCP_") ||
        key.startsWith("CLINE_") ||
        key.startsWith("CONTINUE_") ||
        key.startsWith("CURSOR_") ||
        key.startsWith("JETBRAINS_") ||
        key.startsWith("WARP_") ||
        key.startsWith("ZED_") ||
        key.startsWith("WINDSURF_")
      ) {
        delete process.env[key];
      }
    });

    // Reset singleton instance
    // @ts-expect-error - Accessing private static property for testing
    MCPClientDetector.instance = undefined;
  });

  afterEach(() => {
    // Restore original process state
    process.env = originalEnv;
    process.argv = originalArgv;
    process.title = originalTitle;
    Object.defineProperty(process, "ppid", {
      configurable: true,
      value: originalPpid,
      writable: true,
    });

    // Reset singleton instance
    // @ts-expect-error - Accessing private static property for testing
    MCPClientDetector.instance = undefined;
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance when called multiple times", () => {
      const detector1 = MCPClientDetector.getInstance();
      const detector2 = MCPClientDetector.getInstance();

      expect(detector1).toBe(detector2);
    });

    it("should be a valid MCPClientDetector instance", () => {
      const detector = MCPClientDetector.getInstance();
      expect(detector).toBeInstanceOf(MCPClientDetector);
    });
  });

  describe("VS Code Detection", () => {
    it("should detect VS Code with high confidence when multiple env vars are present", () => {
      process.env.VSCODE_PID = "12345";
      process.env.VSCODE_IPC_HOOK = "/tmp/vscode-ipc-socket";
      process.env.VSCODE_HANDLES_UNCAUGHT_ERRORS = "true";
      process.env.VSCODE_NLS_CONFIG = '{"locale":"en"}';

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
      expect(clientInfo.confidence).toBe("high");
      expect(
        clientInfo.evidence.some((item) =>
          item.includes("VS Code environment variables:"),
        ),
      ).toBe(true);
    });

    it("should detect VS Code with medium confidence when fewer env vars are present", () => {
      process.env.VSCODE_INJECTION = "1";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
      expect(clientInfo.confidence).toBe("medium");
    });

    it("should detect VS Code Insiders", () => {
      process.env.VSCODE_IPC_HOOK = "/tmp/vscode-insider-ipc-socket";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
      expect(clientInfo.version).toBe("Insiders");
    });

    it("should provide extra guidance for VS Code", () => {
      process.env.VSCODE_PID = "12345";

      const detector = MCPClientDetector.getInstance();
      expect(detector.shouldProvideExtraGuidance()).toBe(true);
    });
  });

  describe("Claude Desktop Detection", () => {
    it("should detect Claude Desktop with high confidence", () => {
      process.env.CLAUDE_DESKTOP = "true";
      process.env.ANTHROPIC_API_KEY = "sk-ant-test";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Claude Desktop");
      expect(clientInfo.type).toBe("claude");
      expect(clientInfo.confidence).toBe("high");
      expect(
        clientInfo.evidence.some((item) =>
          item.includes("Claude environment variables:"),
        ),
      ).toBe(true);
    });

    it("should not provide extra guidance for Claude Desktop", () => {
      process.env.CLAUDE_DESKTOP = "true";

      const detector = MCPClientDetector.getInstance();
      expect(detector.shouldProvideExtraGuidance()).toBe(false);
    });
  });

  describe("Cline Detection", () => {
    it("should detect Cline with high confidence", () => {
      process.env.CLINE_EXTENSION_VERSION = "1.0.0";
      process.env.CLINE_API_KEY = "test-key";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Cline");
      expect(clientInfo.type).toBe("cline");
      expect(clientInfo.confidence).toBe("high");
    });

    it("should not provide extra guidance for Cline", () => {
      process.env.CLINE_EXTENSION_VERSION = "1.0.0";

      const detector = MCPClientDetector.getInstance();
      expect(detector.shouldProvideExtraGuidance()).toBe(false);
    });
  });

  describe("Continue Detection", () => {
    it("should detect Continue with high confidence", () => {
      process.env.CONTINUE_EXTENSION_VERSION = "1.0.0";
      process.env.CONTINUE_SERVER_PATH = "/path/to/continue";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Continue");
      expect(clientInfo.type).toBe("continue");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("Cursor Detection", () => {
    it("should detect Cursor with high confidence", () => {
      process.env.CURSOR_EXTENSION_VERSION = "1.0.0";
      process.env.CURSOR_API_KEY = "test-key";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Cursor");
      expect(clientInfo.type).toBe("cursor");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("JetBrains Detection", () => {
    it("should detect JetBrains IDE with high confidence", () => {
      process.env.JETBRAINS_IDE = "IntelliJ IDEA";
      process.env.IDE_VERSION = "2023.3";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("JetBrains IDE");
      expect(clientInfo.type).toBe("jetbrains");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("Warp Terminal Detection", () => {
    it("should detect Warp Terminal with high confidence", () => {
      process.env.WARP_VERSION = "1.0.0";
      process.env.WARP_CONFIG = "/path/to/config";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Warp Terminal");
      expect(clientInfo.type).toBe("warp");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("Zed Editor Detection", () => {
    it("should detect Zed Editor with high confidence", () => {
      process.env.ZED_VERSION = "1.0.0";
      process.env.ZED_CONFIG = "/path/to/config";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Zed Editor");
      expect(clientInfo.type).toBe("zed");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("Windsurf Editor Detection", () => {
    it("should detect Windsurf Editor with high confidence", () => {
      process.env.WINDSURF_VERSION = "1.0.0";
      process.env.WINDSURF_API_KEY = "test-key";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Windsurf Editor");
      expect(clientInfo.type).toBe("windsurf");
      expect(clientInfo.confidence).toBe("high");
    });
  });

  describe("Process-based Detection", () => {
    it("should detect VS Code from process title", () => {
      process.title = "Code - Insiders";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
      expect(
        clientInfo.evidence.some((item) =>
          item.includes("Process title: Code - Insiders"),
        ),
      ).toBe(true);
    });

    it("should detect Claude from process title", () => {
      process.title = "Claude Desktop";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Claude Desktop");
      expect(clientInfo.type).toBe("claude");
    });

    it("should detect VS Code from command line arguments", () => {
      process.argv = ["node", "/path/to/vscode/main.js", "--inspect"];

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.evidence).toContain(
        "VS Code detected in command line arguments",
      );
    });
  });

  describe("Unknown Client Fallback", () => {
    it("should default to unknown client when no detection methods match", () => {
      // Clear all environment variables and process info
      process.title = "node";
      process.argv = ["node", "script.js"];

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Unknown");
      expect(clientInfo.type).toBe("unknown");
      expect(clientInfo.confidence).toBe("low");
    });

    it("should provide extra guidance for unknown clients", () => {
      process.title = "node";

      const detector = MCPClientDetector.getInstance();
      expect(detector.shouldProvideExtraGuidance()).toBe(true);
    });
  });

  describe("MCP Environment Detection", () => {
    it("should detect MCP environment variables", () => {
      process.env.MCP_SERVER_NAME = "test-server";
      process.env.MCP_TRANSPORT = "stdio";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(
        clientInfo.evidence.some((item) =>
          item.includes("MCP environment variables:"),
        ),
      ).toBe(true);
    });
  });

  describe("System Information", () => {
    it("should include system information in evidence", () => {
      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(
        clientInfo.evidence.some((item) => item.includes("Platform:")),
      ).toBe(true);
      expect(
        clientInfo.evidence.some((item) => item.includes("Architecture:")),
      ).toBe(true);
      expect(
        clientInfo.evidence.some((item) => item.includes("Node version:")),
      ).toBe(true);
    });

    it("should include terminal and shell info when available", () => {
      process.env.TERM = "xterm-256color";
      process.env.SHELL = "/bin/zsh";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.evidence).toContain("Terminal: xterm-256color");
      expect(clientInfo.evidence).toContain("Shell: /bin/zsh");
    });
  });

  describe("Client Priority", () => {
    it("should prioritize VS Code over unknown when both could match", () => {
      process.env.VSCODE_PID = "12345";
      process.title = "unknown-app";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
    });

    it("should prioritize specific clients over process-based detection", () => {
      process.env.CLAUDE_DESKTOP = "true";
      process.title = "Code"; // This could match VS Code

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Claude Desktop");
      expect(clientInfo.type).toBe("claude");
    });
  });

  describe("Client-Specific Guidance", () => {
    it("should provide appropriate guidance for VS Code", () => {
      const detector = MCPClientDetector.getInstance();
      const guidance = detector.getClientSpecificGuidance(
        "Base guidance",
        "vscode",
      );

      expect(guidance).toContain("Base guidance");
      expect(guidance).toContain("VS Code Specific Tips");
      expect(guidance).toContain("explicit parameters");
    });

    it("should provide appropriate guidance for Claude Desktop", () => {
      const detector = MCPClientDetector.getInstance();
      const guidance = detector.getClientSpecificGuidance(
        "Base guidance",
        "claude",
      );

      expect(guidance).toContain("Base guidance");
      expect(guidance).toContain("Claude Desktop Tips");
      expect(guidance).toContain("flexible prompts");
    });

    it("should provide guidance for all supported client types", () => {
      const detector = MCPClientDetector.getInstance();
      const clientTypes = [
        "claude",
        "cline",
        "continue",
        "cursor",
        "jetbrains",
        "vscode",
        "warp",
        "zed",
        "windsurf",
        "unknown",
      ] as const;

      clientTypes.forEach((clientType) => {
        const guidance = detector.getClientSpecificGuidance(
          "Base guidance",
          clientType,
        );
        expect(guidance).toContain("Base guidance");
        expect(guidance.length).toBeGreaterThan("Base guidance".length);
      });
    });

    it("should use detected client type when no type is specified", () => {
      process.env.VSCODE_PID = "12345";

      const detector = MCPClientDetector.getInstance();
      const guidance = detector.getClientSpecificGuidance("Base guidance");

      expect(guidance).toContain("VS Code Specific Tips");
    });
  });

  describe("Detection Summary", () => {
    it("should provide accurate detection summary", () => {
      process.env.CLAUDE_DESKTOP = "true";

      const detector = MCPClientDetector.getInstance();
      const summary = detector.getDetectionSummary();

      expect(summary.client).toBe("Claude Desktop");
      expect(summary.type).toBe("claude");
      expect(summary.confidence).toBe("high");
    });

    it("should include version when available", () => {
      process.env.VSCODE_IPC_HOOK = "/tmp/vscode-insider-ipc-socket";

      const detector = MCPClientDetector.getInstance();
      const summary = detector.getDetectionSummary();

      expect(summary.version).toBe("Insiders");
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing HOME and USERPROFILE environment variables", () => {
      delete process.env.HOME;
      delete process.env.USERPROFILE;
      process.env.CLAUDE_DESKTOP = "true";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("Claude Desktop");
      expect(clientInfo.type).toBe("claude");
    });

    it("should handle invalid JSON in VSCODE_NLS_CONFIG", () => {
      process.env.VSCODE_PID = "12345";
      process.env.VSCODE_NLS_CONFIG = "invalid-json{";

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      expect(clientInfo.name).toBe("VS Code");
      expect(clientInfo.type).toBe("vscode");
      // Should not crash on invalid JSON
    });

    it("should handle process detection errors gracefully", () => {
      // Mock process.ppid to trigger parent process detection
      Object.defineProperty(process, "ppid", {
        configurable: true,
        value: 99999, // Non-existent PID
        writable: true,
      });

      const detector = MCPClientDetector.getInstance();
      const clientInfo = detector.getClientInfo();

      // Should not crash on process detection failure
      expect(clientInfo).toBeDefined();
      expect(
        clientInfo.evidence.some((item) => item.includes("Parent process ID:")),
      ).toBe(true);
    });
  });
});
