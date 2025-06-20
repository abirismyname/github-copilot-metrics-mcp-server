# Docker Deployment to GitHub Container Registry

This guide explains how to build and push your Docker image to GitHub Container Registry (ghcr.io).

## Prerequisites

1. GitHub account with access to GitHub Container Registry
2. Docker installed locally
3. GitHub CLI (optional, for easier authentication)

## Manual Build and Push

### 1. Authenticate with GitHub Container Registry

First, create a Personal Access Token (PAT) with `write:packages` scope:
1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token with `write:packages`, `read:packages`, and `repo` scopes
3. Save the token securely

Then authenticate Docker with GHCR:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Or using GitHub CLI:
```bash
gh auth login
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### 2. Build and Push the Image

#### Option A: Using npm scripts
```bash
# Build the image with GHCR tag
npm run docker:build-ghcr

# Push to GitHub Container Registry
npm run docker:push-ghcr
```

#### Option B: Using Docker commands directly
```bash
# Build the image
docker build -t ghcr.io/github-copilot-metrics-mcp-server:latest .

# Optionally tag with version
docker tag ghcr.io/github-copilot-metrics-mcp-server:latest ghcr.io/github-copilot-metrics-mcp-server:v1.0.0

# Push to registry
docker push ghcr.io/github-copilot-metrics-mcp-server:latest
docker push ghcr.io/github-copilot-metrics-mcp-server:v1.0.0  # if you tagged with version
```

## Automated Build and Push with GitHub Actions

The repository includes a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) that automatically:

- Builds the Docker image on every push to `main` branch
- Pushes to `ghcr.io/github-copilot-metrics-mcp-server`
- Supports multi-architecture builds (linux/amd64, linux/arm64)
- Tags images appropriately based on Git tags and branches

### Workflow Triggers:
- **Push to main branch**: Creates `latest` tag
- **Push tags (`v*`)**: Creates version tags (e.g., `v1.0.0`, `1.0.0`, `1.0`, `1`)
- **Pull requests**: Builds for testing (doesn't push)

### Required Permissions:
The workflow uses `GITHUB_TOKEN` which is automatically provided by GitHub Actions with the necessary permissions to push to GHCR.

## Using the Published Image

Once published, you can use the image:

```bash
# Pull and run the latest version
docker run --env-file .env ghcr.io/github-copilot-metrics-mcp-server:latest

# Or specific version
docker run --env-file .env ghcr.io/github-copilot-metrics-mcp-server:v1.0.0
```

## Image Visibility

By default, images pushed to GHCR are private. To make them public:

1. Go to your GitHub profile/organization
2. Navigate to "Packages" tab
3. Select the `github-copilot-metrics-mcp-server` package
4. Go to "Package settings"
5. Change visibility to "Public" if desired

## Troubleshooting

### Authentication Issues
- Ensure your PAT has `write:packages` scope
- Verify you're using the correct username and token
- Check that your token hasn't expired

### Build Failures
- Ensure all source files are committed to Git
- Check that the Dockerfile builds successfully locally
- Verify Node.js dependencies are properly listed in package.json

### Push Failures
- Confirm you have push permissions to the repository
- Check that the image name matches the expected format
- Ensure you're authenticated with the correct account
