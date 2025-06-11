import { ModuloSistema, TipoPdm } from '@prisma/client';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsDateYMD } from '../../auth/decorators/date.decorator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';

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
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string | null;

    /**
     * Data de inicio
     */
    @IsDateYMD({ nullable: true })
    data_inicio?: string | null;

    /**
     * Data de fim
     */
    @IsDateYMD({ nullable: true })
    data_fim?: string | null;

    /**
     * Ativo
     */
    @IsBoolean()
    ativo: boolean;

    prefeito: string;
    @IsDateYMD({ nullable: true })
    data_publicacao: string | null;
    @IsDateYMD({ nullable: true })
    periodo_do_ciclo_participativo_inicio: string | null;
    @IsDateYMD({ nullable: true })
    periodo_do_ciclo_participativo_fim: string | null;

    @IsDateYMD({ nullable: true })
    considerar_atraso_apos: string | null;

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
    sistema: ModuloSistema;
}
