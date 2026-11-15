import { IsString, MaxLength } from 'class-validator';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

export class RangeQuery {
  @IsIsoDate()
  from!: string;

  @IsIsoDate()
  to!: string;
}

/** Path params of PUT/DELETE /habits/:id/check-ins/:date. */
export class CheckInParams {
  @IsString()
  @MaxLength(64)
  id!: string;

  @IsIsoDate({ allowFuture: false })
  date!: string;
}
