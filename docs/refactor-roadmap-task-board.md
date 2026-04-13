# Family Tree App Refactor Roadmap and Task Board

## Purpose

This document turns the app analysis into an execution-ready refactor plan. It is meant to be practical: exact files, new modules, functions to create, and a commit-by-commit path that keeps the app working while we improve it.

## Goals

- Make tree data reliable across Supabase, local cache, seed JSON, and in-memory state
- Reduce the size and responsibility of `src/App.tsx`
- Move tree logic into pure, testable utilities
- Eliminate duplicated control logic between desktop and mobile
- Strengthen typing across the app
- Add tests and docs around the most important logic

## Current Hotspots

- `src/App.tsx` is acting as the main controller for auth, tree state, layout, preferences, export, dialogs, and role-based actions
- Persistence logic is split across `src/data.ts`, `src/hooks/useSupabaseTree.ts`, `src/hooks/useFamilyTree.ts`, and `src/utils/dbSync.ts`
- Not every editable `Person` field appears to round-trip cleanly through save/load
- `src/utils/layout.ts` sorts children in place during layout generation
- Mobile and desktop actions are implemented separately
- Lint already shows type and hook dependency drift

## Target Structure

```text
src/
  app/
    App.tsx
    AppBootstrap.tsx
    AppShell.tsx

  features/
    auth/
      components/
      hooks/
      services/
    family-tree/
      components/
      hooks/
      services/
      utils/
      config/
    person/
      components/
      services/
    search/
      components/
    timeline/
      components/
    translation/
      services/
      hooks/
    community/
      components/

  shared/
    components/
    lib/
    utils/

  types/
    person.ts
    auth.ts
    db.ts
    ui.ts
```

## Execution Principles

1. Fix data reliability before deep UI refactors
2. Prefer extraction over rewrite
3. Keep behavior stable first, improve ergonomics second
4. Move logic into pure functions whenever possible
5. Keep commits small enough to validate with build/lint

---

## Epic 1: Data Reliability

### Task 1.1: Introduce shared types

**Goal**

Create a stable typed foundation before moving logic.

**New files**

- `src/types/person.ts`
- `src/types/auth.ts`
- `src/types/db.ts`
- `src/types/ui.ts`

**Existing files touched**

- `src/types.ts`
- `src/App.tsx`
- `src/components/LoginScreen.tsx`
- `src/components/FamilyNode.tsx`
- `src/components/ViewPersonModal.tsx`
- `src/hooks/useSupabaseTree.ts`
- `src/hooks/useFamilyTree.ts`

**Create**

In `src/types/person.ts`:

- `Person`
- `PersonTranslations`
- `PersonTranslationFields`
- `VanshavaliRoot`

In `src/types/auth.ts`:

- `UserRole`
- `UserData`

In `src/types/ui.ts`:

- `Theme`
- `FontScale`

In `src/types/db.ts`:

- `PersonRow`
- `ProfileRow`

**Commit**

`chore: introduce shared domain auth db and ui types`

**High-level file changes**

- Move `Person` and `VanshavaliRoot` out of `src/types.ts`
- Replace imports across the app to point to the new type files
- Optionally keep `src/types.ts` temporarily as a re-export shim for a soft migration

---

### Task 1.2: Create tree mapper

**Goal**

Centralize conversion between DB rows and `Person`.

**New file**

- `src/features/family-tree/services/treeMapper.ts`

**Existing files touched**

- `src/hooks/useSupabaseTree.ts`
- `src/utils/dbSync.ts`

**Create in `treeMapper.ts`**

- `mapPersonRowToNode(row: PersonRow): Person`
- `mapTreeNodeToRow(node: Person, parentId: string | null): PersonRow`
- `buildTreeFromRows(rows: PersonRow[]): Person`
- `flattenTreeToRows(root: Person): PersonRow[]`

**Commit**

`refactor: add tree mapper for db row and person conversion`

**High-level file changes**

- Remove inline DB-to-tree mapping logic from `useSupabaseTree.ts`
- Replace inline flattening logic in `dbSync.ts` with mapper usage

---

### Task 1.3: Create repository layer

**Goal**

Make one place responsible for loading, saving, refreshing, importing, exporting, and resetting tree data.

**New file**

- `src/features/family-tree/services/treeRepository.ts`

