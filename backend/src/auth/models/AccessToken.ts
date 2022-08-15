import { ApiProperty } from "@nestjs/swagger";

export class AccessToken {
    @ApiProperty({ description: 'Token de acesso para API', example: 'header.body.signed', })
    access_token: string;
}