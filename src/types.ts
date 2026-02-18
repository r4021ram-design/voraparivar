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

    children: Person[];
    isCollapsed?: boolean;
}

export interface VanshavaliRoot {
    tree: Person;
}