**Existing files touched**

- `src/hooks/useSupabaseTree.ts`
- `src/hooks/useFamilyTree.ts`
- `src/data.ts`

**Create in `treeRepository.ts`**

- `loadTree()`
- `refreshTree()`
- `saveTree(tree: Person)`
- `saveTreeToLocal(tree: Person)`
- `loadTreeFromLocal()`
- `loadTreeFromSeed()`
- `resetTree()`
- `exportTree(tree: Person)`
- `importTree(raw: unknown)`

**Commit**

`refactor: add tree repository and centralize tree loading rules`

**High-level file changes**

- Move fallback and storage priority logic out of `useSupabaseTree.ts`
- Move localStorage write behavior out of `useFamilyTree.ts`
- Keep `data.ts` focused on runtime JSON fetch plus validation

---

### Task 1.4: Fix persistence gaps

**Goal**

Ensure every supported editable `Person` field survives save, reload, sync, export, and import.

**Files touched**

- `src/components/EditModal.tsx`
- `src/hooks/useFamilyTree.ts`
- `src/hooks/useSupabaseTree.ts`
- `src/features/family-tree/services/treeMapper.ts`
- `src/features/family-tree/services/treeRepository.ts`
- Supabase schema migration file

**Likely fields to audit and fix**

- `photoUrl`
- `spousePhotoUrl`
- `anniversaryDate`
- `gallery`
- `location`
- `translations`

**Commit**

`fix: persist full person detail set across edit save reload and sync`

**High-level file changes**

- Update save logic so `handleSaveEdit` persists the full supported field set
- Update DB read logic so those fields come back into the `Person` model
- Add or update a schema migration if the table is missing required columns

---

### Task 1.5: Strengthen import/export normalization

**Goal**

Make imported data safer and exported data more future-proof.

**Files touched**

- `src/data.ts`
- `src/components/FileUpload.tsx`
- `src/utils/validateTree.ts`
- `src/features/family-tree/services/treeRepository.ts`

**Create**

- `normalizeImportedTree(raw: unknown): Person`
- `assertValidTree(raw: unknown): Person`

**Commit**

`fix: normalize and validate imported family tree data`

**High-level file changes**

- Stop using loose `any` for imported JSON roots
- Normalize missing `children`, `generation`, and optional field shapes
- Validate before committing imported data into app state

---

## Epic 2: Tree Architecture

### Task 2.1: Extract pure tree transforms

**Goal**

Move recursive tree logic into pure, reusable functions.

**New file**

- `src/features/family-tree/utils/treeTransforms.ts`

**Existing files touched**

- `src/App.tsx`
- `src/hooks/useFamilyTree.ts`

**Create**

- `findLineage(root, targetId)`
- `updatePersonInTree(root, updatedPerson)`
- `addChildToTree(root, parentId, child)`
- `deletePersonFromTree(root, personId)`
- `togglePersonCollapse(root, personId)`
- `addParentToTree(root, newRoot)`
- `sortChildren(children)`

**Commit**

`refactor: extract pure family tree transform utilities`

**High-level file changes**

- Remove recursive helpers from `App.tsx` and `useFamilyTree.ts`
- Replace inline recursion with imports from `treeTransforms.ts`

---

### Task 2.2: Make layout non-mutating

**Goal**

Stop mutating `children` during graph layout generation.

**Files touched**

- `src/utils/layout.ts` or moved equivalent in `src/features/family-tree/utils/layout.ts`

**Create**

- `compareChildren(a, b)`
- use copied arrays before sorting

**Commit**

`fix: prevent tree mutation during layout generation`

**High-level file changes**

- Replace `person.children.sort(...)` with sorting on a copied array
- Preserve dagre logic and output behavior

---

### Task 2.3: Type React Flow node payload

**Goal**

Remove `any` around node data and standardize graph payload typing.

**Files touched**

- `src/components/FamilyNode.tsx`
- `src/components/SearchSidebar.tsx`
- `src/components/TimelineView.tsx`
- `src/App.tsx`
- `src/types/person.ts` or `src/features/family-tree/types.ts`

**Create**

- `FamilyNodeData`
- `FamilyTreeNode = Node<FamilyNodeData>`

**Commit**

`refactor: strongly type react flow family node data`

**High-level file changes**

