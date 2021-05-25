import getString from '../src/app';

test('empty test', () => {
  expect(getString()).toBe('string2');
  expect(getString()).not.toBe(5);
});
