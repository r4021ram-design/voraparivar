# Tree Model

## The `Person` Interface
The primary data interface in the application is:

```typescript
export interface Person {
    id: string;             // UUID 
    name: string;           
    gender?: 'MALE' | 'FEMALE';
    generation?: number;

    // Rich fields
    bio?: string;
    occupation?: string;
    dateOfBirth?: string;
    dateOfDeath?: string;
    phone?: string;

    // Spouse tracking
    spouseName?: string;
    spouseOccupation?: string;
    spousePhone?: string;
    spouseDob?: string;
    spouseDod?: string;

    // Localization & Location
    location?: {
        name: string;
        lat: number;
        lng: number;
    };
    translations?: PersonTranslations;

    // Hierarchy
    children: Person[];
    isCollapsed?: boolean;
    sort_order?: number;

    // Persistence 
    photoUrl?: string;
    spousePhotoUrl?: string;
    anniversaryDate?: string;
}
```

## Relational vs Nested Structure
- **Frontend State (`Person`)**: Works strictly on a nested, graph-style JSON object consisting of nodes and `children`. This makes recursive features like lineage, hiding subtrees, and hierarchy calculations simple.
- **Backend Database (`PersonRow`)**: Kept fully denormalized and flat in SQL:
  ```typescript
  export interface PersonRow {
      id: string;
      parent_id: string | null;  // Used to map children during the hydrating process
      name: string; 
      // ... same fields
  }
  ```
- **Serialization**: The `treeMapper.ts` builds tree objects with `buildTreeFromRows()` and flattens them for database upserts via `flattenTreeToRows()`.
