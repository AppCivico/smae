import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';

export class FindOneParams {
    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;
}

export class FindTwoParams {
    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;

    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id2: number;
}

export class FindThreeParams {
    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id: number;

    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id2: number;

    @ApiProperty()
    @IsInt({ message: ':id precisa ser um número' })
    @Transform(({ value }) => +value)
    id3: number;
}

export class FindAnoParams {
    @ApiProperty()
    @IsInt({ message: ':ano precisa ser um número' })
    @Transform(({ value }) => +value)
    ano: number;
}
