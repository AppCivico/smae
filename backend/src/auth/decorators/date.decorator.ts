import { applyDecorators } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { DateTransform } from '../transforms/date.transform';
import { IsOnlyDate } from '../../common/decorators/IsDateOnly';
import { Transform } from 'class-transformer';

export function IsDateYMD(opts?: Parameters<typeof ApiProperty>[0]): PropertyDecorator {
    return applyDecorators(
        IsOnlyDate(), //
        Transform(DateTransform), //
        ApiProperty({ type: 'string', format: 'date', ...opts })
    );
}
