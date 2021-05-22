import getString from '../src/app';

test('empty test', () => {
  expect(getString()).toBe('string');
  expect(getString()).not.toBe(5);
});
