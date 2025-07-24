import { IndicadorTipo, TipoPdm } from '@prisma/client';
import { IdCodTituloDto } from '../../../common/dto/IdCodTitulo.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PdmRotuloInfoDto } from '../../../pdm/dto/pdm.dto';

export class VariavelGlobalRelacionamentoDto {
    indicadores_referenciando: VarGlobalRelIndicadorDto[];
    formulas_compostas_referenciando: VarGlobalRelFormulaCompostaDto[];
    variavel_mae?: IdCodTituloDto | null;
    variaveis_filhas?: IdCodTituloDto[];
    pdm_info: PdmInfoDto[];
    variaveis_busca: number[];
}

export class VarGlobalRelFormulaCompostaDto {
    id: number;
    titulo: string;
    tipo_pdm: TipoPdm;
    pdm_id: number | null;
    autogerenciavel: boolean;
    variavel: IdCodTituloDto;
}

export class VarGlobalRelIndicadorDto {
    id: number;
    codigo: string;
    titulo: string;
    tipo_indicador: IndicadorTipo;
    pdm_id: number | null;
    variavel: IdCodTituloDto;
    meta?: IdCodTituloDto | null;
    iniciativa?: IdCodTituloDto | null;
    atividade?: IdCodTituloDto | null;
}

export class PdmInfoDto extends PdmRotuloInfoDto {
    id: number;
    nome: string;
    @ApiProperty({ enum: TipoPdm, enumName: 'TipoPdm' })
    tipo: TipoPdm;
}
