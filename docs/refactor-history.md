# Refactoring History

## Phase 1: Persistence and Stability
**Focus:** Stopping data loss and isolating side-effects.
- Abstracted the `Person` interface into a `types/` catalog.
- Extracted heavy DB mapping into a standalone `treeMapper.ts` testable module.
- Ensured 100% of fields (photoUrl, sort_order, etc.) saved successfully to the database.
- Fixed non-deterministic mutating sorting arrays causing visual glitches during mapping algorithms.

## Phase 2: Function Pureness
**Focus:** Testability of fundamental tree structures.
- Reduced UI components directly editing children arrays by separating recursive functions into `treeTransforms.ts`.
- Implemented strong type constraints across tree React Flow nodes context, drastically decreasing arbitrary typing across UI component callbacks.

## Phase 3: Abstraction and React Hook Composition
**Focus:** Removing code bloat.
- Component hierarchy `App.tsx` dropped from nearly 900 lines down to around 500 lines.
- Extracted preferences (`useTreePreferences.ts`), interaction highlights (`useTreeSelection.ts`), and node rendering algorithms (`useTreeLayout.ts`).
- Modularized auth checks ensuring simple page wrappers can be defined independent of graph constraints.

## Phase 4: Standardization
**Focus:** High confidence in continuous changes.
- Consolidated `NavigationDrawers` side-panels across desktop and mobile.
- Enforced strict typings against DB parameters that previously lived as weak dictionaries in `validateTree.ts` and `data.ts`.
- Provided 100% vital logic test coverage involving graph edge interactions and API payload configurations.
