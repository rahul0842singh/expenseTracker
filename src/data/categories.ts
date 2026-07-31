export type Category = {
  id: string;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/Ionicons').default.glyphMap;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 'shopping', label: 'Shopping', icon: 'cart', color: '#22C55E' },
  { id: 'food', label: 'Food & Drink', icon: 'cafe', color: '#F59E0B' },
  { id: 'transport', label: 'Transport', icon: 'car', color: '#3B82F6' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'flash', color: '#A855F7' },
  { id: 'rent', label: 'Rent & Housing', icon: 'home', color: '#EF4444' },
  { id: 'entertainment', label: 'Entertainment', icon: 'tv', color: '#EC4899' },
  { id: 'health', label: 'Health', icon: 'medkit', color: '#14B8A6' },
  { id: 'income', label: 'Income', icon: 'cash', color: '#22C55E' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle', color: '#8A8F9C' },
];

export function getCategory(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}
