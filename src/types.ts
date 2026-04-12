export interface Person {
    id: string; // "root" or generated ID
    name: string;
    generation: number; // Still kept for coloring logic, though input might not have it explicitly we can calculate it
    relation?: string; // e.g. "Son", "Mukhya Purush"
    spouse?: string; // Now a string name
    gender?: 'MALE' | 'FEMALE';
    photoUrl?: string; // Optional if we still want to support it
    dateOfBirth?: string;
    dateOfDeath?: string;
    occupation?: string;
    anniversaryDate?: string;
    phoneNumber?: string;
    sort_order?: number;

    // Extended Spouse Details
    spousePhotoUrl?: string;
    spouseDateOfBirth?: string;
    spouseDateOfDeath?: string;
    spouseOccupation?: string;
    spousePhoneNumber?: string;


    // Phase 3: Media & Content
    bio?: string;
    gallery?: string[];
    location?: {
        name: string;
        lat?: number;
        lng?: number;
    };
    
    // Auto-Translations via Gemini
    translations?: {
        EN?: {
            name?: string;
            relation?: string;
            occupation?: string;
            bio?: string;
            spouse?: string;
            spouseOccupation?: string;
        };
        HI?: {
            name?: string;
            relation?: string;
            occupation?: string;
            bio?: string;
            spouse?: string;
            spouseOccupation?: string;
        };
        GU?: {
            name?: string;
            relation?: string;
            occupation?: string;
            bio?: string;
            spouse?: string;
            spouseOccupation?: string;
        };
    };

    children: Person[];
    isCollapsed?: boolean;
}

export interface VanshavaliRoot {
    tree: Person;
}
