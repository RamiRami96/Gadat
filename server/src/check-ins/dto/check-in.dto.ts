import { IsString, MaxLength } from 'class-validator';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

export class RangeQuery {
  @IsIsoDate()
  public from!: string;

  @IsIsoDate()
  public to!: string;
}

export class CheckInParams {
  @IsString()
  @MaxLength(64)
  public id!: string;

  @IsIsoDate({ allowFuture: false })
  public date!: string;
}
