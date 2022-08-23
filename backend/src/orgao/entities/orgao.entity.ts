import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { TipoOrgao } from "src/tipo-orgao/entities/tipo-orgao.entity";

export class Orgao {
    @ApiProperty({ description: 'ID do Orgão', })
    id?: number;
    @ApiProperty({ description: 'Sigla', })
    sigla: string;
    @ApiProperty({ description: 'Descrição', })
    descricao: string;
    @ApiHideProperty()
    tipo_orgao_id?: number;
    @ApiProperty({ description: 'Tipo do Orgão', })
    tipo_orgao?: TipoOrgao;
}
