# Workflows

Workflows is a small ecosystem for defining workflow data, transforming it into project-specific frontend data, and rendering it with project-owned visuals.

There are three major pieces:
- `server`: the Workflows API and persistence layer
- `components`: the shared React rendering logic package
- `builder`: the workflow authoring/customization layer

The current repo contains `server` and `components`. Builder exists conceptually and is part of the intended flow, but its in-repo documentation is intentionally partial for now.

## Start Here
- Consumer docs index: [docs/README.md](./docs/README.md)
- Components package: [components/README.md](./components/README.md)
- Server package: [server/README.md](./server/README.md)

Recommended reading order:
1. [docs/concepts/ecosystem-overview.md](./docs/concepts/ecosystem-overview.md)
2. [docs/recipes/quickstart-components.md](./docs/recipes/quickstart-components.md)
3. [docs/recipes/integration-flow.md](./docs/recipes/integration-flow.md)

## API Docs
- OpenAPI entry: [server/doc/api-docs/server_doc.yaml](./server/doc/api-docs/server_doc.yaml)
- Package-specific server notes: [server/README.md](./server/README.md)

## Reading Strategy
- Use the docs for concepts, architecture, and integration steps.
- Use source and JSDoc as the canonical low-level reference.
- Prefer linking to real example files over copying long snippets into Markdown.
