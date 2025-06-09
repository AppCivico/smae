import { ApiProperty } from '@nestjs/swagger';
import { TipoOrgao } from '../../tipo-orgao/entities/tipo-orgao.entity';

export class OrgaoDto {
    @ApiProperty({ description: 'ID do Órgão' })
    id?: number;
    @ApiProperty({ description: 'Sigla' })
    sigla: string | null;
    @ApiProperty({ description: 'Descrição' })
    descricao?: string;

    tipo_orgao_id?: number;
    @ApiProperty({ description: 'Tipo do Órgão - Apenas na listagem dos órgãos' })
    tipo_orgao?: TipoOrgao;
}

export class OrgaoReduzidoDto {
    id: number;
    sigla: string | null;
    descricao: string;
}

export class OrgaoCompletoDto extends OrgaoDto {
    cnpj: string | null;
    email: string | null;
    secretario_responsavel: string | null;
    oficial: boolean | null;
    parente_id: number | null;
    nivel: number | null;
}
