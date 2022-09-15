import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsNumberString } from 'class-validator';

export class FindOneParams {
    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;
}

export class FindTwoParams {
    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;

    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id2: number;
}
