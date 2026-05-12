import { OmitType } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';
import { IsInt } from 'class-validator';
import { SuperCreateOrcamentoExecutadoDto } from 'src/reports/orcamento/dto/create-orcamento-executado.dto';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export class CreateRelProjetoOrcamentoDto extends OmitType(SuperCreateOrcamentoExecutadoDto, [
    'meta_id',
    'tags',
    'pdm_id',
    'portfolio_id', // excluindo pra recriar com sem o decorator poluir
] as const) {
    /**
     * required nesse endpoint!
     * @example "21"
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    portfolio_id: number;
}

export class CreateRelObrasOrcamentoDto extends CreateRelProjetoOrcamentoDto {}
