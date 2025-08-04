import { DadosEleicaoNivel } from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsEmpty, IsNotEmpty, IsNumber, IsOptional, ValidateIf } from 'class-validator';

export class GetEleicaoComparecimentoDto {
    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    eleicao_id?: number;

    @IsOptional()
    @IsNumber()
    @Transform((a: TransformFnParams) => (a.value === '' ? undefined : +a.value))
    mandato_id?: number;

    @ValidateIf((o) => !o.eleicao_id && !o.mandato_id)
    @IsNotEmpty({ message: 'Deve ser informado eleicao_id ou mandato_id' })
    _validation?: any;

    @ValidateIf((o) => o.eleicao_id && o.mandato_id)
    @IsEmpty({ message: 'Deve ser informado apenas eleicao_id OU mandato_id' })
    _validation2?: any;
}

export class EleicaoComparecimentoDto {
    eleicao_id: number;
    comparecimentos: {
        regiao_id: number;
        regiao_nome: string;
        nivel: DadosEleicaoNivel;
        valor: number;
        parlamentares_count: number;
    }[];
}

export class ComparecimentoConflictResponseDto {
    conflict_detected: true;
    comparecimento_existente: number;
    novo_comparecimento: number;
    parlamentares_afetados: number;
    message: string;
}
