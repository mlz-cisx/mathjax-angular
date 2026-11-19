import { ElementRef, SimpleChange } from '@angular/core';
import { MathjaxDirective } from './mathjax.directive';
import { getMathjax, loadMathjax, queueMathjax } from './mathjax-loader';

const globals = window as unknown as { MathJax?: any };

afterEach(() => {
  document.getElementById('mathjax-script')?.remove();
  delete globals.MathJax;
});

test('loads once without an inline script and waits for startup', async () => {
  loadMathjax({ src: '/mathjax.js' });
  const runtime = globals.MathJax;
  const defaultReady = jest.fn();
  runtime.startup.defaultReady = defaultReady;
  runtime.startup.promise = Promise.resolve();
  loadMathjax({});
  expect(document.querySelectorAll('#mathjax-script')).toHaveLength(1);
  expect(document.getElementById('mathjax-config-script')).toBeNull();
  runtime.startup.ready();
  await runtime.promise;
  expect(defaultReady).toHaveBeenCalledTimes(1);
});

test('rejects readiness when the script fails to load', async () => {
  loadMathjax({});
  const result = expect(getMathjax()!.promise).rejects.toThrow('Failed to load MathJax');
  document.getElementById('mathjax-script')!.dispatchEvent(new Event('error'));
  await result;
});

test('ignores stale renders, scopes typesetting, and clears on destruction', async () => {
  let ready!: () => void;
  globals.MathJax = {
    promise: new Promise<void>((resolve) => { ready = resolve; }),
    typesetPromise: jest.fn().mockResolvedValue(undefined),
    typesetClear: jest.fn(),
  };
  const runtime = globals.MathJax;
  const element = document.createElement('div');
  const directive = new MathjaxDirective(new ElementRef(element));
  directive.ngOnChanges({ mathjax: new SimpleChange('', '$old$', false) });
  directive.ngOnChanges({ mathjax: new SimpleChange('$old$', '$new$', false) });
  ready();
  await queueMathjax(() => undefined);
  expect(element.textContent).toBe('$new$');
  expect(runtime.typesetPromise).toHaveBeenCalledTimes(1);
  expect(runtime.typesetPromise).toHaveBeenCalledWith([element]);
  directive.ngOnDestroy();
  await queueMathjax(() => undefined);
  expect(runtime.typesetClear).toHaveBeenCalledTimes(2);
});

test('marks content ready after rendering', async () => {
  globals.MathJax = {
    promise: Promise.resolve(),
    typesetPromise: jest.fn().mockResolvedValue(undefined),
    typesetClear: jest.fn(),
  };
  const element = document.createElement('div');
  const directive = new MathjaxDirective(new ElementRef(element));
  directive.ngOnChanges({ mathjax: new SimpleChange(undefined, '$x$', true) });
  expect(directive.renderReady()).toBe(false);
  await queueMathjax(() => undefined);
  expect(element.textContent).toBe('$x$');
  expect(directive.renderReady()).toBe(true);
  directive.ngOnDestroy();
  await queueMathjax(() => undefined);
});
