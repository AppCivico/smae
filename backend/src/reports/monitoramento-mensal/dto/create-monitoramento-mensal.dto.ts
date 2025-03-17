import { IntersectionType, OmitType } from '@nestjs/swagger';
import { Transform, Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsOptional } from 'class-validator';
import { FiltroMetasIniAtividadeDto } from '../../relatorios/dto/filtros.dto';

export class RelMonitoramentoMensalParams {
    /** ano do ciclo
     * @example ""
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @Expose()
    ano: number;

    /** mes do ciclo
     * @example ""
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @Expose()
    mes: number;

    /**
     * quais paineis puxar os relatorios
     * @example "[]"
     */
    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Expose()
    paineis: number[];
}

// excluindo o atividade/iniciativa pq sempre busca pela meta aqui
// logo n faz sentido ir buscar
export class CreateRelMonitoramentoMensalDto extends IntersectionType(
    OmitType(FiltroMetasIniAtividadeDto, ['atividade_id', 'iniciativa_id'] as const),
    RelMonitoramentoMensalParams
) {}
