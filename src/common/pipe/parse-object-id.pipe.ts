import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform
} from '@nestjs/common';
import * as mongoose from 'mongoose';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata) {
    if (!mongoose.isValidObjectId(value)) {
      throw new BadRequestException(`$value is not a valid mongoose object id`);
    }
    return value;
  }
}
