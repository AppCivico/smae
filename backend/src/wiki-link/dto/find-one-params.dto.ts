import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';


export class FindOneParams {
    @ApiProperty()
    @IsNumber(undefined, { message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;
}
