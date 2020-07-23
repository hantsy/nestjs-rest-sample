const getMock = jest.fn().mockImplementationOnce(cb => cb)
const virtualMock = jest.fn().mockImplementationOnce(
    (name: string) => ({
        get: getMock
    })
);

jest.mock('mongoose', () => ({
    Schema: jest.fn().mockImplementation(
        (def: any, options: any) => ({
            constructor: jest.fn(),
            virtual: virtualMock
        })
    ),
    SchemaTypes: jest.fn().mockImplementation(() => ({
        String: jest.fn()
    }))
}))

import { UserSchema } from "./user.model";
import * as mongoose from "mongoose";
import { anyFunction } from "jest-mock-extended";

describe('UserSchema', () => {

    it('should called Schame.virtual ', () => {
        expect(UserSchema).toBeDefined()

        expect(getMock).toBeCalled()
        expect(getMock).toBeCalledWith(anyFunction())
        expect(virtualMock).toBeCalled()
        expect(virtualMock).toHaveBeenNthCalledWith(1, "name")
        expect(virtualMock).toHaveBeenNthCalledWith(2, "posts", { "foreignField": "createdBy", "localField": "_id", "ref": "Post" })
        expect(virtualMock).toBeCalledTimes(2)
    });

});
