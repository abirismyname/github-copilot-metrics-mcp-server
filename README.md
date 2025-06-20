# GitHub Copilot Metrics MCP Server

<div align="center">

[![Docker](https://img.shields.io/badge/Docker-Available-blue?style=for-the-badge&logo=docker)](https://hub.docker.com/r/github/copilot-metrics-mcp-server)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

<a href="https://marketplace.visualstudio.com/items?itemName=github.copilot-metrics-mcp-server">
  <img src="https://img.shields.io/badge/VS%20Code-Install%20Server-blue?style=for-the-badge&logo=visual-studio-code" alt="Install for VS Code">
</a>
<a href="https://marketplace.visualstudio.com/items?itemName=github.copilot-metrics-mcp-server">
  <img src="https://img.shields.io/badge/VS%20Code%20Insiders-Install%20Server-green?style=for-the-badge&logo=visual-studio-code" alt="Install for VS Code Insiders">
</a>

<!-- One-Click Deploy Buttons -->
<a href="https://railway.app/template/github-copilot-metrics-mcp-server">
  <img src="https://railway.app/button.svg" alt="Deploy on Railway" height="32">
</a>
<a href="https://render.com/deploy?repo=https://github.com/abirismyname/github-copilot-metrics-mcp-server">
  <img src="https://render.com/images/deploy-to-render-button.svg" alt="Deploy to Render" height="32">
</a>
<a href="https://fly.io/deploy?repo=https://github.com/abirismyname/github-copilot-metrics-mcp-server">
  Deploy to Fly.io
</a>

<!-- Development Environment Buttons -->
<a href="https://github.dev/github-copilot-metrics-mcp-server">
  <img src="https://img.shields.io/badge/GitHub-Codespaces-blue?style=for-the-badge&logo=github" alt="Open in GitHub Codespaces">
</a>

<!-- Quick Actions -->
<a href="https://github.com/abirismyname/github-copilot-metrics-mcp-server/fork">
  <img src="https://img.shields.io/badge/Fork-Repository-orange?style=for-the-badge&logo=github" alt="Fork Repository">
</a>
<a href="https://github.com/abirismyname/github-copilot-metrics-mcp-server/issues/new?template=bug_report.md">
  <img src="https://img.shields.io/badge/Report-Bug-red?style=for-the-badge&logo=github" alt="Report Bug">
</a>
<a href="https://github.com/abirismyname/github-copilot-metrics-mcp-server/issues/new?template=feature_request.md">
  <img src="https://img.shields.io/badge/Request-Feature-brightgreen?style=for-the-badge&logo=github" alt="Request Feature">
</a>

</div>

A Model Context Protocol (MCP) server for managing GitHub Copilot metrics and user management using the [FastMCP](https://github.com/punkpeye/fastmcp) framework.

This server provides comprehensive tools for GitHub Copilot administration, including usage metrics, seat management, and reporting capabilities with robust error handling and logging.

## Quick Install

### One-Click Installation

```bash
# Install globally via npm
npm install -g github-copilot-metrics-mcp-server

# Or run with Docker
docker run --env-file .env ghcr.io/github-copilot-metrics-mcp-server
```

### VS Code Integration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "github-copilot-metrics-mcp-server",
      "env": { "GITHUB_TOKEN": "your_token_here" }
    }
  }
}
```

## Installation

You can install this server as a package, run it locally, or use Docker.

### Install via npm (Recommended)

```bash
npm install -g github-copilot-metrics-mcp-server
```

### Local Development

```bash
git clone <your-repository-url>
cd github-copilot-metrics-mcp-server
npm install
npm run build
```

### Docker (Containerized)

#### Using Docker Compose (Recommended)

```bash
git clone <your-repository-url>
cd github-copilot-metrics-mcp
cp .env.example .env
# Edit .env with your GitHub token
docker-compose up -d
```

#### Using Docker directly

```bash
# Build the image
docker build -t github-copilot-metrics-mcp .

