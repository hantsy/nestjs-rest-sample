import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('LocalAuthGuard', () => {
  let guard: JwtAuthGuard;
  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true for `canActivate`', async () => {
    AuthGuard('jwt').prototype.canActivate = jest.fn(() =>
      Promise.resolve(true),
    );
    AuthGuard('jwt').prototype.logIn = jest.fn(() => Promise.resolve());
    expect(
      await guard.canActivate(createMock<ExecutionContext>()),
    ).toBeTruthy();
  });

  it('handleRequest: error', async () => {
    const error = { name: 'test', message: 'error' } as Error;

    try {
      guard.handleRequest(error, {}, {});
    } catch (e) {
      //console.log(e);
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
      // console.log(e);
      expect(e).toBeDefined();
    }
  });
});