- Replace loose node payload types in component props
- Reduce repeated `node.data.person as Person` casting

---

### Task 2.4: Split `useFamilyTree` responsibilities

**Goal**

Separate loading, editing, and history concerns.

**New files**

- `src/features/family-tree/hooks/useFamilyTreeData.ts`
- `src/features/family-tree/hooks/useTreeEditing.ts`
- `src/features/family-tree/hooks/useTreeHistory.ts`

**Existing files touched**

- `src/hooks/useFamilyTree.ts`
- `src/hooks/useHistory.ts`

**Create**

In `useFamilyTreeData.ts`:

- current tree state
- refresh behavior
- setters

In `useTreeEditing.ts`:

- `saveEdit`
- `addChild`
- `deletePerson`
- `addParent`
- `bulkTranslate`

In `useTreeHistory.ts`:

- thin wrapper or moved version of history logic

**Commit**

`refactor: separate tree data editing and history hooks`

**High-level file changes**

- Turn `useFamilyTree.ts` into a smaller composition hook or temporary compatibility wrapper
- Make editing functions independent from loading fallback logic

---

## Epic 3: App Decomposition

### Task 3.1: Extract auth session hook

**Goal**

Shrink top-level auth logic and make session lifecycle reusable.

**New files**

- `src/features/auth/hooks/useAuthSession.ts`
- `src/features/auth/services/authService.ts`

**Existing files touched**

- `src/App.tsx`
- `src/components/LoginScreen.tsx`
- `src/lib/supabase.ts`

**Create**

- `loadCurrentUserRole`
- session bootstrap logic
- auth change listener setup
- `signOut`

**Commit**

`refactor: extract auth session lifecycle into dedicated hook`

**High-level file changes**

- Remove `getSession`, `onAuthStateChange`, and role-load wiring from `App.tsx`
- Replace with a typed auth hook

---

### Task 3.2: Create app bootstrap and shell

**Goal**

Reduce `App.tsx` to composition only.

**New files**

- `src/app/AppBootstrap.tsx`
- `src/app/AppShell.tsx`

**Existing files touched**

- `src/App.tsx`
- `src/main.tsx`

**Create**

`AppBootstrap.tsx`:

- calls `useAuthSession`
- shows auth loading screen
- renders login or shell

`AppShell.tsx`:

- renders authenticated app content

**Commit**

`refactor: introduce app bootstrap and authenticated shell`

**High-level file changes**

- Move login gate and auth loading state out of `App.tsx`
- Remove duplicate boundary structure if not needed

---

### Task 3.3: Create `FamilyTreeScreen`

**Goal**

Give the family-tree feature a dedicated page-level component.

**New file**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Existing files touched**

- `src/App.tsx`

**Move into `FamilyTreeScreen.tsx`**

- tree page state
- selection state
- settings state
- modal state
- action wiring
- tree hook composition

**Commit**

`refactor: move family tree page logic into feature screen component`

**High-level file changes**

- Move `FamilyTreeFlow` logic out of `App.tsx`
- Leave `App.tsx` with simple app composition

---

### Task 3.4: Extract `TreeCanvas`

**Goal**

Separate graph rendering from orchestration logic.

**New file**

- `src/features/family-tree/components/TreeCanvas.tsx`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

`TreeCanvas` props:

- `nodes`
- `edges`
- `onNodesChange`
- `onEdgesChange`
- `onNodeClick`
- `onPaneClick`

**Commit**

`refactor: extract react flow tree canvas component`

**High-level file changes**

- Move `<ReactFlow>` block into a dedicated component
- Preserve provider placement higher in the tree

---

### Task 3.5: Extract toolbar

**Goal**

Separate visual controls from page orchestration.

**New file**

- `src/features/family-tree/components/TreeToolbar.tsx`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

`TreeToolbar` props:

- current user role
- preferences state
- action handlers
- sidebar/modal open handlers

It should render:

- desktop left control column
- center cultural header
- desktop right control column

**Commit**

`refactor: extract desktop family tree toolbar`

**High-level file changes**

- Move top absolute controls block from screen to `TreeToolbar.tsx`
- Keep the same behavior first

---

### Task 3.6: Extract modal and panel layer

**Goal**

Clean up page composition and isolate dialog wiring.

**New file**

