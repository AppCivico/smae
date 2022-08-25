import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
export class PessoaFromJwtBase {
    @ApiProperty({ description: 'ID da Pessoa' })
    id: number;
    @ApiProperty({ description: 'Nome Social' })
    nome_exibicao: string;
    @ApiProperty({ description: 'ID da sessão' })
    session_id: number;

    @ApiProperty({ description: 'Lista de privilegios' })
    privilegios: string[];

    @ApiProperty({ description: 'Lista de Módulos' })
    modulos: string[];

    @ApiHideProperty()
    orgao_id: undefined | number;
}