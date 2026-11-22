import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { IsIsoDate } from '../../common/is-iso-date.decorator.js';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimOrNull = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

export class CreateHabitDto {
  @Transform(trim)
  @IsString()
  @Length(1, 40)
  public name: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  public note?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'days must contain at least one weekday' })
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  public days?: number[];

  @IsIsoDate({ allowFuture: false })
  public startDate: string;
}

export class UpdateHabitDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(1, 40)
  public name?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(60)
  public note?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, { message: 'days must contain at least one weekday' })
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  public days?: number[];
}

export class ArchiveHabitQuery {
  @IsIsoDate({ allowFuture: false })
  public date: string;
}
