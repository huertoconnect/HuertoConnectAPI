export type ColumnDef<T> = {
  key: string;
  header: string;
  cell?: (row: T) => string | number;
  width?: string;
  align?: 'left' | 'center' | 'right';
  isCustom?: boolean;
};

export type ActionDef<T> = {
  id: string;
  label: string;
  icon?: string;
  variant?: 'primary' | 'danger' | 'ghost';
  requiresSelection?: boolean;
  handler: (selected: T | null) => void;
};
