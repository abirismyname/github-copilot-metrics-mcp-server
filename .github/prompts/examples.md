---
description: "Example API requests and responses for Copilot Metrics MCP Server"
---

# Example API Usage

## Get Copilot Metrics for an Organization

Request:
GET /orgs/example-org/copilot/billing/metrics

Response:

```json
{
  "total_seats": 10,
  "active_seats": 8,
  "total_cost": 400,
  "period": "2025-06"
}
```

## Get Copilot Seats for an Organization

Request:
GET /orgs/example-org/copilot/billing/seats

Response:

```json
{
  "seats": [
    { "user": "octocat", "status": "active" },
    { "user": "hubot", "status": "inactive" }
  ]
}
```
