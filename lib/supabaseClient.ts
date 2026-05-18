// Stub: Supabase client removed during auth refactor
// sync.ts still imports this but Supabase operations are disabled

export const supabase = {
  from: () => ({
    upsert: async () => ({ error: null }),
    select: async () => ({ data: null, error: null }),
    delete: async () => ({ error: null }),
    eq: () => ({
      in: () => ({
        delete: async () => ({ error: null }),
      }),
      delete: async () => ({ error: null }),
      single: async () => ({ data: null, error: null }),
      order: () => ({
        select: async () => ({ data: null, error: null }),
      }),
    }),
    order: () => ({
      select: async () => ({ data: null, error: null }),
    }),
  }),
};
