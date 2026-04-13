# Data Flow

## 1. Application Initialization
When the application starts:
1. `useAuthSession` establishes the authenticated state of the user. If they are an Admin, they get elevated edit privileges. If they are a Standard/Anonymous user, they get view access.
2. `useFamilyTree` initializes by fetching data directly from `treeRepository`.

## 2. Tree Repository Prioritization
The `treeRepository` has a strict hierarchical strategy to fetch data:
1. **Supabase (Remote):** If Supabase returns valid records, the mapper (`treeMapper.ts`) converts the flat rows into a hierarchical tree object.
2. **LocalStorage (Cache):** If Supabase is unreachable or empty, `vanshavali_data_v3` is retrieved and validated.
3. **Local JSON (Seed):** If no user configuration exists, `vanshavali_edited.json` is loaded as the final fallback.

## 3. Data Presentation
1. The fetched nested `Person` object sits in `currentData` inside `useFamilyTree`.
2. Any changes to `currentData` trigger `useTreeLayout` to regenerate nodes and edges via `processTreeToElements`.
3. `ReactFlow` draws the resulting elements.

## 4. Updates (Editing)
When an admin edits a person or adds a new relative:
1. The `EditModal` or action button constructs the new user fragment.
2. Control calls `handleSaveEdit` or `handleAddChild` in `useFamilyTree`.
3. The hook delegates merging the changes locally to `updatePersonInTree`.
4. It then coordinates with `treeRepository` to persist changes back to Supabase and LocalStorage. `treeMapper.ts` is responsible for converting the modified tree segment to flat SQL updates.
5. `currentData` updates, layout regenerates, UI re-renders.

## Side Effects
- Translations are optionally applied during editing. A person's `translations` object inside their `Person` node persists through this cycle.
