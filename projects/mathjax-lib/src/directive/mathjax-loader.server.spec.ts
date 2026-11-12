/** @jest-environment node */
import { getMathjax, loadMathjax, queueMathjax } from './mathjax-loader';

test('does not access browser globals on the server', async () => {
  expect(() => loadMathjax({})).not.toThrow();
  expect(getMathjax()).toBeUndefined();
  const render = jest.fn();
  await queueMathjax(render);
  expect(render).not.toHaveBeenCalled();
});
