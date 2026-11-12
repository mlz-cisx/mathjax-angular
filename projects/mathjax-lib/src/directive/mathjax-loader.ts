import { MathjaxDefaultConfig, mathjax_url, RootMathjaxConfig } from '../models';

interface MathjaxRuntime {
  startup: {
    promise: Promise<unknown>;
    defaultReady(): void;
    ready?: () => void;
  };
  promise?: Promise<void>;
  typesetPromise(elements: HTMLElement[]): Promise<unknown>;
  typesetClear(elements: HTMLElement[]): void;
}

export function getMathjax(): MathjaxRuntime | undefined {
  return typeof window === 'undefined'
    ? undefined
    : (window as unknown as { MathJax?: MathjaxRuntime }).MathJax;
}

export function loadMathjax(config: RootMathjaxConfig): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (document.getElementById('mathjax-script')) return;

  let resolve!: () => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Loading can fail before a directive starts waiting for MathJax.
  void promise.catch(() => undefined);
  const options = { ...MathjaxDefaultConfig, ...(config.config ?? {}) };
  const startup = config.config?.['startup'] as { ready?: () => void } | undefined;
  const runtime = {
    ...options,
    promise,
    startup: {
      ...startup,
      ready() {
        try {
          const mathjax = getMathjax()!;
          if (startup?.ready) startup.ready();
          else mathjax.startup.defaultReady();
          void mathjax.startup.promise.then(resolve, reject);
        } catch (error) {
          reject(error as Error);
        }
      },
    },
  };
  (window as unknown as { MathJax: unknown }).MathJax = runtime;
  const script = document.createElement('script');
  script.id = 'mathjax-script';
  script.src = config.src ?? mathjax_url;
  script.async = true;
  script.onerror = () => reject(new Error(`Failed to load MathJax: ${script.src}`));
  document.head.appendChild(script);
}

let pending: Promise<unknown> = Promise.resolve();

export function queueMathjax(action: (runtime: MathjaxRuntime) => Promise<unknown> | void): Promise<unknown> {
  const runtime = getMathjax();
  if (!runtime) return Promise.resolve();
  pending = pending.catch(() => undefined).then(async () => {
    await (runtime.promise ?? runtime.startup.promise);
    return action(runtime);
  });
  return pending;
}
