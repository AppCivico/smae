import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePsMonitoramentoMensalFilterDto {
    @IsInt()
    plano_setorial_id: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    @Max(12)
    @Min(1)
    mes: number;

    @IsInt()
    @Transform(({ value }: any) => +value)
    @Min(1500)
    @Max(9999)
    ano: number;

    @IsOptional()
    @IsArray({ message: '$property| meta(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| meta(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| meta(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    metas?: [];

    @IsOptional()
    @IsArray({ message: '$property| tag(s): precisa ser uma array.' })
    @ArrayMinSize(0, { message: '$property| tag(s): precisa ter pelo menos um item' })
    @ArrayMaxSize(100, { message: '$property| tag(s): precisa ter no máximo 100 items' })
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    tags?: [];

    @IsBoolean()
    listar_variaveis_regionalizadas: boolean;
}
