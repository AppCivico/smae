import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

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

export class FindThreeParams {
    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;

    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id2: number;

    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id3: number;
}

export class FindAnoParams {
    @ApiProperty()
    @IsNumber(undefined, { message: ':ano precisa ser um número' })
    @Transform(({ value }) => +value)
    ano: number;
}
