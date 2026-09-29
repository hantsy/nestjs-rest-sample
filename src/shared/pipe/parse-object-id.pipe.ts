import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import * as mongoose from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  /**
   * Returns the input unchanged when Mongoose accepts it as an ObjectId.
   * @throws {BadRequestException} With INVALID_OBJECT_ID when validation fails.
   */
  transform(value: string, metadata: ArgumentMetadata) {
    if (!mongoose.isValidObjectId(value)) {
      throw new BadRequestException(
        `$value is not a valid mongoose object id`,
        { errorCode: 'INVALID_OBJECT_ID' },
      );
    }
    return value;
  }
}
