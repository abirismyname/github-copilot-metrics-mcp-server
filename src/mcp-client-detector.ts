import { execSync } from "child_process";

import { Logger } from "./logger.js";
import { ClientType, ConfidenceLevel, MCPClient } from "./mcp-client.js";

const logger = Logger.getInstance();

// Legacy interface for backward compatibility - use MCPClient.toClientInfo() instead
export interface ClientInfo {
  confidence: ConfidenceLevel;
  evidence: string[];
  name: string;
  type: ClientType;
  version?: string;
}

export class MCPClientDetector {
  private static instance: MCPClientDetector;
  private detectedClient: MCPClient | null = null;

  private constructor() {}

  public static getInstance(): MCPClientDetector {
    if (!MCPClientDetector.instance) {
      MCPClientDetector.instance = new MCPClientDetector();
    }
    return MCPClientDetector.instance;
  }

  public getClient(): MCPClient {
    if (!this.detectedClient) {
      this.detectedClient = this.detectClient();
      this.logDetectionResults();
    }
    return this.detectedClient;
  }

  public getClientInfo(): ClientInfo {
    if (!this.detectedClient) {
      this.detectedClient = this.detectClient();
      this.logDetectionResults();
    }
    return this.detectedClient.toClientInfo();
  }

  public getClientSpecificGuidance(
    baseGuidance: string,
    clientType?: ClientType,
  ): string {
    const client = this.getClient();
    const type = clientType || client.type;

    // Create a temporary client if we need to get tips for a different type
    if (type !== client.type) {
      const tempClient = new MCPClient("Temp", type, "low");
      return tempClient.getGuidanceWithTips(baseGuidance);
    }

    return client.getGuidanceWithTips(baseGuidance);
  }

  public getDetectionSummary(): {
    client: string;
    confidence: string;
    type: string;
    version?: string;
  } {
    const client = this.getClient();
    return client.getSummary();
  }

  public shouldProvideExtraGuidance(): boolean {
    const client = this.getClient();
    return client.shouldProvideExtraGuidance();
  }

  private detectClaude(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Claude Desktop specific environment variables
    const claudeIndicators = [
      "CLAUDE_DESKTOP",
      "CLAUDE_API_KEY",
      "ANTHROPIC_API_KEY",
      "CLAUDE_CONFIG_PATH",
    ];

    const foundIndicators = claudeIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Claude environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Claude Desktop config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const claudePaths = [
        `${homeDir}/Library/Application Support/Claude`,
        `${homeDir}/.config/claude`,
        `${homeDir}/AppData/Roaming/Claude`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(`Expected Claude config paths: ${claudePaths.join(", ")}`);
    }

    return { confidence, detected, evidence, version };
  }

