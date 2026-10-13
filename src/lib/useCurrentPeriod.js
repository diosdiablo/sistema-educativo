import { useState, useEffect, useCallback, useRef } from 'react';

export function getCurrentPeriod(periodDates, fallback = null, zeroIndexed = false) {
  const now = new Date().toISOString().split('T')[0];
  const entries = Object.entries(periodDates || {});
  if (entries.length === 0) return fallback;
  const fmt = (id) => (zeroIndexed ? Number(id) - 1 : id);

  // 1) Periodo que contiene la fecha de hoy
  for (const [id, { start, end }] of entries) {
    if (now >= start && now <= end) return fmt(id);
  }

  // 2) Último periodo ya iniciado (ej. hoy entre periodos configurados)
  let lastStarted = null;
  for (const [id, { start }] of entries) {
    if (start <= now && (!lastStarted || start > lastStarted.start)) lastStarted = { id, start };
  }
  if (lastStarted) return fmt(lastStarted.id);

  // 3) Primer periodo por iniciarse
  let next = null;
  for (const [id, { start }] of entries) {
    if (!next || start < next.start) next = { id, start };
  }
  return next ? fmt(next.id) : fallback;
}

export function useCurrentPeriod(periodDates, options = {}) {
  const { fallback = null, zeroIndexed = false } = options;
  const compute = useCallback(
    () => getCurrentPeriod(periodDates, fallback, zeroIndexed),
    [periodDates, fallback, zeroIndexed]
  );
  const [period, setPeriod] = useState(compute);
  const userPicked = useRef(false);

  useEffect(() => {
    if (!userPicked.current) setPeriod(compute());
  }, [compute]);

  const setWithFlag = useCallback((v) => {
    userPicked.current = true;
    setPeriod(v);
  }, []);

  return [period, setWithFlag];
}