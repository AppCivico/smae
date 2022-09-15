import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumberString } from 'class-validator';

export class FindOneParams {
    @ApiProperty()
    @IsNumberString(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;
}

export class FindTwoParams {
    @ApiProperty()
    @IsNumberString(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;

    @ApiProperty()
    @IsNumberString(undefined, { message: ':id2 precisa ser um número' })
    @Transform(({ value }) => +value)
    id2: number;
}