- `src/features/family-tree/components/TreeDialogs.tsx`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

Render:

- `EditModal`
- `ViewPersonModal`
- `SearchSidebar`
- `TimelineView`
- `CommunityDashboard`
- `HeaderEditor`
- `NavigationDrawers`
- `TranslationOverlay`

**Commit**

`refactor: extract tree dialogs overlays and side panels`

**High-level file changes**

- Move large JSX dialog/panel block into one dedicated component
- Reduce clutter inside the main screen

---

### Task 3.7: Extract preferences hook

**Goal**

Localize theme, language, font scale, privacy, and header settings.

**New file**

- `src/features/family-tree/hooks/useTreePreferences.ts`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

- `language`
- `theme`
- `fontScale`
- `isPrivacyMode`
- `headerVerse`
- `headerTitle`
- setters
- optional localStorage sync

**Commit**

`refactor: extract tree preferences and header settings hook`

**High-level file changes**

- Remove preference `useState` blocks from screen component
- Move header localStorage reads and writes into the hook

---

### Task 3.8: Extract selection and focus hook

**Goal**

Isolate tree navigation and selection behavior.

**New file**

- `src/features/family-tree/hooks/useTreeSelection.ts`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

- `selectedNodeId`
- `highlightedPath`
- `focusNode`
- `focusRoot`
- `clearSelection`

**Commit**

`refactor: extract tree selection and focus behavior hook`

**High-level file changes**

- Move focus and highlight behavior out of the page component
- Reuse pure `findLineage` utility

---

### Task 3.9: Extract layout hook

**Goal**

Centralize graph derivation and layout refresh logic.

**New file**

- `src/features/family-tree/hooks/useTreeLayout.ts`

**Existing files touched**

- `src/features/family-tree/components/FamilyTreeScreen.tsx`

**Create**

- build nodes from tree data
- inject callbacks into node payload
- style highlighted edges
- refresh graph when relevant settings change

**Commit**

`refactor: extract tree layout and graph node construction hook`

**High-level file changes**

- Move `refreshLayout` logic out of the page component
- Fix current callback dependency issues as part of extraction

---

## Epic 4: Quality, Actions, Translation, and Docs

### Task 4.1: Unify desktop and mobile actions

**Goal**

Remove action duplication and prevent UI drift.

**New file**

- `src/features/family-tree/config/treeActions.ts`

**Existing files touched**

- `src/features/family-tree/components/TreeToolbar.tsx`
- `src/components/NavigationDrawers.tsx`

**Create**

- `buildTreeActions(context)`
- `buildSettingsActions(context)`

**Commit**

`refactor: unify family tree action definitions across desktop and mobile`

**High-level file changes**

- `NavigationDrawers.tsx` stops receiving an oversized loose prop bag
- Desktop and mobile render from the same action definitions

---

### Task 4.2: Clean up translation architecture

**Goal**

Separate UI label translation from person-content translation.

**New files**

- `src/features/translation/services/translationService.ts`
- `src/features/translation/services/transliterationService.ts`
- `src/features/translation/services/bulkTranslationService.ts`
- optional `src/features/translation/utils/getTranslatedPersonField.ts`

**Existing files touched**

- `src/components/EditModal.tsx`
- `src/components/FamilyNode.tsx`
- `src/components/ViewPersonModal.tsx`
- `src/components/SearchSidebar.tsx`
- `src/components/TimelineView.tsx`
- `src/utils/gemini.ts`
- `src/utils/transliterate.ts`
- `src/utils/bulkTranslate.ts`
- `src/i18n.ts`

**Create**

- `getTranslatedPersonField(person, language, field)`
- `translatePersonFields(...)`
- `bulkTranslateTreeContent(...)`

**Commit**

`refactor: centralize person content translation services and helpers`

**High-level file changes**

- Components stop implementing their own content translation lookup logic
- `EditModal.tsx` delegates translation work to services or hooks
- `i18n.ts` remains focused on static UI labels

---

### Task 4.3: Lint and hook dependency cleanup

**Goal**

Get the app into a cleaner, safer steady state.

**Files touched**

- `src/App.tsx` or extracted replacements
- `src/components/NavigationDrawers.tsx`
- `src/components/ViewPersonModal.tsx`
- `src/components/FileUpload.tsx`
- `src/components/TimelineView.tsx`
- `src/data.ts`
- `src/hooks/useSupabaseTree.ts`
- `src/utils/validateTree.ts`
- `src/utils/transliterate.ts`

