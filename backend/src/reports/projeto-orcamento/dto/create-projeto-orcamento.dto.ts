import { OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { SuperCreateOrcamentoExecutadoDto } from 'src/reports/orcamento/dto/create-orcamento-executado.dto';

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
    @Transform(({ value }: any) => +value)
    portfolio_id: number;
}

export class CreateRelObrasOrcamentoDto extends CreateRelProjetoOrcamentoDto {}
