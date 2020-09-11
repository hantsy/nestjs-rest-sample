import { createMock } from '@golevelup/ts-jest';
import { ExecutionContext } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { mock as jestMock, mockClear } from 'jest-mock-extended';
import { instance, mock, reset, verify, when } from 'ts-mockito';
import { RoleType } from '../../shared/enum/role-type.enum';
import { HAS_ROLES_KEY } from '../auth.constants';
import { AuthenticatedRequest } from '../interface/authenticated-request.interface';
import { RolesGuard } from './roles.guard';

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

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    jest.spyOn(reflector, 'get').mockImplementation((a: any, b: any) => []);
    const context = createMock<ExecutionContext>();
    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflector.get).toBeCalled();
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    jest
      .spyOn(reflector, 'get')
      .mockImplementation((a: any, b: any) => [RoleType.USER]);
    const context = createMock<ExecutionContext>({
      getHandler: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { roles: [RoleType.USER] },
        } as AuthenticatedRequest),
      }),
    });

    const result = await guard.canActivate(context);
    expect(result).toBeTruthy();
    expect(reflector.get).toBeCalled();
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    jest.spyOn(reflector, 'get').mockReturnValue([RoleType.ADMIN]);
    const request = {
      user: { roles: [RoleType.USER] },
    } as AuthenticatedRequest;
    const context = createMock<ExecutionContext>();
    const httpArgsHost = createMock<HttpArgumentsHost>({
      getRequest: () => request,
    });
    context.switchToHttp.mockImplementation(() => httpArgsHost);

    const result = await guard.canActivate(context);
    expect(result).toBeFalsy();
    expect(reflector.get).toBeCalled();
  });
});

describe('RolesGuard(ts-mockito)', () => {
  let guard: RolesGuard;
  const reflecter = mock(Reflector);
  beforeEach(() => {
    guard = new RolesGuard(instance(reflecter));
  });

  afterEach(() => {
    reset();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    const context = mock<ExecutionContext>();
    when(context.getHandler()).thenReturn({} as any);

    const contextInstacne = instance(context);
    when(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).thenReturn([] as RoleType[]);
    const result = await guard.canActivate(contextInstacne);

    expect(result).toBeTruthy();
    verify(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).once();
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    const context = mock<ExecutionContext>();

    when(context.getHandler()).thenReturn({} as any);

    const arguHost = mock<HttpArgumentsHost>();
    when(arguHost.getRequest()).thenReturn({
      user: { roles: [RoleType.USER] },
    } as any);

    when(context.switchToHttp()).thenReturn(instance(arguHost));
    const contextInstacne = instance(context);

    when(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).thenReturn([RoleType.USER] as RoleType[]);

    const result = await guard.canActivate(contextInstacne);
    console.log(result);
    expect(result).toBeTruthy();
    verify(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).once();
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    const context = mock<ExecutionContext>();

    when(context.getHandler()).thenReturn({} as any);

    // logged in as USER
    const arguHost = mock<HttpArgumentsHost>();
    when(arguHost.getRequest()).thenReturn({
      user: { roles: [RoleType.USER] },
    } as any);

    when(context.switchToHttp()).thenReturn(instance(arguHost));
    const contextInstacne = instance(context);

    // but requires ADMIN
    when(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).thenReturn([RoleType.ADMIN] as RoleType[]);

    const result = await guard.canActivate(contextInstacne);
    console.log(result);
    expect(result).toBeFalsy();
    verify(
      reflecter.get<RoleType[]>(HAS_ROLES_KEY, contextInstacne.getHandler()),
    ).once();
  });
});

describe('RoelsGuard(jest-mock-extended)', () => {
  let guard: RolesGuard;
  const reflecter = jestMock<Reflector>();

  beforeEach(() => {
    guard = new RolesGuard(reflecter);
  });

  afterEach(() => {
    mockClear(reflecter);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should skip(return true) if the `HasRoles` decorator is not set', async () => {
    const context = jestMock<ExecutionContext>();
    context.getHandler.mockReturnValue({} as any);
    reflecter.get
      .mockReturnValue([])
      .calledWith(HAS_ROLES_KEY, context.getHandler());

    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflecter.get).toBeCalledTimes(1);
  });

  it('should return true if the `HasRoles` decorator is set', async () => {
    const context = jestMock<ExecutionContext>();
    context.getHandler.mockReturnValue({} as any);

    const arguHost = jestMock<HttpArgumentsHost>();
    arguHost.getRequest.mockReturnValue({
      user: { roles: [RoleType.USER] },
    } as any);

    context.switchToHttp.mockReturnValue(arguHost);

    reflecter.get
      .mockReturnValue([RoleType.USER])
      .calledWith(HAS_ROLES_KEY, context.getHandler());

    const result = await guard.canActivate(context);

    expect(result).toBeTruthy();
    expect(reflecter.get).toBeCalledTimes(1);
  });

  it('should return false if the `HasRoles` decorator is set but role is not allowed', async () => {
    // logged in as USER
    const context = jestMock<ExecutionContext>();
    context.getHandler.mockReturnValue({} as any);

    const arguHost = jestMock<HttpArgumentsHost>();
    arguHost.getRequest.mockReturnValue({
      user: { roles: [RoleType.USER] },
    } as any);

    context.switchToHttp.mockReturnValue(arguHost);

    //but requires ADMIN
    reflecter.get
      .mockReturnValue([RoleType.ADMIN])
      .calledWith(HAS_ROLES_KEY, context.getHandler());

    const result = await guard.canActivate(context);

    expect(result).toBeFalsy();
    expect(reflecter.get).toBeCalledTimes(1);
  });
});
