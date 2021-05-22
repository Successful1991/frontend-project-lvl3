import getString from './../src/assets/app.js';

test('empty test', () => {
  expect(getString()).toBe('string');
  expect(getString()).not.toBe(5);
});