# Run the container
docker run --env-file .env github-copilot-metrics-mcp
```

## Usage with Claude Desktop

To use this MCP server with Claude Desktop, add the following to your Claude Desktop configuration file:

### On macOS

Edit the file at `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "github-copilot-metrics-mcp-server",
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### On Windows

Edit the file at `%APPDATA%/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "github-copilot-metrics-mcp-server",
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### For Local Development

If you're running the server locally, use the local path:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "node",
      "args": ["/path/to/github-copilot-metrics-mcp-server/dist/server.js"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### For Docker Container

If you're running the server in a Docker container, you can use the container directly:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "docker",
      "args": ["run", "--rm", "--env-file", "/path/to/.env", "github-copilot-metrics-mcp"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

### Environment Variables

You can configure the server using environment variables in the configuration:

```json
{
  "mcpServers": {
    "github-copilot": {
      "command": "github-copilot-metrics-mcp-server",
      "env": {
        "GITHUB_TOKEN": "your_github_token_here",
        "LOG_LEVEL": "info",
        "API_TIMEOUT": "30000",
        "CACHE_TTL": "300"
      }
    }
  }
}
```

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Quick Start

To get started, clone the repository and install the dependencies.

```bash
git clone <your-repository-url>
cd github-copilot-metrics-mcp-server
npm install
```

Set up your GitHub authentication by creating a `.env` file:

```bash
GITHUB_TOKEN=your_github_personal_access_token
```

Then start the server:

```bash
npm run build
npm start
```

### Development

If you want to run the server in development mode:

```bash
npm run dev
```

This will start the server and allow you to interact with it using CLI.

### Testing

Run the comprehensive test suite to ensure everything is working correctly:

```bash
npm run test
```

The tests cover GitHub service functionality, error handling, validation, and API operations.

### Linting and Formatting

This project uses [Prettier](https://prettier.io/), [ESLint](https://eslint.org/) and [TypeScript ESLint](https://typescript-eslint.io/) for code quality.

```bash
npm run lint    # Check for linting issues
npm run format  # Format the code
```

## Docker Deployment

### Building and Running with Docker

The server can be containerized using Docker for easy deployment and isolation.

#### Prerequisites

- Docker and Docker Compose installed
- `.env` file with your GitHub credentials

#### Quick Start with Docker Compose

1. Clone the repository:

```bash
git clone <your-repository-url>
cd github-copilot-metrics-mcp-server
```

2. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your GitHub token
```

3. Start the container:

```bash
npm run docker:up
```

4. View logs:

```bash
npm run docker:logs
```

5. Stop the container:

```bash
npm run docker:down
```

#### Manual Docker Commands

Build the image:

```bash
npm run docker:build
# or
docker build -t github-copilot-metrics-mcp-server .
```

Run the container:

```bash
npm run docker:run
# or
docker run --env-file .env github-copilot-metrics-mcp-server
```

#### Docker Environment Variables

The container supports the same environment variables as the local installation:

```bash
GITHUB_TOKEN=your_token_here
LOG_LEVEL=info
API_TIMEOUT=30000
CACHE_TTL=300
```

#### Production Deployment

For production deployments, consider:

- Using Docker secrets for sensitive credentials
- Setting resource limits (memory, CPU)
- Implementing health checks
- Using a reverse proxy if exposing HTTP endpoints
- Setting up log aggregation

Example production docker-compose.yml:

```yaml
version: '3.8'
services:
  github-copilot-metrics-mcp-server:
    image: github-copilot-metrics-mcp-server:latest
    restart: unless-stopped
    environment:
      - LOG_LEVEL=warn
    secrets:
      - github_token
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3

secrets:
  github_token:
    external: true
```

## Features

### Copilot Metrics

- Get usage metrics for organizations
- Get usage metrics for enterprises  
- List Copilot seats
- Get seat details for specific users

### User Management

- Add Copilot seats for users
- Remove Copilot seats for users

