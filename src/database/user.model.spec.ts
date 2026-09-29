vi.mock('mongoose', () => {
  const virtualCalls: any[][] = [];
  const getCalls: any[][] = [];

  const getMock = function (...args: any[]) {
    getCalls.push(args);
  };

  const virtualMock = function (...args: any[]) {
    virtualCalls.push(args);
    return { get: getMock };
  };

  (globalThis as any).__virtualCalls = virtualCalls;
  (globalThis as any).__getCalls = getCalls;

  function MockSchema(this: any, def: any, options: any) {
    this.virtual = virtualMock;
    this.pre = vi.fn();
    this.set = vi.fn();
    this.methods = { comparePassword: vi.fn() };
    this.statics = {};
    this.comparePassword = vi.fn();
  }

  return {
    Schema: MockSchema as any,
    SchemaTypes: {
      String: vi.fn(),
    },
  };
});

import {
  UserSchema,
  preSaveHook,
  nameGetHook,
  comparePasswordMethod,
} from './user.model';
import { hash } from 'bcrypt';
import { lastValueFrom } from 'rxjs';

const virtualCalls = (globalThis as any).__virtualCalls as any[][];
const getCalls = (globalThis as any).__getCalls as any[][];

describe('UserSchema', () => {
  it('should called Schema.virtual', () => {
    expect(UserSchema).toBeDefined();

    expect(virtualCalls.length).toBe(2);
    expect(virtualCalls[0]).toEqual(['name']);
    expect(virtualCalls[1]).toEqual([
      'posts',
      {
        foreignField: 'createdBy',
        localField: '_id',
        ref: 'Post',
      },
    ]);
    expect(getCalls.length).toBe(1);
    expect(getCalls[0][0]).toEqual(expect.any(Function));
  });
});

// see: https://stackoverflow.com/questions/58701700/how-do-i-test-if-statement-inside-my-mongoose-pre-save-hook
describe('preSaveHook', () => {
  test('should execute next middleware when password is not modified', async () => {
    const contextMock = {
      isModified: vi.fn(),
    } as any;
    contextMock.isModified.mockReturnValueOnce(false);
    await preSaveHook.call(contextMock);
    expect(contextMock.isModified).toHaveBeenCalledWith('password');
  });

  test('should set password when password is modified', async () => {
    const contextMock = {
      isModified: vi.fn(),
      set: vi.fn(),
      password: '123456',
    } as any;
    contextMock.isModified.mockReturnValueOnce(true);
    await preSaveHook.call(contextMock);
    expect(contextMock.isModified).toHaveBeenCalledWith('password');
    expect(contextMock.set).toHaveBeenCalledTimes(1);
  });
});

describe('nameGetHook', () => {
  test('should compute name with firstName and lastName', async () => {
    const contextMock = {
      firstName: 'Hantsy',
      lastName: 'Bai',
    } as any;
    const name = await nameGetHook.call(contextMock);
    expect(name).toBe('Hantsy Bai');
  });
});

describe('comparePasswordMethod', () => {
  test('should be true if password is matched', async () => {
    const hashed = await hash('123456', 10);
    const contextMock = {
      password: hashed,
    } as any;

    const result = await lastValueFrom(
      comparePasswordMethod.call(contextMock, '123456'),
    );
    expect(result).toBeTruthy();
  });

  test('should be false if password is not matched', async () => {
    const hashed = await hash('123456', 10);
    const contextMock = {
      password: hashed,
    } as any;

    // input password is wrong
    const result = await lastValueFrom(
      comparePasswordMethod.call(contextMock, '000000'),
    );
    expect(result).toBeFalsy();
  });
});
