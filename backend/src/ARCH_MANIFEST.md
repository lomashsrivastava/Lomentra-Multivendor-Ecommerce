# Backend Architecture Manifest

This folder enforces a modular monolithic backend architecture. Follow these rules to keep the API server decoupled, secure, and performant.

## Directory Structure

- `app/`: Next.js App Router folders containing api endpoints and route handler modules.
- `modules/`: Decoupled features of the application (e.g., Auth, Inventory, Billing). Each module groups its logic.
- `middleware/`: Standard route handling middlewares (e.g., rate limits, RBAC authorization guards).
- `security/`: API sanitizers, token signers, encryption helpers, and secure header parsers.
- `validators/`: Zod parsing and validator rules for HTTP request bodies, queries, and params.
- `services/`: Shared business services (e.g., payment orchestration, cloud storage, mail routing).
- `ai/`: Gemini AI model helper clients, prompt repositories, and analytical summarizers.
- `config/`: Environment configuration modules, database connectors, and application keys.
- `lib/`: Wrapper initializers for external clients (e.g., mongoose connections, payment SDKs).
- `database/`: Database collection schemas (Mongoose models), schemas, indexes, and migrations.
- `utils/`: Logger, error formatting, and performance tracker modules.
- `constants/`: Commission rates, user permissions, order statuses, and HTTP error maps.
- `events/`: Event-driven architecture channels (event publishers, subscribers).
- `queues/`: Job handlers and task queues (e.g., processing vendor bulk imports, billing jobs).
- `emails/`: Email rendering structures, templates, and mail triggers.
- `types/`: Types, request definitions, and type guards.
