export type ClientType =
  | "claude"
  | "cline"
  | "continue"
  | "cursor"
  | "jetbrains"
  | "unknown"
  | "vscode"
  | "warp"
  | "windsurf"
  | "zed";

export type ConfidenceLevel = "high" | "low" | "medium";

export class MCPClient {
  public readonly confidence: ConfidenceLevel;
  public readonly name: string;
  public readonly type: ClientType;
  public readonly version?: string;
  public get evidence(): readonly string[] {
    return [...this.evidenceList];
  }

  public get evidenceCount(): number {
    return this.evidenceList.length;
  }

  private readonly evidenceList: string[] = [];

  constructor(
    name: string,
    type: ClientType,
    confidence: ConfidenceLevel,
    version?: string,
  ) {
    this.name = name;
    this.type = type;
    this.confidence = confidence;
    this.version = version;
  }

  public addEvidence(evidence: string): void {
    this.evidenceList.push(evidence);
  }

  public addEvidenceList(evidenceArray: string[]): void {
    this.evidenceList.push(...evidenceArray);
  }

  public getClientSpecificTips(): string {
    const clientSpecificTips: Record<ClientType, string> = {
      claude: `
💡 **Claude Desktop Tips:**
- Claude Desktop handles flexible prompts well
- You can use natural language date expressions like "last week"
- Claude Desktop has better error recovery for API fallbacks`,

      cline: `
🤖 **Cline (VS Code Extension) Tips:**
- Cline works within VS Code and can create/manage MCP servers
- You can ask Cline to "add a tool that..." to create new MCP capabilities
- Cline displays configured MCP servers with their tools and resources
- Check ~/Documents/Cline/MCP for custom servers Cline creates`,

      continue: `
⚡ **Continue (IDE Extension) Tips:**
- Type "@" to mention MCP resources in Continue
- Prompt templates show up as slash commands
- Continue supports both VS Code and JetBrains IDEs
- Works with any LLM provider you configure`,

      cursor: `
🎯 **Cursor Editor Tips:**
- Cursor supports MCP tools in Composer mode
- Works with both STDIO and SSE transport protocols
- Cursor integrates MCP directly into its AI coding workflows
- Use explicit parameters for best results with Cursor's AI`,

      jetbrains: `
🚀 **JetBrains AI Assistant Tips:**
- MCP tools work across all JetBrains IDEs (IntelliJ, PyCharm, etc.)
- Deep integration with IDE workflows and code intelligence
- Supports both local and remote MCP servers
- Context-aware AI chat understands your project structure`,

      unknown: `
⚡ **General MCP Client Tips:**
- Use explicit parameters for best compatibility
- Specify date ranges when requesting usage metrics
- Different MCP clients may handle errors differently`,

      vscode: `
🔧 **VS Code Specific Tips:**
- VS Code's MCP client works best with explicit parameters
- If you encounter loops, restart VS Code completely
- Use specific date ranges to avoid compatibility issues
- Try the Command Palette (Ctrl/Cmd+Shift+P) if prompts don't work`,

      warp: `
🖥️ **Warp Terminal Tips:**
- Warp's Agent Mode provides natural language MCP integration
- Use the built-in UI to manage CLI or SSE-based MCP servers
- Live discovery shows tools/resources from running servers
- Configure servers to start automatically or launch manually`,

      windsurf: `
🌊 **Windsurf Editor Tips:**
- Windsurf's AI Flow enables collaborative human-AI interactions
- MCP tools integrate with the agentic development workflow
- Supports multi-model AI assistance
- Innovative approach to AI-assisted development`,

      zed: `
⚡ **Zed Editor Tips:**
- Prompt templates appear as slash commands in Zed
- Tight integration with editor features and workspace context
- High-performance editor optimized for speed
- Note: Zed doesn't currently support MCP resources`,
    };

    return clientSpecificTips[this.type];
  }

  public getGuidanceWithTips(baseGuidance: string): string {
    return baseGuidance + "\n\n" + this.getClientSpecificTips();
  }

  public getSummary(): {
    client: string;
    confidence: string;
    type: string;
    version?: string;
  } {
    return {
      client: this.name,
      confidence: this.confidence,
      type: this.type,
      version: this.version,
    };
  }

  public shouldProvideExtraGuidance(): boolean {
    // Provide extra guidance for VS Code or unknown clients
    return this.type === "vscode" || this.type === "unknown";
  }

  public toClientInfo(): {
    confidence: ConfidenceLevel;
    evidence: string[];
    name: string;
    type: ClientType;
    version?: string;
  } {
    return {
      confidence: this.confidence,
      evidence: [...this.evidence],
      name: this.name,
      type: this.type,
      version: this.version,
    };
  }

  public toString(): string {
    const versionStr = this.version ? ` (${this.version})` : "";
    return `${this.name}${versionStr} [${this.type}] - ${this.confidence} confidence`;
  }
}
