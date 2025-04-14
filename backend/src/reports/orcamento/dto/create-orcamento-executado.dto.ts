import { ApiHideProperty, ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { TipoProjeto, TipoRelatorio } from '@prisma/client';
import { Transform, Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { FiltroMetasIniAtividadeDto } from '../../relatorios/dto/filtros.dto';

export class OrcamentoExecutadoParams {
    /**
     * @example "Analitico"
     */
    @ApiProperty({ enum: TipoRelatorio, enumName: 'TipoRelatorio' })
    @IsEnum(TipoRelatorio, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoRelatorio).join(', '),
    })
    tipo: TipoRelatorio;

    /**
     * @example "2020-01-01"
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    inicio: Date;

    /**
     * @example "2022-01-01"
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    fim: Date;

    /**
     * filtrar apenas os órgão (SOF) que estão nessa lista
     * @example "[]"
     */
    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsString({ each: true, message: '$property| Cada item precisa ser um texto' })
    orgaos?: string[];
}

// excluindo o atividade/iniciativa pq nunca tem resultados pra orçamento
// logo n faz sentido ir buscar
export class SuperCreateOrcamentoExecutadoDto extends IntersectionType(
    OmitType(FiltroMetasIniAtividadeDto, ['atividade_id', 'iniciativa_id'] as const),
    OrcamentoExecutadoParams
) {
    /**
     * @example "21"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    @Expose()
    projeto_id?: number;

    /**
     * @example "21"
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @IsOptional()
    @Expose()
    portfolio_id?: number;

    @IsOptional()
    @IsEnum(TipoProjeto)
    @ApiHideProperty()
    @Expose()
    tipo_projeto?: TipoProjeto;
}

// aqui remove os filtros do projeto
export class PdmCreateOrcamentoExecutadoDto extends OmitType(SuperCreateOrcamentoExecutadoDto, [
    'projeto_id',
    'portfolio_id',
] as const) {}
