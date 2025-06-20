# FastMCP Boilerplate

A boilerplate for [FastMCP](https://github.com/punkpeye/fastmcp).

This boilerplate is a good starting point for building an MCP server. It includes a basic setup for testing, linting, formatting, and publishing to NPM.

## Development

To get started, clone the repository and install the dependencies.

```bash
git clone https://github.com/punkpeye/fastmcp-boilerplate.git
cd fastmcp-boilerplate
npm install
npm run dev
```

> [!NOTE]
> If you are starting a new project, you may want to fork [fastmcp-boilerplate](https://github.com/punkpeye/fastmcp-boilerplate) and start from there.

### Start the server

If you simply want to start the server, you can use the `start` script.

```bash
npm run start
```

However, you can also interact with the server using the `dev` script.

```bash
npm run dev
```

This will start the server and allow you to interact with it using CLI.

### Testing

A good MCP server should have tests. However, you don't need to test the MCP server itself, but rather the tools you implement.

```bash
npm run test
```

In the case of this boilerplate, we only test the implementation of the `add` tool.

### Linting

Having a good linting setup reduces the friction for other developers to contribute to your project.

```bash
npm run lint
```

This boilerplate uses [Prettier](https://prettier.io/), [ESLint](https://eslint.org/) and [TypeScript ESLint](https://typescript-eslint.io/) to lint the code.

### Formatting

Use `npm run format` to format the code.

```bash
npm run format
```

### GitHub Actions

This repository has a GitHub Actions workflow that runs linting, formatting, tests, and publishes package updates to NPM using [semantic-release](https://semantic-release.gitbook.io/semantic-release/).

In order to use this workflow, you need to:

1. Add `NPM_TOKEN` to the repository secrets
   1. [Create a new automation token](https://www.npmjs.com/settings/punkpeye/tokens/new)
   2. Add token as `NPM_TOKEN` environment secret (Settings → Secrets and Variables → Actions → "Manage environment secrets" → "release" → Add environment secret)
1. Grant write access to the workflow (Settings → Actions → General → Workflow permissions → "Read and write permissions")

# GitHub Copilot MCP Server

A Model Context Protocol (MCP) server for managing GitHub Copilot metrics and user management using the FastMCP framework.

## Features

### Copilot Metrics
- Get usage metrics for organizations
- Get usage metrics for enterprises
- List Copilot seats
- Get seat details for specific users

### User Management
- Add Copilot seats for users
- Remove Copilot seats for users

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up authentication by creating a `.env` file:

```bash
GITHUB_TOKEN=your_github_personal_access_token
```

3. Build and run:
```bash
npm run build
npm start
```

## Development

```bash
npm run dev    # Run in development mode
npm test       # Run tests
npm run build  # Build for production
```

## Examples

Here are some example prompts you can use with this GitHub Copilot MCP server:

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
