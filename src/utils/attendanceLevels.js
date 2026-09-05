export const LEVELS = { IE: 'llega', CLASE: 'clase' };

const isStructured = (entry) =>
  entry && typeof entry === 'object' && !Array.isArray(entry) && ('llega' in entry || 'clase' in entry);

export const markFor = (entry, level, assistantIds) => {
  if (entry === null || entry === undefined || entry === '-') return null;
  if (typeof entry !== 'object') {
    return { s: String(entry), u: '', n: '' };
  }
  if (isStructured(entry)) {
    return entry[level] || null;
  }
  const owned = assistantIds && assistantIds.has(entry.u);
  if (level === LEVELS.IE && !owned) return null;
  if (level === LEVELS.CLASE && owned) return null;
  return { s: entry.s ?? null, u: entry.u || '', n: entry.n || '' };
};

export const statusForEntry = (entry, level, assistantIds) => markFor(entry, level, assistantIds)?.s || null;

export const noteFor = (entry) =>
  entry && typeof entry === 'object' && typeof entry.o === 'string' ? entry.o : '';

export const markIsOwn = (mark, userId) => !!mark && !!userId && mark.u === userId;