// A small in-memory stand-in for the Supabase query builder: enough of
// select/insert/update/upsert with eq/is/gte/lte/lt/order/maybeSingle/single
// for route tests that need state across calls.

type Row = Record<string, unknown>;

export function fakeSupabase() {
  const tables: Record<string, Row[]> = {};
  const table = (name: string) => (tables[name] ??= []);

  function from(name: string) {
    let op: 'select' | 'insert' | 'update' | 'upsert' = 'select';
    let payload: Row | Row[] | null = null;
    let returning = false;
    let one: 'single' | 'maybe' | null = null;
    const filters: ((r: Row) => boolean)[] = [];

    const run = () => {
      const rows = table(name);
      if (op === 'insert') {
        const list = (Array.isArray(payload) ? payload : [payload]) as Row[];
        rows.push(...list.map((r) => ({ ...r })));
        return shape(list);
      }
      if (op === 'update') {
        const hit = rows.filter((r) => filters.every((f) => f(r)));
        hit.forEach((r) => Object.assign(r, payload));
        return shape(returning ? hit : null);
      }
      return shape(rows.filter((r) => filters.every((f) => f(r))));
    };
    const shape = (data: Row[] | null) => {
      if (one) return { data: data?.[0] ?? null, error: null };
      return { data, error: null };
    };

    const q = {
      select() {
        if (op !== 'select') returning = true;
        return q;
      },
      insert(v: Row | Row[]) {
        op = 'insert';
        payload = v;
        return q;
      },
      update(v: Row) {
        op = 'update';
        payload = v;
        return q;
      },
      eq(k: string, v: unknown) {
        filters.push((r) => r[k] === v);
        return q;
      },
      is(k: string, v: unknown) {
        filters.push((r) => (r[k] ?? null) === v);
        return q;
      },
      gte(k: string, v: string) {
        filters.push((r) => String(r[k]) >= v);
        return q;
      },
      lte(k: string, v: string) {
        filters.push((r) => String(r[k]) <= v);
        return q;
      },
      lt(k: string, v: string) {
        filters.push((r) => String(r[k]) < v);
        return q;
      },
      order() {
        return q;
      },
      single() {
        one = 'single';
        return q;
      },
      maybeSingle() {
        one = 'maybe';
        return q;
      },
      then(resolve: (v: unknown) => unknown) {
        return Promise.resolve(run()).then(resolve);
      },
    };
    return q;
  }

  return { from, tables };
}