  private detectClient(): MCPClient {
    const evidence: string[] = [];
    let clientName = "Unknown";
    let clientType: ClientType = "unknown";
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // VS Code detection
    const vsCodeDetection = this.detectVSCode();
    if (vsCodeDetection.detected) {
      evidence.push(...vsCodeDetection.evidence);
      clientName = "VS Code";
      clientType = "vscode";
      confidence = vsCodeDetection.confidence;
      version = vsCodeDetection.version;
    }

    // Claude Desktop detection
    const claudeDetection = this.detectClaude();
    if (claudeDetection.detected && clientType === "unknown") {
      evidence.push(...claudeDetection.evidence);
      clientName = "Claude Desktop";
      clientType = "claude";
      confidence = claudeDetection.confidence;
      version = claudeDetection.version;
    }

    // Cline detection (VS Code extension)
    const clineDetection = this.detectCline();
    if (clineDetection.detected && clientType === "unknown") {
      evidence.push(...clineDetection.evidence);
      clientName = "Cline";
      clientType = "cline";
      confidence = clineDetection.confidence;
      version = clineDetection.version;
    }

    // Continue detection (IDE extension)
    const continueDetection = this.detectContinue();
    if (continueDetection.detected && clientType === "unknown") {
      evidence.push(...continueDetection.evidence);
      clientName = "Continue";
      clientType = "continue";
      confidence = continueDetection.confidence;
      version = continueDetection.version;
    }

    // Cursor detection
    const cursorDetection = this.detectCursor();
    if (cursorDetection.detected && clientType === "unknown") {
      evidence.push(...cursorDetection.evidence);
      clientName = "Cursor";
      clientType = "cursor";
      confidence = cursorDetection.confidence;
      version = cursorDetection.version;
    }

    // JetBrains detection
    const jetbrainsDetection = this.detectJetBrains();
    if (jetbrainsDetection.detected && clientType === "unknown") {
      evidence.push(...jetbrainsDetection.evidence);
      clientName = "JetBrains IDE";
      clientType = "jetbrains";
      confidence = jetbrainsDetection.confidence;
      version = jetbrainsDetection.version;
    }

    // Warp Terminal detection
    const warpDetection = this.detectWarp();
    if (warpDetection.detected && clientType === "unknown") {
      evidence.push(...warpDetection.evidence);
      clientName = "Warp Terminal";
      clientType = "warp";
      confidence = warpDetection.confidence;
      version = warpDetection.version;
    }

    // Zed Editor detection
    const zedDetection = this.detectZed();
    if (zedDetection.detected && clientType === "unknown") {
      evidence.push(...zedDetection.evidence);
      clientName = "Zed Editor";
      clientType = "zed";
      confidence = zedDetection.confidence;
      version = zedDetection.version;
    }

    // Windsurf Editor detection
    const windsurfDetection = this.detectWindsurf();
    if (windsurfDetection.detected && clientType === "unknown") {
      evidence.push(...windsurfDetection.evidence);
      clientName = "Windsurf Editor";
      clientType = "windsurf";
      confidence = windsurfDetection.confidence;
      version = windsurfDetection.version;
    }

    // Process-based detection
    const processDetection = this.detectFromProcess();
    if (processDetection.detected && clientType === "unknown") {
      evidence.push(...processDetection.evidence);
      clientName = processDetection.name;
      clientType = processDetection.type;
      confidence = processDetection.confidence;
    }

    // Parent process detection
    const parentDetection = this.detectFromParentProcess();
    evidence.push(...parentDetection.evidence);
    if (parentDetection.detected) {
      if (clientType === "unknown") {
        clientName = parentDetection.name;
        clientType = parentDetection.type;
        confidence = parentDetection.confidence;
      }
    }

    // MCP environment variables
    const mcpDetection = this.detectMCPEnvironment();
    evidence.push(...mcpDetection.evidence);

    // System information
    const systemInfo = this.getSystemInfo();
    evidence.push(...systemInfo);

    // Create the final client with all evidence
    const client = new MCPClient(clientName, clientType, confidence, version);
    client.addEvidenceList(evidence);
    return client;
  }

  private detectCline(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Cline specific environment variables
    const clineIndicators = [
      "CLINE_EXTENSION_VERSION",
      "CLINE_SERVER_PATH",
      "CLINE_API_KEY",
    ];

    const foundIndicators = clineIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Cline environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Cline config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const clinePaths = [
        `${homeDir}/.config/cline`,
        `${homeDir}/Library/Application Support/Cline`,
        `${homeDir}/AppData/Roaming/Cline`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(`Expected Cline config paths: ${clinePaths.join(", ")}`);
    }

    return { confidence, detected, evidence, version };
  }

  private detectContinue(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Continue specific environment variables
    const continueIndicators = [
      "CONTINUE_EXTENSION_VERSION",
      "CONTINUE_SERVER_PATH",
      "CONTINUE_API_KEY",
    ];

    const foundIndicators = continueIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Continue environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Continue config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const continuePaths = [
        `${homeDir}/.config/continue`,
        `${homeDir}/Library/Application Support/Continue`,
        `${homeDir}/AppData/Roaming/Continue`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(
        `Expected Continue config paths: ${continuePaths.join(", ")}`,
      );
    }

    return { confidence, detected, evidence, version };
  }

  private detectCursor(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Cursor specific environment variables
    const cursorIndicators = [
      "CURSOR_EXTENSION_VERSION",
      "CURSOR_SERVER_PATH",
      "CURSOR_API_KEY",
    ];

    const foundIndicators = cursorIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Cursor environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Cursor config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const cursorPaths = [
        `${homeDir}/.config/cursor`,
        `${homeDir}/Library/Application Support/Cursor`,
        `${homeDir}/AppData/Roaming/Cursor`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(`Expected Cursor config paths: ${cursorPaths.join(", ")}`);
    }

    return { confidence, detected, evidence, version };
  }

