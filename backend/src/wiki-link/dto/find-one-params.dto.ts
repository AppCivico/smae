import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';
import { Transform } from 'class-transformer';


export class FindOneParams {
    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;
}
