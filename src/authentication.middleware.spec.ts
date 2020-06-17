import { AuthenticationMiddleware } from './authentication.middleware';

describe('AuthenticationMiddleware', () => {
  it('should be defined', () => {
    expect(new AuthenticationMiddleware()).toBeDefined();
  });
});
