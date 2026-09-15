import type { Person } from '../../../types/person';
import { findLineage } from './treeTransforms';

export interface KinshipResult {
    personA: Person;
    personB: Person;
    lca: Person;
    path: string[]; // Connecting node IDs from A -> LCA -> B
    relationEN: string;
    relationHI: string;
    relationGU: string;
    descriptionEN: string;
    descriptionHI: string;
    descriptionGU: string;
    generationDiff: number; // generation(B) - generation(A)
}

/** Helper to find a person node anywhere in the tree. */
export function findPersonById(root: Person, id: string): Person | null {
    if (root.id === id) return root;
    if (root.children) {
        for (const child of root.children) {
            const found = findPersonById(child, id);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Calculates the exact genealogical relationship between Person A and Person B.
 * Returns relationship in English, Hindi, and Gujarati with the full connecting path.
 */
export function calculateKinship(root: Person, idA: string, idB: string): KinshipResult | null {
    if (!root || !idA || !idB) return null;

    const pathA = findLineage(root, idA);
    const pathB = findLineage(root, idB);

    if (!pathA || !pathB) return null;

    // Find Lowest Common Ancestor (LCA)
    let lcaIndex = 0;
    const minLen = Math.min(pathA.length, pathB.length);
    for (let i = 0; i < minLen; i++) {
        if (pathA[i] === pathB[i]) {
            lcaIndex = i;
        } else {
            break;
        }
    }

    const lcaId = pathA[lcaIndex];
    const lca = findPersonById(root, lcaId);
    const personA = findPersonById(root, idA);
    const personB = findPersonById(root, idB);

    if (!lca || !personA || !personB) return null;

    // Distances from LCA
    const distA = pathA.length - 1 - lcaIndex;
    const distB = pathB.length - 1 - lcaIndex;

    // Connecting path: A -> ... -> LCA -> ... -> B
    const pathUpToLca = [...pathA.slice(lcaIndex)].reverse();
    const pathDownToB = pathB.slice(lcaIndex + 1);
    const connectingPath = [...pathUpToLca, ...pathDownToB];

    const isFemaleB = personB.gender === 'FEMALE';
    const genDiff = (personB.generation || 0) - (personA.generation || 0);

    let relationEN = 'Relative';
    let relationHI = 'संबंधी';
    let relationGU = 'સંબંધી';
    let descEN = `${personB.name} is related to ${personA.name}`;
    let descHI = `${personB.name}, ${personA.name} के परिवार से हैं`;
    let descGU = `${personB.name}, ${personA.name} ના કુટુંબમાંથી છે`;

    if (distA === 0 && distB === 0) {
        relationEN = 'Self';
        relationHI = 'स्वयं';
        relationGU = 'પોતે';
        descEN = `${personA.name} is the same person.`;
        descHI = `यह वही व्यक्ति हैं।`;
        descGU = `આ એ જ વ્યક્તિ છે.`;
    } else if (distA === 1 && distB === 0) {
        relationEN = personB.gender === 'FEMALE' ? 'Mother' : 'Father';
        relationHI = personB.gender === 'FEMALE' ? 'माता' : 'पिता';
        relationGU = personB.gender === 'FEMALE' ? 'માતા' : 'પિતા';
        descEN = `${personB.name} is the parent of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 0 && distB === 1) {
        relationEN = isFemaleB ? 'Daughter' : 'Son';
        relationHI = isFemaleB ? 'पुत्री (बेटी)' : 'पुत्र (बेटा)';
        relationGU = isFemaleB ? 'પુત્રી (દીકરી)' : 'પુત્ર (દીકરો)';
        descEN = `${personB.name} is the child of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 1 && distB === 1) {
        relationEN = isFemaleB ? 'Sister' : 'Brother';
        relationHI = isFemaleB ? 'बहन' : 'भाई';
        relationGU = isFemaleB ? 'બહેન' : 'ભાઈ';
        descEN = `${personB.name} is the sibling of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 2 && distB === 0) {
        relationEN = isFemaleB ? 'Grandmother' : 'Grandfather';
        relationHI = isFemaleB ? 'दादी' : 'दादा';
        relationGU = isFemaleB ? 'દાદી' : 'દાદા';
        descEN = `${personB.name} is the grandparent of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 0 && distB === 2) {
        relationEN = isFemaleB ? 'Granddaughter' : 'Grandson';
        relationHI = isFemaleB ? 'पोती' : 'पोता';
        relationGU = isFemaleB ? 'પૌત્રી' : 'પૌત્ર';
        descEN = `${personB.name} is the grandchild of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 2 && distB === 1) {
        relationEN = isFemaleB ? 'Aunt' : 'Uncle';
        relationHI = isFemaleB ? 'बुआ / चाची' : 'चाचा / ताऊ';
        relationGU = isFemaleB ? 'ફોઈ / કાકી' : 'કાકા / મોટા બાપા';
        descEN = `${personB.name} is the uncle/aunt of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 1 && distB === 2) {
        relationEN = isFemaleB ? 'Niece' : 'Nephew';
        relationHI = isFemaleB ? 'भतीजी' : 'भतीजा';
        relationGU = isFemaleB ? 'ભત્રીજી' : 'ભત્રીજો';
        descEN = `${personB.name} is the nephew/niece of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के ${relationHI} हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ${relationGU} છે.`;
    } else if (distA === 2 && distB === 2) {
        relationEN = isFemaleB ? 'First Cousin (Sister)' : 'First Cousin (Brother)';
        relationHI = isFemaleB ? 'चचेरी बहन' : 'चचेरा भाई';
        relationGU = isFemaleB ? 'પિતરાઈ બહેન' : 'પિતરાઈ ભાઈ';
        descEN = `${personB.name} and ${personA.name} are first cousins.`;
        descHI = `${personB.name} और ${personA.name} आपस में चचेरे भाई-बहन हैं।`;
        descGU = `${personB.name} અને ${personA.name} પિતરાઈ ભાઈ-બહેન છે.`;
    } else if (distA === 3 && distB === 1) {
        relationEN = isFemaleB ? 'Great Aunt' : 'Great Uncle';
        relationHI = isFemaleB ? 'दादाजी की बहन' : 'दादाजी के भाई';
        relationGU = isFemaleB ? 'દાદાના બહેન' : 'દાદાના ભાઈ';
        descEN = `${personB.name} is a sibling of ${personA.name}'s grandfather.`;
        descHI = `${personB.name}, ${personA.name} के दादाजी की पीढ़ी के भाई/बहन हैं।`;
        descGU = `${personB.name}, ${personA.name} ના દાદાના ભાઈ/બહેન છે.`;
    } else if (distA === 1 && distB === 3) {
        relationEN = isFemaleB ? 'Grand Niece' : 'Grand Nephew';
        relationHI = isFemaleB ? 'भतीजे की बेटी' : 'भतीजे का बेटा';
        relationGU = isFemaleB ? 'ભત્રીજાની દીકરી' : 'ભત્રીજાનો દીકરો';
        descEN = `${personB.name} is a grandchild of ${personA.name}'s sibling.`;
        descHI = `${personB.name}, ${personA.name} के भाई के पोता/पोती हैं।`;
        descGU = `${personB.name}, ${personA.name} ના ભાઈના પૌત્ર/પૌત્રી છે.`;
    } else if (distA === 3 && distB === 2) {
        relationEN = isFemaleB ? 'First Cousin Once Removed' : 'First Cousin Once Removed';
        relationHI = isFemaleB ? 'पिताजी की चचेरी बहन' : 'पिताजी के चचेरे भाई (काका समान)';
        relationGU = isFemaleB ? 'પિતાના પિતરાઈ બહેન' : 'પિતાના પિતરાઈ ભાઈ';
        descEN = `${personB.name} is a first cousin of ${personA.name}'s parent.`;
        descHI = `${personB.name}, ${personA.name} के पिता के चचेरे भाई हैं।`;
        descGU = `${personB.name}, ${personA.name} ના પિતાના પિતરાઈ ભાઈ છે.`;
    } else if (distA === 2 && distB === 3) {
        relationEN = isFemaleB ? 'First Cousin Once Removed' : 'First Cousin Once Removed';
        relationHI = isFemaleB ? 'चचेरे भाई की बेटी' : 'चचेरे भाई का बेटा (भतीजा समान)';
        relationGU = isFemaleB ? 'પિતરાઈ ભાઈની દીકરી' : 'પિતરાઈ ભાઈનો દીકરો';
        descEN = `${personB.name} is a child of ${personA.name}'s first cousin.`;
        descHI = `${personB.name}, ${personA.name} के चचेरे भाई के संतान हैं।`;
        descGU = `${personB.name}, ${personA.name} ના પિતરાઈ ભાઈના સંતાન છે.`;
    } else if (distA === 3 && distB === 3) {
        relationEN = isFemaleB ? 'Second Cousin (Sister)' : 'Second Cousin (Brother)';
        relationHI = isFemaleB ? 'परिवार की बहन (Second Cousin)' : 'परिवार का भाई (Second Cousin)';
        relationGU = isFemaleB ? 'દૂરના પિતરાઈ બહેન' : 'દૂરના પિતરાઈ ભાઈ';
        descEN = `${personB.name} and ${personA.name} are second cousins.`;
        descHI = `${personB.name} और ${personA.name} दूसरी पीढ़ी के चचेरे भाई-बहन हैं।`;
        descGU = `${personB.name} અને ${personA.name} બીજી પેઢીના પિતરાઈ છે.`;
    } else if (distB === 0) {
        relationEN = `Direct Ancestor (Gen -${distA})`;
        relationHI = `पूर्वज (${distA} पीढ़ी ऊपर)`;
        relationGU = `પૂર્વજ (${distA} પેઢી ઉપર)`;
        descEN = `${personB.name} is a direct ancestor of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के सीधे पूर्वज हैं।`;
        descGU = `${personB.name}, ${personA.name} ના સીધા પૂર્વજ છે.`;
    } else if (distA === 0) {
        relationEN = `Direct Descendant (Gen +${distB})`;
        relationHI = `वंशज (${distB} पीढ़ी नीचे)`;
        relationGU = `વંશજ (${distB} પેઢી નીચે)`;
        descEN = `${personB.name} is a direct descendant of ${personA.name}.`;
        descHI = `${personB.name}, ${personA.name} के सीधे वंशज हैं।`;
        descGU = `${personB.name}, ${personA.name} ના સીધા વંશજ છે.`;
    }

    return {
        personA,
        personB,
        lca,
        path: connectingPath,
        relationEN,
        relationHI,
        relationGU,
        descriptionEN: descEN,
        descriptionHI: descHI,
        descriptionGU: descGU,
        generationDiff: genDiff,
    };
}
