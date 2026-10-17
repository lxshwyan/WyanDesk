export const SECOND_MS = 1_000;
export const MINUTE_MS = 60_000;

type TimerHandle = ReturnType<typeof globalThis.setTimeout>;

interface AlignedClockOptions {
  now?: () => number;
  schedule?: (callback: () => void, delay: number) => TimerHandle;
  cancel?: (timer: TimerHandle) => void;
}

export function millisecondsUntilNextBoundary(timestamp: number, interval: number): number {
  if (!Number.isFinite(timestamp) || !Number.isFinite(interval) || interval <= 0) return 1;
  const remainder = ((timestamp % interval) + interval) % interval;
  return remainder === 0 ? interval : interval - remainder;
}

export function startAlignedClock(
  interval: number,
  onTick: (value: Date) => void,
  options: AlignedClockOptions = {},
): () => void {
  const now = options.now ?? Date.now;
  const schedule = options.schedule ?? ((callback, delay) => globalThis.setTimeout(callback, delay));
  const cancel = options.cancel ?? ((timer) => globalThis.clearTimeout(timer));
  let timer: TimerHandle | undefined;
  let stopped = false;

  const queueNextTick = () => {
    timer = schedule(() => {
      if (stopped) return;
      onTick(new Date(now()));
      queueNextTick();
    }, millisecondsUntilNextBoundary(now(), interval));
  };

  queueNextTick();

  return () => {
    stopped = true;
    if (timer !== undefined) cancel(timer);
  };
}
