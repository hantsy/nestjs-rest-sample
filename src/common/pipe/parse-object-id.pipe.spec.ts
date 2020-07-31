import * as mongoose from 'mongoose';
import { ParseObjectIdPipe } from './parse-object-id.pipe';

describe('ParseObjectIdPipe', () => {
  let isObjectId;

  beforeEach(() => {
    isObjectId = new ParseObjectIdPipe();
  });

  it('should be defined', () => {
    expect(isObjectId).toBeDefined();
  });

  it('if valid', () => {
    const validId = new mongoose.Types.ObjectId().toHexString();
    const result = isObjectId.transform(validId, {} as any);
    expect(result).toEqual(validId);
  });

  it('if invalid', () => {
    try {
      const result = isObjectId.transform('anerror', {} as any);
    } catch (e) {
      expect(e).not.toBeNull();
    }
  });
});