### Advanced Features

- **Robust Error Handling**: Comprehensive error handling with retry logic and meaningful error messages
- **Input Validation**: Validates all inputs including organization names, usernames, and date formats
- **Structured Logging**: Configurable logging levels (error, warn, info, debug) for better observability
- **Configuration Management**: Environment variable validation and type-safe configuration
- **Authentication Flexibility**: Supports both GitHub Personal Access Tokens and GitHub App authentication

## Configuration

Create a `.env` file in the root directory with the following options:

```bash
# GitHub Authentication (required - choose one method)
GITHUB_TOKEN=your_github_personal_access_token

# OR use GitHub App authentication
# GITHUB_APP_ID=your_app_id
# GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
# GITHUB_INSTALLATION_ID=your_installation_id

# Server Configuration (optional)
LOG_LEVEL=info              # error, warn, info, debug
API_TIMEOUT=30000           # API request timeout in milliseconds
CACHE_TTL=300              # Cache time-to-live in seconds

# Rate Limiting (optional)
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### Authentication Setup

#### Personal Access Token (Recommended for getting started)

1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate a new token with `copilot` scope
3. Add it to your `.env` file as `GITHUB_TOKEN`

#### GitHub App (Recommended for production)

1. Create a GitHub App with Copilot permissions
2. Generate a private key
3. Install the app on your organization
4. Add the app credentials to your `.env` file

## Available Tools

The server provides the following MCP tools:

- `get_copilot_usage_org` - Get Copilot usage metrics for an organization
- `get_copilot_usage_enterprise` - Get Copilot usage metrics for an enterprise  
- `list_copilot_seats` - List all Copilot seats in an organization
- `add_copilot_seats` - Add Copilot seats for users
- `remove_copilot_seats` - Remove Copilot seats for users
- `get_copilot_seat_details` - Get seat details for a specific user

## Examples

Here are some example prompts you can use with this GitHub Copilot Metrics MCP server:

### Getting Usage Metrics

- "Show me the Copilot usage metrics for my organization for the last 30 days"
- "Get the current Copilot seat utilization for the 'acme-corp' organization"  
- "What are the usage trends for our enterprise Copilot deployment?"

### Managing User Seats

- "Add Copilot seats for users: john.doe, jane.smith, and bob.wilson"
- "Remove Copilot access for the user 'former-employee'"
- "Show me the details of john.doe's Copilot seat"

### Generating Reports

- "Analyze our Copilot usage data and provide recommendations for optimization"
- "Create a summary report of our Copilot metrics for the executive team"
- "Compare this month's usage with last month and highlight key changes"

### Bulk Operations

- "List all users with Copilot seats in our organization"
- "Add Copilot seats for all members of the 'engineering' team"
- "Show me which users haven't used Copilot in the last 30 days"

### Enterprise Management

- "Get enterprise-wide Copilot usage metrics for our organization"
- "Show me seat utilization across all organizations in our enterprise"
- "Generate a cost analysis report for our Copilot deployment"

## Error Handling

The server includes comprehensive error handling for common scenarios:

- **Invalid Credentials**: Clear messages for authentication failures
- **Rate Limiting**: Automatic retry with exponential backoff
- **Validation Errors**: Detailed feedback for invalid inputs
- **Network Issues**: Retry logic for transient failures
- **Resource Not Found**: Helpful suggestions for missing resources

## Logging

The server provides structured logging with configurable levels:

```bash
LOG_LEVEL=debug  # Shows all operations and API calls
LOG_LEVEL=info   # Shows major operations (default)
LOG_LEVEL=warn   # Shows warnings and errors only
LOG_LEVEL=error  # Shows errors only
```

## Contributing

To contribute to this project:

```bash
git clone <repository-url>
cd github-copilot-metrics-mcp-server
npm install
npm run dev     # Start in development mode
npm test        # Run tests
npm run lint    # Check code quality
npm run format  # Format code
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