  private detectFromParentProcess(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    name: string;
    type: "claude" | "unknown" | "vscode";
  } {
    const evidence: string[] = [];
    let detected = false;
    let name = "Unknown";
    let type: "claude" | "unknown" | "vscode" = "unknown";
    let confidence: ConfidenceLevel = "low";

    if (process.ppid) {
      evidence.push(`Parent process ID: ${process.ppid}`);

      try {
        // Try to get parent process name (Unix-like systems)
        const parentInfo = execSync(
          `ps -p ${process.ppid} -o comm= 2>/dev/null || echo "unknown"`,
          {
            encoding: "utf8",
            timeout: 1000,
          },
        ).trim();

        if (parentInfo && parentInfo !== "unknown") {
          evidence.push(`Parent process: ${parentInfo}`);

          if (parentInfo.includes("code") || parentInfo.includes("Code")) {
            detected = true;
            name = "VS Code";
            type = "vscode";
            confidence = "high";
          }

          if (parentInfo.includes("claude") || parentInfo.includes("Claude")) {
            detected = true;
            name = "Claude Desktop";
            type = "claude";
            confidence = "high";
          }

          // Check for Electron (which both VS Code and Claude Desktop use)
          if (
            parentInfo.includes("electron") ||
            parentInfo.includes("Electron")
          ) {
            evidence.push("Electron-based application detected");
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_e) {
        // Ignore errors from process detection on non-Unix systems
        evidence.push("Parent process detection failed (likely Windows)");
      }
    }

    return { confidence, detected, evidence, name, type };
  }

  private detectFromProcess(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    name: string;
    type: "claude" | "unknown" | "vscode";
  } {
    const evidence: string[] = [];
    let detected = false;
    let name = "Unknown";
    let type: "claude" | "unknown" | "vscode" = "unknown";
    let confidence: ConfidenceLevel = "low";

    // Check process title
    if (process.title) {
      evidence.push(`Process title: ${process.title}`);

      if (process.title.includes("code") || process.title.includes("Code")) {
        detected = true;
        name = "VS Code";
        type = "vscode";
        confidence = "medium";
      }

      if (
        process.title.includes("claude") ||
        process.title.includes("Claude")
      ) {
        detected = true;
        name = "Claude Desktop";
        type = "claude";
        confidence = "medium";
      }
    }

    // Check command line arguments
    const args = process.argv.join(" ");
    if (args.includes("vscode") || args.includes("code")) {
      evidence.push("VS Code detected in command line arguments");
      if (!detected) {
        detected = true;
        name = "VS Code";
        type = "vscode";
        confidence = "medium";
      }
    }

    if (args.includes("claude") || args.includes("Claude")) {
      evidence.push("Claude detected in command line arguments");
      if (!detected) {
        detected = true;
        name = "Claude Desktop";
        type = "claude";
        confidence = "medium";
      }
    }

    return { confidence, detected, evidence, name, type };
  }

  private detectJetBrains(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check JetBrains specific environment variables
    const jetbrainsIndicators = ["JETBRAINS_IDE", "IDE_PATH", "IDE_VERSION"];

    const foundIndicators = jetbrainsIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `JetBrains environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for JetBrains config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const jetbrainsPaths = [
        `${homeDir}/.config/JetBrains`,
        `${homeDir}/Library/Application Support/JetBrains`,
        `${homeDir}/AppData/Roaming/JetBrains`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(
        `Expected JetBrains config paths: ${jetbrainsPaths.join(", ")}`,
      );
    }

    return { confidence, detected, evidence, version };
  }

  private detectMCPEnvironment(): { evidence: string[] } {
    const evidence: string[] = [];

    // Check for MCP-specific environment variables
    const mcpVars = Object.keys(process.env).filter((key) =>
      key.startsWith("MCP_"),
    );
    if (mcpVars.length > 0) {
      evidence.push(`MCP environment variables: ${mcpVars.join(", ")}`);
    }

    // Check for common MCP server environment variables
    const commonMCPVars = [
      "MCP_SERVER_NAME",
      "MCP_CLIENT_NAME",
      "MCP_TRANSPORT",
      "MCP_DEBUG",
    ];

    const foundMCPVars = commonMCPVars.filter(
      (varName) => process.env[varName],
    );
    if (foundMCPVars.length > 0) {
      evidence.push(`Common MCP variables: ${foundMCPVars.join(", ")}`);
    }

    return { evidence };
  }

  private detectVSCode(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check VS Code specific environment variables
    const vsCodeIndicators = [
      "VSCODE_PID",
      "VSCODE_IPC_HOOK",
      "VSCODE_HANDLES_UNCAUGHT_ERRORS",
      "VSCODE_NLS_CONFIG",
      "VSCODE_CWD",
      "ELECTRON_RUN_AS_NODE",
      "VSCODE_INJECTION",
    ];

    const foundIndicators = vsCodeIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `VS Code environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = foundIndicators.length >= 3 ? "high" : "medium";

      // Try to extract version information
      if (process.env.VSCODE_NLS_CONFIG) {
        try {
          const nlsConfig = JSON.parse(process.env.VSCODE_NLS_CONFIG);
          if (nlsConfig.locale) {
            evidence.push(`VS Code locale: ${nlsConfig.locale}`);
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Ignore JSON parse errors
        }
      }

      // Check for VS Code Insiders
      if (
        process.env.VSCODE_IPC_HOOK &&
        process.env.VSCODE_IPC_HOOK.includes("insider")
      ) {
        evidence.push("VS Code Insiders detected");
        version = "Insiders";
      }
    }

    return { confidence, detected, evidence, version };
  }

  private detectWarp(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Warp specific environment variables
    const warpIndicators = ["WARP_VERSION", "WARP_CONFIG", "WARP_API_KEY"];

    const foundIndicators = warpIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Warp environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Warp config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const warpPaths = [
        `${homeDir}/.config/warp`,
        `${homeDir}/Library/Application Support/Warp`,
        `${homeDir}/AppData/Roaming/Warp`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(`Expected Warp config paths: ${warpPaths.join(", ")}`);
    }

    return { confidence, detected, evidence, version };
  }

  private detectWindsurf(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Windsurf specific environment variables
    const windsurfIndicators = [
      "WINDSURF_VERSION",
      "WINDSURF_CONFIG",
      "WINDSURF_API_KEY",
    ];

    const foundIndicators = windsurfIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(
        `Windsurf environment variables: ${foundIndicators.join(", ")}`,
      );
      confidence = "high";
    }

    // Check for Windsurf config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const windsurfPaths = [
        `${homeDir}/.config/windsurf`,
        `${homeDir}/Library/Application Support/Windsurf`,
        `${homeDir}/AppData/Roaming/Windsurf`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(
        `Expected Windsurf config paths: ${windsurfPaths.join(", ")}`,
      );
    }

    return { confidence, detected, evidence, version };
  }

