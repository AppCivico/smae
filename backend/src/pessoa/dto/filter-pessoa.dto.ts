import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional } from 'class-validator';
import { ListaDePrivilegios } from '../../common/ListaDePrivilegios';

export const FilterPermsPessoa2Priv: Record<keyof FilterPermsPessoaDto, ListaDePrivilegios> = {
    coordenador_responsavel_cp: 'PDM.coordenador_responsavel_cp',
    gestor_de_projeto: 'SMAE.gestor_de_projeto',
    colaborador_de_projeto: 'SMAE.colaborador_de_projeto',
    espectador_de_painel_externo: 'SMAE.espectador_de_painel_externo',
    espectador_de_projeto: 'SMAE.espectador_de_projeto',
    mdo_gestor_de_projeto: 'MDO.gestor_de_projeto',
    mdo_colaborador_de_projeto: 'MDO.colaborador_de_projeto',
    mdo_espectador_de_projeto: 'MDO.espectador_de_projeto',
    colaborador_grupo_variavel: 'SMAE.GrupoVariavel.colaborador',
    participante_grupo_variavel: 'SMAE.GrupoVariavel.participante',
    gerente_de_projeto: 'SMAE.gerente_de_projeto',
} as const;

export class FilterPermsPessoaDto {
    /**
     * Filtrar pessoa com privilegio `SMAE.GrupoVariavel.colaborador` ?
     *
     *  true filtra quem tem a `SMAE.GrupoVariavel.colaborador`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    colaborador_grupo_variavel?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.GrupoVariavel.participante` ?
     *
     *  true filtra quem tem a `SMAE.GrupoVariavel.participante`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    participante_grupo_variavel?: boolean;

    /**
     * Filtrar pessoa com privilegio `PDM.coordenador_responsavel_cp` ?
     *
     *  true filtra quem tem a `PDM.coordenador_responsavel_cp`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    coordenador_responsavel_cp?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.espectador_de_painel_externo` ?
     *
     *  true filtra quem tem a `SMAE.espectador_de_painel_externo`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    espectador_de_painel_externo?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.gestor_de_projeto` ?
     *
     *  true filtra quem tem a `SMAE.gestor_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    gestor_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.colaborador_de_projeto` ?
     *
     *  true filtra quem tem a `SMAE.colaborador_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    colaborador_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.espectador_de_projeto` ?
     *
     *  true filtra quem tem a `SMAE.espectador_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    espectador_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `MDO.gestor_de_projeto` ?
     *
     *  true filtra quem tem a `MDO.gestor_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    mdo_gestor_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `MDO.colaborador_de_projeto` ?
     *
     *  true filtra quem tem a `MDO.colaborador_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    mdo_colaborador_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `MDO.espectador_de_projeto` ?
     *
     *  true filtra quem tem a `MDO.espectador_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    mdo_espectador_de_projeto?: boolean;

    /**
     * Filtrar pessoa com privilegio `SMAE.gerente_de_projeto` ?
     *
     *  true filtra quem tem a `SMAE.gerente_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    gerente_de_projeto?: boolean;
}

export class FilterPessoaDto extends FilterPermsPessoaDto {
    /**
     * Filtrar por órgão?
     *
     * @example "1"
     */
    @IsOptional()
    @IsInt({ message: '$property| orgao_id' })
    @Type(() => Number)
    orgao_id?: number;

    @IsOptional()
    @IsEmail()
    email?: string;
}
