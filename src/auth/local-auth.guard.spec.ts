import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  beforeEach(() => {
    guard = new LocalAuthGuard();
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  it('should return true for `canActivate`', async () => {
    AuthGuard('local').prototype.canActivate = jest.fn(() =>
      Promise.resolve(true),
    );
    AuthGuard('local').prototype.logIn = jest.fn(() => Promise.resolve());
    expect(await guard.canActivate({} as ExecutionContext)).toBe(true);
  });

});
