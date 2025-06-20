# GitHub Copilot MCP Server

A Model Context Protocol (MCP) server for managing GitHub Copilot metrics and user management using the [FastMCP](https://github.com/punkpeye/fastmcp) framework.

This server provides comprehensive tools for GitHub Copilot administration, including usage metrics, seat management, and reporting capabilities with robust error handling and logging.

## Quick Start

To get started, clone the repository and install the dependencies.

```bash
git clone <your-repository-url>
cd github-copilot-mcp-server
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
cd github-copilot-mcp-server
npm install
npm run dev     # Start in development mode
npm test        # Run tests
npm run lint    # Check code quality
npm run format  # Format code
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
