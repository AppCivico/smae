import { TipoPdm } from '@prisma/client';
import { IsBoolean, IsISO8601, IsOptional, IsString, Length, MaxLength, MinLength } from 'class-validator';

export class ListPdm {
    /**
     * Nome
     */
    @IsString({ message: '$property| Nome: Precisa ser alfanumérico' })
    @MinLength(1, { message: '$property| nome: Mínimo de 1 caractere' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    /**
     * Descrição
     */
    @IsOptional()
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| descrição: Máximo 250 caracteres' })
    descricao?: string | null;

    /**
     * Data de inicio
     */
    @IsISO8601({ strict: true }, { message: '$property| data_inicio: Precisa ser uma data' })
    @Length(10, 10)
    data_inicio?: string | null;

    /**
     * Data de fim
     */
    @IsISO8601({ strict: true }, { message: '$property| data_fim: Precisa ser uma data' })
    @Length(10, 10)
    data_fim?: string | null;

    /**
     * Ativo
     */
    @IsBoolean()
    ativo: boolean;

    prefeito: string;
    data_publicacao: string | null;
    periodo_do_ciclo_participativo_inicio: string | null;
    periodo_do_ciclo_participativo_fim: string | null;

    rotulo_macro_tema: string;
    rotulo_tema: string;
    rotulo_sub_tema: string;
    rotulo_contexto_meta: string;
    rotulo_complementacao_meta: string;
    rotulo_iniciativa: string;
    rotulo_atividade: string;
    possui_macro_tema: boolean;
    possui_tema: boolean;
    possui_sub_tema: boolean;
    possui_contexto_meta: boolean;
    possui_complementacao_meta: boolean;
    possui_iniciativa: boolean;
    possui_atividade: boolean;
    logo: string | null;

    nivel_orcamento: string | null;

    id: number;
    pode_editar: boolean;

    tipo: TipoPdm;
}
