import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class FindOneParams {
    @ApiProperty()
    @IsNumberString(undefined, { message: ':id precisa ser um número' })
    id: number;
}

export class FindTwoParams {
    @ApiProperty()
    @IsNumberString(undefined, { message: ':id precisa ser um número' })
    id: number;

    @ApiProperty()
    @IsNumberString(undefined, { message: ':id2 precisa ser um número' })
    id2: number;
}
