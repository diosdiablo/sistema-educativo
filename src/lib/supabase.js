import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
}

const rawClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

let readOnly = false;
export const setSupabaseReadOnly = (v) => { readOnly = v; };
export const isSupabaseReadOnly = () => readOnly;

const NOOP_RESULT = { data: null, error: null };
const NOOP_ERROR = { error: { message: 'Modo solo lectura', code: 'READONLY' } };

const readOnlyChain = {
  then(resolve) { return Promise.resolve(NOOP_RESULT).then(resolve); },
  catch(reject) { return Promise.resolve(NOOP_RESULT).catch(reject); },
  finally(handler) { return Promise.resolve(NOOP_RESULT).finally(handler); },
  eq: () => readOnlyChain,
  neq: () => readOnlyChain,
  gt: () => readOnlyChain,
  gte: () => readOnlyChain,
  lt: () => readOnlyChain,
  lte: () => readOnlyChain,
  like: () => readOnlyChain,
  ilike: () => readOnlyChain,
  in: () => readOnlyChain,
  is: () => readOnlyChain,
  contains: () => readOnlyChain,
  select: () => readOnlyChain,
  order: () => readOnlyChain,
  limit: () => readOnlyChain,
  range: () => readOnlyChain,
  single: () => readOnlyChain,
  maybeSingle: () => readOnlyChain,
  count: () => readOnlyChain,
  upsert: () => readOnlyChain,
  install: () => readOnlyChain,
};

const WRITE_METHODS = new Set(['insert', 'update', 'upsert', 'delete']);
const STORAGE_WRITE_METHODS = new Set(['upload', 'remove']);

const makeReadOnlyStorageBucket = (realBucket) => new Proxy(realBucket, {
  get(target, prop, receiver) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);
    if (STORAGE_WRITE_METHODS.has(prop)) return async () => NOOP_ERROR;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  }
});

export const supabase = new Proxy(rawClient, {
  get(target, prop, receiver) {
    if (typeof prop === 'symbol') return Reflect.get(target, prop, receiver);

    if (prop === 'from') {
      return (table) => {
        const realBuilder = target.from(table);
        if (!readOnly) return realBuilder;
        return new Proxy(realBuilder, {
          get(bTarget, bProp, bReceiver) {
            if (typeof bProp === 'symbol') return Reflect.get(bTarget, bProp, bReceiver);
            if (WRITE_METHODS.has(bProp)) return (...args) => readOnlyChain;
            const value = Reflect.get(bTarget, bProp, bReceiver);
            return typeof value === 'function' ? value.bind(bTarget) : value;
          }
        });
      };
    }

    if (prop === 'rpc') {
      return (...args) => (readOnly ? Promise.resolve(NOOP_RESULT) : target.rpc(...args));
    }

    if (prop === 'storage') {
      const realStorage = target.storage;
      if (!readOnly) return realStorage;
      return new Proxy(realStorage, {
        get(sTarget, sProp, sReceiver) {
          if (typeof sProp === 'symbol') return Reflect.get(sTarget, sProp, sReceiver);
          if (sProp === 'from') {
            return (bucket) => makeReadOnlyStorageBucket(sTarget.from(bucket));
          }
          const value = Reflect.get(sTarget, sProp, sReceiver);
          return typeof value === 'function' ? value.bind(sTarget) : value;
        }
      });
    }

    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  }
});