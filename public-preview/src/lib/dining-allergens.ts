import type { AllergenType } from '../types/demo';

export const COMMON_ALLERGENS: { id: AllergenType; label: string; icon: string }[] = [
  { id: 'Dairy', label: 'Dairy / Milk', icon: '🥛' },
  { id: 'Nuts', label: 'Tree Nuts', icon: '🌰' },
  { id: 'Peanuts', label: 'Peanuts', icon: '🥜' },
  { id: 'Gluten', label: 'Gluten / Wheat', icon: '🌾' },
  { id: 'Soy', label: 'Soy / Soya', icon: '🫘' },
  { id: 'Eggs', label: 'Eggs', icon: '🥚' },
  { id: 'Shellfish', label: 'Shellfish / Crustaceans', icon: '🦐' },
  { id: 'Fish', label: 'Fish', icon: '🐟' },
];
