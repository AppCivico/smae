import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_LENGTH_DEFAULT } from '../../common/consts';

export class CriarImpersonacaoDto {
    @ApiProperty({ description: 'ID da pessoa que será personificada', example: 42 })
    @IsInt({ message: 'pessoa_id: Precisa ser um número inteiro' })
    @IsPositive({ message: 'pessoa_id: Precisa ser um número positivo' })
    pessoa_id: number;

    @ApiProperty({
        description: 'Justificativa da personificação. Fica registrada no log de auditoria.',
        example: 'Chamado #1234 - reproduzir erro relatado pelo usuário',
    })
    @IsString({ message: 'motivo: Precisa ser uma string' })
    @MinLength(10, { message: 'motivo: Precisa ter no mínimo 10 caracteres' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `motivo: Precisa ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    motivo: string;
}

export class ImpersonacaoCriadaDto {
    @ApiProperty({
        description:
            'URL para o navegador de quem pediu. O token vai no fragmento (#), que não é enviado ao servidor nem gravado em log de acesso.',
        example: 'https://smae.exemplo.br/impersonar#t=abc123',
    })
    url: string;

    @ApiProperty({ description: 'Momento em que o token deixa de valer' })
    expira_em: Date;

    @ApiProperty({ description: 'ID da pessoa que será personificada' })
    pessoa_id: number;

    @ApiProperty({ description: 'Nome da pessoa que será personificada' })
    nome_exibicao: string;
}

export class LoginPorTokenDto {
    @ApiProperty({ description: 'Token de uso único devolvido por POST /impersonacao' })
    @IsString({ message: 'token: Precisa ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `token: Precisa ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    token: string;
}
