# RIT-SE-CODE-BANK

Monorepo for RIT Software Engineering student-built applications. Each app lives under `apps/` and is independently deployable.

## Repository Structure

```
RIT-SE-CODE-BANK/
├── apps/
│   ├── fpes/          # Faculty Performance Evaluation System (active)
│   ├── ca-portal/     # (placeholder)
│   ├── peereval/      # (placeholder)
│   ├── rubricon/      # (placeholder)
│   ├── scoop-portal/  # (placeholder)
│   └── workflow/      # (placeholder)
├── assets/            # Shared static assets (images, fonts, icons, CSS)
├── packages/          # Shared UI component library
│   └── ui-components/ # GenericHeader, GenericFooter
├── services/          # Shared backend services (future)
└── tools/             # Shared scripts and tooling (future)
```

## Active Application

**FPES** — Faculty Performance Evaluation System  
See [`apps/fpes/README.md`](apps/fpes/README.md) for full setup and developer documentation.

## CI/CD

GitHub Actions workflow is defined in `.github/workflows/ci-cd.yml`.

## License

See [LICENSE](LICENSE).
