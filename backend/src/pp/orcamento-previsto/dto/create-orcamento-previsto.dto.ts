import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateMetaOrcamentoDto, OrcamentoPrevistoEhZeroStatusDto, UpdateOrcamentoPrevistoZeradoDto } from "../../../meta-orcamento/dto/meta-orcamento.dto";
import { IsInt, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { OrcamentoPrevistoDto } from "../entities/orcamento-previsto.entity";

export class CreateOrcamentoPrevistoDto extends OmitType(CreateMetaOrcamentoDto, ['meta_id', 'iniciativa_id', 'atividade_id']) { }

export class UpdateOrcamentoPrevistoDto extends OmitType(PartialType(CreateOrcamentoPrevistoDto), ['ano_referencia']) { }

export class FilterOrcamentoPrevistoDto {
    /**
     * Filtrar por ano_referencia?
     * @example "2022"
     */
    @IsInt({ message: '$property| ano_referencia precisa ser positivo' })
    @Type(() => Number)
    ano_referencia: number;
}
export class ProjetoUpdateOrcamentoPrevistoZeradoDto extends OmitType(UpdateOrcamentoPrevistoZeradoDto, ['meta_id'] as const) {

}

export class ListOrcamentoPrevistoDto extends OrcamentoPrevistoEhZeroStatusDto {
    linhas: OrcamentoPrevistoDto[];
}
