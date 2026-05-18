// Stub: Supabase client removed during auth refactor
// sync.ts still imports this but Supabase operations are disabled

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createQuery = (): any => {
  const query = {
    select: () => createQuery(),
    delete: () => createQuery(),
    eq: () => createQuery(),
    in: () => createQuery(),
    single: () => createQuery(),
    order: () => createQuery(),
    upsert: () => createQuery(),
    then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) =>
      Promise.resolve({ data: [], error: null }).then(onfulfilled, onrejected),
  };
  return query;
};

export const supabase = {
  from: (table: string) => createQuery(),
};
