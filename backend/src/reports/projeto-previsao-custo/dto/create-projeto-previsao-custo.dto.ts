import { OmitType } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';
import { IsInt } from 'class-validator';
import { SuperCreateRelPrevisaoCustoDto } from 'src/reports/previsao-custo/dto/create-previsao-custo.dto';

export class CreateRelProjetoPrevisaoCustoDto extends OmitType(SuperCreateRelPrevisaoCustoDto, [
    'atividade_id',
    'iniciativa_id',
    'meta_id',
    'pdm_id',
    'tags',
    'portfolio_id', // excluindo pra recriar com sem o decorator poluir
] as const) {
    /**
     * required nesse endpoint!
     * @example "21"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @Expose()
    portfolio_id: number;
}

export class CreateRelObrasPrevisaoCustoDto extends CreateRelProjetoPrevisaoCustoDto {}
