export type TxType = "income" | "expense";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
  color: string;
  is_archived: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  occurred_on: string; // 'YYYY-MM-DD'
  note: string | null;
  created_at: string;
}

// A transaction joined with the (possibly archived) category it belongs to.
export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, "id" | "name" | "color" | "type"> | null;
}
