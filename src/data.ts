import type { Person } from './types';
import backupData from '../backup/vanshavali_edited.json';

const rawData: any = (backupData as any).tree || backupData;

const addGenerations = (node: any, gen: number): Person => {
    return {
        ...node,
        generation: node.generation || gen,
        children: (node.children || []).map((child: any) => addGenerations(child, gen + 1))
    };
};

export const familyTreeData: Person = addGenerations(rawData, 1);
