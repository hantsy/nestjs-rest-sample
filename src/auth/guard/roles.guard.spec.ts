import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RoleType } from '../../shared/enum/role-type.enum';
import { HAS_ROLES_KEY } from '../auth.constants';
import { AuthenticatedRequest } from '../interface/authenticated-request.interface';
import { RolesGuard } from './roles.guard';

function createMockExecutionContext(
  overrides: Partial<ExecutionContext> = {},
): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    getArgs: vi.fn(),
    getArgByIndex: vi.fn(),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue({}),
      getResponse: vi.fn().mockReturnValue({}),
      getNext: vi.fn(),
    }),
    switchToRpc: vi.fn(),
    switchToWs: vi.fn(),
    getType: vi.fn(),
    ...overrides,
  } as unknown as ExecutionContext;
}

function createMockHttpArgumentsHost(
  overrides: Partial<HttpArgumentsHost> = {},
): HttpArgumentsHost {
  return {
    getRequest: vi.fn().mockReturnValue({}),
    getResponse: vi.fn().mockReturnValue({}),
    getNext: vi.fn(),
    ...overrides,
  } as unknown as HttpArgumentsHost;
}

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
            constructor: vi.fn(),
            get: vi.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(async () => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    vi.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => []);
    const context = createMockExecutionContext();
    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflector.get).toHaveBeenCalled();
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    vi.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => [
      RoleType.USER,
    ]);
    const context = createMockExecutionContext({
      getHandler: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { roles: [RoleType.USER] },
        } as AuthenticatedRequest),
      }),
    });

    const result = await guard.canActivate(context);
    expect(result).toBeTruthy();
    expect(reflector.get).toHaveBeenCalled();
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    vi.spyOn(reflector, 'get').mockReturnValue([RoleType.ADMIN]);
    const request = {
      user: { roles: [RoleType.USER] },
    } as AuthenticatedRequest;
    const context = createMockExecutionContext();
    const httpArgsHost = createMockHttpArgumentsHost({
      getRequest: () => request,
    });
    (context.switchToHttp as ReturnType<typeof vi.fn>).mockImplementation(
      () => httpArgsHost,
    );

    const result = await guard.canActivate(context);
    expect(result).toBeFalsy();
    expect(reflector.get).toHaveBeenCalled();
  });
});

describe('RolesGuard(vi.fn)', () => {
  let guard: RolesGuard;
  const reflecterGetMock = vi.fn();
  const reflecter = {
    get: reflecterGetMock,
    getAll: vi.fn(),
    getAllByTarget: vi.fn(),
  } as unknown as Reflector;

  beforeEach(() => {
    guard = new RolesGuard(reflecter);
    reflecterGetMock.mockReset();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    const context = createMockExecutionContext();
    reflecterGetMock.mockReturnValue([]);

    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflecterGetMock).toHaveBeenCalledTimes(1);
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    const context = createMockExecutionContext({
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { roles: [RoleType.USER] },
        } as AuthenticatedRequest),
      }),
    });
    reflecterGetMock.mockReturnValue([RoleType.USER]);

    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflecterGetMock).toHaveBeenCalledTimes(1);
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    const request = {
      user: { roles: [RoleType.USER] },
    } as AuthenticatedRequest;
    const context = createMockExecutionContext();
    const httpArgsHost = createMockHttpArgumentsHost({
      getRequest: () => request,
    });
    (context.switchToHttp as ReturnType<typeof vi.fn>).mockImplementation(
      () => httpArgsHost,
    );

    reflecterGetMock.mockReturnValue([RoleType.ADMIN]);

    const result = await guard.canActivate(context);

    expect(result).toBeFalsy();
    expect(reflecterGetMock).toHaveBeenCalledTimes(1);
  });
});
