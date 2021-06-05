import nock from 'nock';

nock.disableNetConnect();

test('empty test', () => {});

nock.enableNetConnect();
