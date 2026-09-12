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
  recurring_id: string | null;
  created_at: string;
}

export type RecurringFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly";

export interface RecurringTransaction {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TxType;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  start_date: string; // 'YYYY-MM-DD'
  next_due: string; // 'YYYY-MM-DD'
  end_date: string | null;
  is_active: boolean;
  created_at: string;
}

// A transaction joined with the (possibly archived) category it belongs to.
export interface TransactionWithCategory extends Transaction {
  category: Pick<Category, "id" | "name" | "color" | "type"> | null;
}

// Saved timeframe for the dashboard summary cards.
export type DashboardTimeframe = "month" | "last6" | "last12" | "ytd" | "all";
// Saved timeframe for the transactions summary card.
export type TransactionsTimeframe = "month" | "year" | "all";

// One per user (table `preferences`); see supabase/migration-preferences.sql.
export interface Preferences {
  user_id: string;
  dashboard_timeframe: DashboardTimeframe;
  transactions_summary_timeframe: TransactionsTimeframe;
  updated_at: string;
}

/**
 * A future recurring occurrence that has not been materialized into a
 * `transactions` row yet. Deliberately not a `Transaction` — it has no `id`
 * and must never be passed to the transaction server actions.
 */
export interface ProjectedOccurrence {
  recurring_id: string;
  category: Pick<Category, "id" | "name" | "color" | "type"> | null;
  type: TxType;
  amount: number;
  note: string | null;
  occurred_on: string; // 'YYYY-MM-DD'
  frequency: RecurringFrequency;
}
