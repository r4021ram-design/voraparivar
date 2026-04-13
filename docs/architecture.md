# Application Architecture

## Overview
The Vora Parivar layout application is a frontend-heavy React application that uses React Flow for visualization. It is designed around a hierarchical (family tree) layout, mapping user data stored locally or via Supabase into a graphical DAG (directed acyclic graph).

## Key Architectural Principles

1. **Feature-Based Composition:** The application uses a feature directory structure. Logic related to tree transformations, mappings, and hooks are located under `src/features/family-tree/`. Auth-related logic is under `src/features/auth/`, and translations are handled in `src/features/translation/`.
2. **Pure Data Transformations:** Recursive and complex hierarchy logic is decoupled from React components. All operations to modify the tree (`addParent`, `addChild`, `findLineage`, etc.) are pure functions in `src/features/family-tree/utils/treeTransforms.ts`.
3. **Repository Pattern for I/O:** All reading and writing is coordinated by `src/features/family-tree/services/treeRepository.ts`. Components interact with `useFamilyTree` holding local hooks, and operations funnel through the repository to Supabase, localStorage, or JSON files.
4. **Separation of Layout & State:** `App.tsx` contains the application composition and delegates state to custom hooks: `useTreePreferences`, `useTreeSelection`, `useTreeLayout`, and `useFamilyTree`. This prevents component bloating.

## Core Dependencies
- **React Flow:** Used for rendering `nodes` and `edges`.
- **Dagre:** Used behind the scenes in `layout.ts` for computing tree geometries.
- **Supabase:** The active remote database for production.
- **Tailwind CSS + Lucide React:** Styling and icons.
- **Vitest:** For unit testing tree mapping and validation functions headless.

## File Structure

```text
src/
├── features/
│   ├── auth/                # Session hooks, providers, etc.
│   └── family-tree/         # The core domain logic
│       ├── hooks/           # useTreeLayout, useTreePreferences, useTreeSelection
│       ├── services/        # DB mappers, Data repositories
│       ├── utils/           # Pure transforms, dagre wrappers
│       └── types.ts         # React Flow node definitions
├── components/              # Shared UI pieces (buttons, inputs)
├── utils/                   # Globals like validateTree.ts
├── types/                   # Cross-feature schemas (db.ts, auth.ts)
└── App.tsx                  # Main orchestration container
```