  private detectZed(): {
    confidence: ConfidenceLevel;
    detected: boolean;
    evidence: string[];
    version?: string;
  } {
    const evidence: string[] = [];
    let detected = false;
    let confidence: ConfidenceLevel = "low";
    let version: string | undefined;

    // Check Zed specific environment variables
    const zedIndicators = ["ZED_VERSION", "ZED_CONFIG", "ZED_API_KEY"];

    const foundIndicators = zedIndicators.filter(
      (indicator) => process.env[indicator],
    );

    if (foundIndicators.length > 0) {
      detected = true;
      evidence.push(`Zed environment variables: ${foundIndicators.join(", ")}`);
      confidence = "high";
    }

    // Check for Zed config file path patterns
    if (process.env.HOME || process.env.USERPROFILE) {
      const homeDir = process.env.HOME || process.env.USERPROFILE;
      const zedPaths = [
        `${homeDir}/.config/zed`,
        `${homeDir}/Library/Application Support/Zed`,
        `${homeDir}/AppData/Roaming/Zed`,
      ];

      // Note: We don't actually check file system here to avoid permissions issues
      // But we could log the expected paths
      evidence.push(`Expected Zed config paths: ${zedPaths.join(", ")}`);
    }

    return { confidence, detected, evidence, version };
  }

  private getSystemInfo(): string[] {
    const evidence: string[] = [];

    evidence.push(`Platform: ${process.platform}`);
    evidence.push(`Architecture: ${process.arch}`);
    evidence.push(`Node version: ${process.version}`);

    if (process.env.TERM) {
      evidence.push(`Terminal: ${process.env.TERM}`);
    }

    if (process.env.SHELL) {
      evidence.push(`Shell: ${process.env.SHELL}`);
    }

    return evidence;
  }

  private logDetectionResults(): void {
    if (!this.detectedClient) return;

    logger.info("MCP Client detected", {
      client: this.detectedClient.name,
      confidence: this.detectedClient.confidence,
      evidenceCount: this.detectedClient.evidenceCount,
      type: this.detectedClient.type,
      version: this.detectedClient.version,
    });

    logger.debug("Client detection evidence", {
      evidence: this.detectedClient.evidence,
    });
  }
}
