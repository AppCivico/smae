import { ApiProperty } from '@nestjs/swagger';

export class ReducedAccessToken {
    @ApiProperty({ description: 'Token de acesso para trocar senha', example: 'header.body.signed' })
    reduced_access_token: string;
}
