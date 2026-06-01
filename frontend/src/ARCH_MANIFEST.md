# Frontend Architecture Manifest

This folder enforces a modular client architecture. Follow these rules to keep the codebase clean, maintainable, and type-safe.

## Directory Structure

- `app/`: Core app configurations, routers, and root application wrapper.
- `components/`: Reusable, stateless UI components (e.g., buttons, input fields, badges). Do not mix api logic or local stores inside this folder.
- `layouts/`: Shared structures/containers wrapping pages (e.g., `AuthLayout.tsx`, `DashboardLayout.tsx`).
- `pages/`: Visual page routes that wire services and UI components together.
- `services/`: Communication layer for HTTP requests, web sockets, or remote data operations. Handles all CRUD interactions with the Next.js backend API.
- `hooks/`: Reusable custom React hooks (e.g., state helpers, screen size event listeners).
- `store/`: Zustand state management stores (e.g., auth session store, cart state).
- `utils/`: Core helper utilities (e.g., formatting dates, currencies, class name merger).
- `validators/`: Zod schemas validating client-side inputs (e.g., registration schemas).
- `constants/`: App constants, routes, navigation menus, and API configuration keys.
- `types/`: Type definitions and interface abstractions.
- `animations/`: Reusable framer-motion micro-animations and transition configurations.
- `styles/`: CSS modules, themes, and global Tailwind imports.
- `contexts/`: Lightweight react contextual state configurations.
- `providers/`: Integration wrappers providing client modules (e.g. theme providers, query clients).
- `assets/`: Icons, logos, and images.
