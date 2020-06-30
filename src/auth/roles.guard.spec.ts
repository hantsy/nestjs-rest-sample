import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { TestingModule, Test } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { createMock } from '@golevelup/nestjs-testing';
import { RoleType } from '../database/role-type.enum';
import { AuthenticatedRequest } from './authenticated-request.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            constructor: jest.fn(),
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    jest.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => {
      return undefined;
    });
    expect(
      guard.canActivate(
        createMock<ExecutionContext>({
          getHandler: jest.fn(),
        }),
      ),
    ).toBe(true);
    expect(reflector.get).toBeCalled();
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    jest.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => {
      return [RoleType.USER];
    });
    expect(
      guard.canActivate(
        createMock<ExecutionContext>({
          getHandler: jest.fn(),
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: { roles: [RoleType.USER]},
            } as AuthenticatedRequest),
          }),
        }),
      ),
    ).toBe(true);
    expect(reflector.get).toBeCalled();
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    jest.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => {
      return [RoleType.ADMIN];
    });
    expect(
      guard.canActivate(
        createMock<ExecutionContext>({
          getHandler: jest.fn(),
          switchToHttp: jest.fn().mockReturnValue({
            getRequest: jest.fn().mockReturnValue({
              user: { roles: [RoleType.USER]},
            } as AuthenticatedRequest),
          }),
        }),
      ),
    ).toBe(false);
    expect(reflector.get).toBeCalled();
  });
});
