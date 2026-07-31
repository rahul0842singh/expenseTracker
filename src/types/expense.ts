export type ExpenseKind = 'expense' | 'income';

export type Expense = {
  id: string;
  amount: number;
  kind: ExpenseKind;
  categoryId: string;
  reason: string;
  upiAppId: string;
  date: string; // ISO date string
};
