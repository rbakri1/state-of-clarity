/**
 * Supabase Mock
 *
 * Provides in-memory database mock for testing Supabase operations.
 */

import { vi } from 'vitest';

// In-memory data store
const mockDataStore = new Map<string, any[]>();

// Helper to get or initialize table data
function getTableData(table: string): any[] {
  if (!mockDataStore.has(table)) {
    mockDataStore.set(table, []);
  }
  return mockDataStore.get(table)!;
}

// Mock query builder
function createMockQueryBuilder(table: string) {
  let filters: Array<{ field: string; op: string; value: any }> = [];
  let orderConfig: { field: string; ascending: boolean } | null = null;
  let selectFields: string = '*';
  let pendingOperation: { type: 'update' | 'delete' | 'insert' | 'upsert'; data?: any } | null = null;

  // Helper to compare values, handling dates properly
  const compareValues = (a: any, b: any, op: string): boolean => {
    // Handle null/undefined
    if (a === null || a === undefined) return false;

    // For date comparisons (ISO strings), compare as strings (they sort correctly)
    // Numbers compare as numbers
    if (typeof a === 'number' && typeof b === 'number') {
      switch (op) {
        case 'gt': return a > b;
        case 'gte': return a >= b;
        case 'lt': return a < b;
        case 'lte': return a <= b;
        default: return a === b;
      }
    }

    // String comparison (works for ISO dates)
    const aStr = String(a);
    const bStr = String(b);
    switch (op) {
      case 'gt': return aStr > bStr;
      case 'gte': return aStr >= bStr;
      case 'lt': return aStr < bStr;
      case 'lte': return aStr <= bStr;
      default: return aStr === bStr;
    }
  };

  const filterData = (data: any[]): any[] => {
    return data.filter(row => {
      return filters.every(filter => {
        const value = row[filter.field];
        switch (filter.op) {
          case 'eq': return value === filter.value;
          case 'gt': return compareValues(value, filter.value, 'gt');
          case 'gte': return compareValues(value, filter.value, 'gte');
          case 'lt': return compareValues(value, filter.value, 'lt');
          case 'lte': return compareValues(value, filter.value, 'lte');
          case 'neq': return value !== filter.value;
          case 'in': return filter.value.includes(value);
          default: return true;
        }
      });
    });
  };

  const sortData = (data: any[]): any[] => {
    if (!orderConfig) return data;
    return [...data].sort((a, b) => {
      const aVal = a[orderConfig!.field];
      const bVal = b[orderConfig!.field];
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return orderConfig!.ascending ? cmp : -cmp;
    });
  };

  // Execute pending operation when awaited
  const executePendingOperation = (): { data: any; error: any } => {
    const tableData = getTableData(table);

    if (pendingOperation?.type === 'insert') {
      const items = Array.isArray(pendingOperation.data) ? pendingOperation.data : [pendingOperation.data];
      const insertedItems: any[] = [];
      items.forEach(item => {
        const newItem = {
          id: item.id || `mock-${Date.now()}-${Math.random()}`,
          created_at: item.created_at || new Date().toISOString(),
          ...item,
        };
        tableData.push(newItem);
        insertedItems.push(newItem);
      });
      return { data: insertedItems, error: null };
    }

    if (pendingOperation?.type === 'update') {
      const filtered = filterData(tableData);
      filtered.forEach(row => {
        Object.assign(row, pendingOperation!.data, { updated_at: new Date().toISOString() });
      });
      return { data: filtered, error: null };
    }

    if (pendingOperation?.type === 'delete') {
      const filtered = filterData(tableData);
      filtered.forEach(row => {
        const idx = tableData.indexOf(row);
        if (idx > -1) tableData.splice(idx, 1);
      });
      return { data: filtered, error: null };
    }

    if (pendingOperation?.type === 'upsert') {
      const items = Array.isArray(pendingOperation.data) ? pendingOperation.data : [pendingOperation.data];
      const resultItems: any[] = [];
      items.forEach(item => {
        const existing = tableData.find(row => row.id === item.id);
        if (existing) {
          Object.assign(existing, item, { updated_at: new Date().toISOString() });
          resultItems.push(existing);
        } else {
          const newItem = {
            id: item.id || `mock-${Date.now()}-${Math.random()}`,
            created_at: new Date().toISOString(),
            ...item,
          };
          tableData.push(newItem);
          resultItems.push(newItem);
        }
      });
      return { data: resultItems, error: null };
    }

    // Select operation (default)
    const data = sortData(filterData(tableData));
    return { data, error: null };
  };

  const builder = {
    select: vi.fn((fields: string = '*') => {
      selectFields = fields;
      return builder;
    }),
    insert: vi.fn((data: any | any[]) => {
      pendingOperation = { type: 'insert', data };
      return builder;
    }),
    update: vi.fn((data: any) => {
      pendingOperation = { type: 'update', data };
      return builder;
    }),
    delete: vi.fn(() => {
      pendingOperation = { type: 'delete' };
      return builder;
    }),
    upsert: vi.fn((data: any | any[]) => {
      pendingOperation = { type: 'upsert', data };
      return builder;
    }),
    eq: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'eq', value });
      return builder;
    }),
    neq: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'neq', value });
      return builder;
    }),
    gt: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'gt', value });
      return builder;
    }),
    gte: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'gte', value });
      return builder;
    }),
    lt: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'lt', value });
      return builder;
    }),
    lte: vi.fn((field: string, value: any) => {
      filters.push({ field, op: 'lte', value });
      return builder;
    }),
    in: vi.fn((field: string, values: any[]) => {
      filters.push({ field, op: 'in', value: values });
      return builder;
    }),
    order: vi.fn((field: string, options?: { ascending?: boolean }) => {
      orderConfig = { field, ascending: options?.ascending ?? true };
      return builder;
    }),
    limit: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(async () => {
      const result = executePendingOperation();
      if (result.error) return result;
      const data = Array.isArray(result.data) ? result.data : [result.data];
      if (data.length === 0) {
        return { data: null, error: { message: 'No rows found', code: 'PGRST116' } };
      }
      return { data: data[0], error: null };
    }),
    maybeSingle: vi.fn(async () => {
      const result = executePendingOperation();
      if (result.error) return result;
      const data = Array.isArray(result.data) ? result.data : [result.data];
      return { data: data[0] ?? null, error: null };
    }),
    then: async (resolve: (value: any) => void) => {
      resolve(executePendingOperation());
    },
  };

  // Make it thenable for await
  Object.defineProperty(builder, 'then', {
    value: async (resolve: (value: any) => void) => {
      resolve(executePendingOperation());
    },
  });

  return builder;
}

// Mock auth
const mockAuth = {
  getUser: vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id', email: 'test@example.com' } },
    error: null,
  }),
  getSession: vi.fn().mockResolvedValue({
    data: { session: { user: { id: 'test-user-id' } } },
    error: null,
  }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' }, session: {} },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({
    data: { user: { id: 'test-user-id' }, session: {} },
    error: null,
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
};

// Create mock Supabase client
export function createMockSupabaseClient() {
  return {
    from: vi.fn((table: string) => createMockQueryBuilder(table)),
    auth: mockAuth,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/image.jpg' } }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// Singleton mock client for global use
export const mockSupabaseClient = createMockSupabaseClient();

// Helper to seed mock data
export function seedMockData(table: string, data: any[]) {
  mockDataStore.set(table, [...data]);
}

// Helper to get mock data
export function getMockData(table: string): any[] {
  return getTableData(table);
}

// Helper to clear all mock data
export function clearMockData() {
  mockDataStore.clear();
}

// Helper to clear specific table
export function clearMockTable(table: string) {
  mockDataStore.delete(table);
}

// Export mock functions for assertion
export { mockAuth };
