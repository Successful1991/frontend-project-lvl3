function getString() {
  return 'string';
}

test('empty test', () => {
  expect(getString()).toBe('string');
  expect(getString()).not.toBe(5);
});
