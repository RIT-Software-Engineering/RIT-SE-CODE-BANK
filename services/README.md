# Services

This directory contains microservices for the RIT-SE CODE-BANK monorepo.

## Notification Service

Centralized notification service that handles email and Slack notifications across all applications in the monorepo.

**Location**: `notification-service/`

**Key Features**:
- Role-based Handlebars templates 
- Email delivery via SMTP
- Slack DM notifications via Web API
- Per-user, per-app preferences
- Universal deep-link CTAs

**Documentation**:
- **Setup & Development**: See [`notification-service/README.md`](notification-service/README.md)
- **Integration Guide**: See [`notification-service/INTEGRATION.md`](notification-service/INTEGRATION.md) 
- **System Overview**: See [`../docs/Notifications-System.md`](../docs/Notifications-System.md)

**Quick Start**:
```powershell
cd notification-service
docker compose up --build
```

**Ports**:
- Notification Service: http://localhost:4000  
- SMTP Dev UI: http://localhost:3005

For detailed setup, API usage, and integration instructions, see the service-specific documentation linked above.

