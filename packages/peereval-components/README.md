# PeerEval Components

Reusable React components and TypeScript definitions extracted from the PeerEval application.

## Installation

The package is distributed within the RIT-SE-CODE-BANK npm workspace.

## Usage

Import components from the package entry point:

    import {
        ProjectCard,
        AssessmentSection,
        InquiryResponseField
    } from "@rit/peereval-components";

## Architecture

- components/: Reusable React UI components.
- types/: Shared TypeScript definitions.
- index.ts: Public package exports.

## Design Principles

- Keep components independent of applcation-specific backend.
- Accept date and callbacks through props.
- Keep application-specific API calls and authentication in consuming applications.
- Support reuse across PeerEval, Rubricon, TeamBuilder, and the shared demo application.
