// Re-export shim — all domain types now live in src/types/*.ts
// This file exists for backward compatibility with existing import paths.

export type { Person, VanshavaliRoot, PersonTranslations, PersonTranslationFields } from './types/person';
export type { UserRole, UserData } from './types/auth';
export type { PersonRow, ProfileRow } from './types/db';
export type { Theme, FontScale } from './types/ui';
