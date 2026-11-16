import { registerDecorator, ValidationOptions } from 'class-validator';
import { isFutureDate, isValidDateString } from './dates.js';

export function IsIsoDate(options: { allowFuture?: boolean } = {}, validation?: ValidationOptions) {
  const allowFuture = options.allowFuture ?? true;
  return (target: object, propertyName: string) => {
    registerDecorator({
      name: 'isIsoDate',
      target: target.constructor,
      propertyName,
      options: {
        message: allowFuture
          ? `${propertyName} must be a valid date in YYYY-MM-DD format`
          : `${propertyName} must be a valid YYYY-MM-DD date that is not in the future`,
        ...validation,
      },
      validator: {
        validate: (value: unknown) =>
          isValidDateString(value) && (allowFuture || !isFutureDate(value)),
      },
    });
  };
}
