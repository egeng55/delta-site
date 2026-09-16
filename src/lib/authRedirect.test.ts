import { authRedirect } from './authRedirect';
it.each(['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/signup', '/\nevil'])('rejects unsafe or looping redirect %s', value => {
  expect(authRedirect(value)).toBe('/hq');
});
it('preserves internal path, query and hash', () => {
  expect(authRedirect('/hq#architecture')).toBe('/hq#architecture');
  expect(authRedirect('/oauth/consent?authorization_id=example')).toBe('/oauth/consent?authorization_id=example');
});
