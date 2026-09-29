import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for `canActivate`', async () => {
    AuthGuard('jwt').prototype.canActivate = vi.fn(() => Promise.resolve(true));
    AuthGuard('jwt').prototype.logIn = vi.fn(() => Promise.resolve());
    const context = {
      switchToHttp: vi.fn(),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
    expect(await guard.canActivate(context)).toBeTruthy();
  });

  it('handleRequest: error', async () => {
    const error = { name: 'test', message: 'error' } as Error;

    try {
      guard.handleRequest(error, {}, {});
    } catch (e) {
      expect(e).toEqual(error);
    }
  });

  it('handleRequest', async () => {
    expect(
      await guard.handleRequest(undefined, { username: 'hantsy' }, undefined),
    ).toEqual({ username: 'hantsy' });
  });

  it('handleRequest: Unauthorized', async () => {
    try {
      guard.handleRequest(undefined, undefined, undefined);
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});