**Commit**

`chore: resolve lint errors and stabilize hook dependency behavior`

**High-level file changes**

- Remove `any`
- add proper hook dependencies or restructure callbacks to avoid stale closure issues
- address `TimelineView` memo dependency mismatch

---

### Task 4.4: Add tests for pure logic

**Goal**

Protect the refactor with high-value unit tests.

**New files**

- `src/features/family-tree/utils/__tests__/treeTransforms.test.ts`
- `src/features/family-tree/services/__tests__/treeMapper.test.ts`
- `src/utils/__tests__/validateTree.test.ts`
- optional translation service tests

**Commit**

`test: add unit coverage for tree transforms mapping and validation`

**High-level file changes**

- Add tests for:
  - update person
  - add child
  - delete subtree
  - lineage resolution
  - flatten/build tree round trips
  - validation failures and success cases

---

### Task 4.5: Documentation pass

**Goal**

Make the final structure easy to understand and maintain.

**New files**

- `docs/architecture.md`
- `docs/data-flow.md`
- `docs/tree-model.md`
- `docs/refactor-history.md`

**Existing files touched**

- `README.md`

**Commit**

`docs: add architecture data flow and tree model documentation`

**High-level file changes**

- Update README with current app architecture and setup
- Document loading priority:
  - Supabase
  - local cache
  - seed JSON
- Document feature boundaries and ownership

---

## Recommended Commit Sequence

1. `chore: introduce shared domain auth db and ui types`
2. `refactor: add tree mapper for db row and person conversion`
3. `refactor: add tree repository and centralize tree loading rules`
4. `fix: persist full person detail set across edit save reload and sync`
5. `fix: normalize and validate imported family tree data`
6. `refactor: extract pure family tree transform utilities`
7. `fix: prevent tree mutation during layout generation`
8. `refactor: strongly type react flow family node data`
9. `refactor: separate tree data editing and history hooks`
10. `refactor: extract auth session lifecycle into dedicated hook`
11. `refactor: introduce app bootstrap and authenticated shell`
12. `refactor: move family tree page logic into feature screen component`
13. `refactor: extract react flow tree canvas component`
14. `refactor: extract desktop family tree toolbar`
15. `refactor: extract tree dialogs overlays and side panels`
16. `refactor: extract tree preferences and header settings hook`
17. `refactor: extract tree selection and focus behavior hook`
18. `refactor: extract tree layout and graph node construction hook`
19. `refactor: unify family tree action definitions across desktop and mobile`
20. `refactor: centralize person content translation services and helpers`
21. `chore: resolve lint errors and stabilize hook dependency behavior`
22. `test: add unit coverage for tree transforms mapping and validation`
23. `docs: add architecture data flow and tree model documentation`

---

## Suggested Kanban Columns

### Backlog

- Task 4.2: Clean up translation architecture
- Task 4.4: Add tests for pure logic
- Task 4.5: Documentation pass

### Ready

- Task 1.1: Introduce shared types
- Task 1.2: Create tree mapper
- Task 1.3: Create repository layer

### In Progress

- Move whichever current milestone the team is executing

### Review

- Any commit that changes persistence, import/export, or layout behavior

### Done

- Completed tasks after build, lint, and manual smoke test

---

## Definition of Done by Epic

### Epic 1 done when

- All editable fields survive refresh
- Tree repository exists and is used
- Mapper exists and is used
- Import/export uses validation and normalization

### Epic 2 done when

- Tree operations are in pure utilities
- Layout no longer mutates tree state
- React Flow node payload is typed

### Epic 3 done when

- `App.tsx` is mostly composition
- Auth lifecycle is extracted
- Tree screen is split into screen, canvas, toolbar, and dialogs

### Epic 4 done when

- Desktop/mobile actions share configuration
- Translation logic is centralized
- Lint issues are mostly resolved
- Tests and docs are in place

---

## Highest-Value First Five Commits

If work needs to start with the biggest payoff and lowest risk, begin here:

1. shared types
2. tree mapper
3. tree repository
4. persistence gap fix
5. non-mutating layout

That sequence improves safety first, which makes all later refactors much less risky.
