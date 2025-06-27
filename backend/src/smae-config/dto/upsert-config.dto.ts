import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertConfigDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    key: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    value: string;
}
