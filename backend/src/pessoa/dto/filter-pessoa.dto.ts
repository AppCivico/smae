import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional } from 'class-validator';

export class FilterPessoaDto {
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
     * Filtrar pessoa com privilegio `SMAE.espectador_de_projeto` ?
     *
     *  true filtra quem tem a `SMAE.espectador_de_projeto`; false filtra quem não tem
     * @example ""
     */
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }: any) => value === 'true')
    espectador_de_painel_externo?: boolean;

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
}
