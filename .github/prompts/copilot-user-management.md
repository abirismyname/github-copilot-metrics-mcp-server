---
description: "Prompt for Copilot User Management API endpoints"
---

# Copilot User Management API

Use the GitHub REST API for Copilot User Management:
https://docs.github.com/en/enterprise-cloud@latest/rest/copilot/copilot-user-management?apiVersion=2022-11-28

- Manage Copilot seat assignments for users and organizations
- Use correct authentication (GITHUB_TOKEN or GitHub App credentials)
- Return results in JSON format

Example endpoint:
GET /orgs/{org}/copilot/billing/seats
