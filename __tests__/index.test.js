import getString from '../src/assets/js';

test('empty test', () => {
  expect(getString()).toBe('string');
  expect(getString()).not.toBe(5);
});
