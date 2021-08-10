const getMock = jest.fn().mockImplementationOnce((cb) => cb);
const virtualMock = jest.fn().mockImplementationOnce((name: string) => ({
  get: getMock,
}));

jest.mock('mongoose', () => ({
  Schema: jest.fn().mockImplementation((def: any, options: any) => ({
    constructor: jest.fn(),
    virtual: virtualMock,
    pre: jest.fn(),
    set: jest.fn(),
    methods: { comparePassword: jest.fn() },
    comparePassword: jest.fn(),
  })),
  SchemaTypes: jest.fn().mockImplementation(() => ({
    String: jest.fn(),
  })),
}));

import { anyFunction } from 'jest-mock-extended';
import {
  UserSchema,
  preSaveHook,
  nameGetHook,
  comparePasswordMethod,
} from './user.model';
import { hash } from 'bcrypt';
import { lastValueFrom } from 'rxjs';

describe('UserSchema', () => {
  it('should called Schame.virtual ', () => {
    expect(UserSchema).toBeDefined();

    expect(getMock).toBeCalled();
    expect(getMock).toBeCalledWith(anyFunction());
    expect(virtualMock).toBeCalled();
    expect(virtualMock).toHaveBeenNthCalledWith(1, 'name');
    expect(virtualMock).toHaveBeenNthCalledWith(2, 'posts', {
      foreignField: 'createdBy',
      localField: '_id',
      ref: 'Post',
    });
    expect(virtualMock).toBeCalledTimes(2);
  });
});

// see: https://stackoverflow.com/questions/58701700/how-do-i-test-if-statement-inside-my-mongoose-pre-save-hook
describe('preSaveHook', () => {
  test('should execute next middleware when password is not modified', async () => {
    const nextMock = jest.fn();
    const contextMock = {
      isModified: jest.fn(),
    };
    contextMock.isModified.mockReturnValueOnce(false);
    await preSaveHook.call(contextMock, nextMock);
    expect(contextMock.isModified).toBeCalledWith('password');
    expect(nextMock).toBeCalledTimes(1);
  });

  test('should set password when password is modified', async () => {
    const nextMock = jest.fn();
    const contextMock = {
      isModified: jest.fn(),
      set: jest.fn(),
      password: '123456',
    };
    contextMock.isModified.mockReturnValueOnce(true);
    await preSaveHook.call(contextMock, nextMock);
    expect(contextMock.isModified).toBeCalledWith('password');
    expect(nextMock).toBeCalledTimes(1);
    expect(contextMock.set).toBeCalledTimes(1);
  });
});

describe('nameGetHook', () => {
  test('should compute name with firstName and lastName', async () => {
    const contextMock = {
      firstName: 'Hantsy',
      lastName: 'Bai',
    };
    const name = await nameGetHook.call(contextMock);
    expect(name).toBe('Hantsy Bai');
  });
});

describe('comparePasswordMethod', () => {
  test('should be true if password is matched', async () => {
    const hashed = await hash('123456', 10);
    const contextMock = {
      password: hashed,
    };

    const result = await lastValueFrom(
      comparePasswordMethod.call(contextMock, '123456'),
    );
    expect(result).toBeTruthy();
  });

  test('should be false if password is not matched', async () => {
    const hashed = await hash('123456', 10);
    const contextMock = {
      password: hashed,
    };

    // input password is wrong
    const result = await lastValueFrom(
      comparePasswordMethod.call(contextMock, '000000'),
    );
    expect(result).toBeFalsy();
  });
});
