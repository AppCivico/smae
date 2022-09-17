import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { TipoOrgao } from "src/tipo-orgao/entities/tipo-orgao.entity";

export class Orgao {
    @ApiProperty({ description: 'ID do Órgão', })
    id?: number;
    @ApiProperty({ description: 'Sigla', })
    sigla: string | null;
    @ApiProperty({ description: 'Descrição', })
    descricao?: string;
    @ApiHideProperty()
    tipo_orgao_id?: number;
    @ApiProperty({ description: 'Tipo do Órgão - Apenas na listagem dos órgãos', })
    tipo_orgao?: TipoOrgao;
}

export class OrgaoResumo {
    id: number;
    sigla: string | null;
    descricao: string;
}
