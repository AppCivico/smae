import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FonteRelatorio } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsIn, IsObject, IsOptional } from 'class-validator';
import { StringArrayTransform } from '../../../auth/transforms/string-array.transform';
import { VISIBILIDADE_TIPOS, VisibilidadeTipo } from '../../relatorios/helpers/visibilidade-templates';

export class FilterRelatorioModeloDto {
    /**
     * Filtra os modelos de uma ou mais fontes (`?fonte=Projetos&fonte=ProjetoStatus`). Sem o filtro,
     * a listagem já vem restrita às fontes do sistema da requisição que o usuário pode executar.
     */
    @IsOptional()
    @Transform(StringArrayTransform)
    @IsArray()
    @ApiPropertyOptional({ enum: FonteRelatorio, enumName: 'FonteRelatorio', isArray: true })
    @IsEnum(FonteRelatorio, {
        each: true,
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte?: FonteRelatorio[];

    /** Filtra por escopo de visibilidade (`?visibilidade_tipo=publico&visibilidade_tipo=meu_orgao`). */
    @IsOptional()
    @Transform(StringArrayTransform)
    @IsArray()
    @ApiPropertyOptional({ enum: VISIBILIDADE_TIPOS, enumName: 'VisibilidadeTipo', isArray: true })
    @IsIn(VISIBILIDADE_TIPOS, {
        each: true,
        message: 'visibilidade_tipo precisa ser um dos seguintes valores: ' + VISIBILIDADE_TIPOS.join(', '),
    })
    visibilidade_tipo?: VisibilidadeTipo[];
}

export class FilterFontesRelatorioDto {
    /**
     * Restringe o resultado a algumas fontes (`?fonte=Obras&fonte=ObraStatus`) — útil para a tela
     * baixar as colunas só do que o usuário abriu, em vez do sistema inteiro. Sem o filtro, vêm
     * todas as fontes do sistema da requisição que o usuário pode executar.
     */
    @IsOptional()
    @Transform(StringArrayTransform)
    @IsArray()
    @ApiPropertyOptional({ enum: FonteRelatorio, enumName: 'FonteRelatorio', isArray: true })
    @IsEnum(FonteRelatorio, {
        each: true,
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte?: FonteRelatorio[];
}

export class FilterColunasRelatorioDto {
    /** Fonte cujas colunas declaradas serão listadas. */
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte: FonteRelatorio;
}

/**
 * Corpo de `POST /relatorio-modelo/colunas`: a fonte e os parâmetros com que o relatório será
 * executado. `parametros` é validado pelo `describeSchema` da própria fonte, então segue o
 * mesmo formato de `POST /relatorios`.
 */
export class ColunasParametrizadasDto {
    @ApiProperty({ enum: FonteRelatorio, enumName: 'FonteRelatorio' })
    @IsEnum(FonteRelatorio, {
        message: 'fonte precisa ser um dos seguintes valores: ' + Object.values(FonteRelatorio).join(', '),
    })
    fonte: FonteRelatorio;

    /**
     * Os mesmos parâmetros que irão para `POST /relatorios`. Omitido equivale a `{}` — o que,
     * para as fontes cujo schema depende de `pdm_id`/`tipo`, devolve a variante default e não
     * a que você vai rodar.
     */
    @IsOptional()
    @IsObject({ message: 'parametros precisa ser um objeto' })
    parametros?: Record<string, unknown>;
}

/**
 * Corpo de `POST /relatorio-modelo/:id/colunas`. A fonte não vem no corpo: ela é a do modelo,
 * que é imutável (ver `UpdateRelatorioModeloDto`).
 */
export class ColunasDoModeloDto {
    /**
     * Os mesmos parâmetros que irão para `POST /relatorios`. Omitido equivale a `{}` — o que,
     * para as fontes cujo schema depende de `pdm_id`/`tipo`, devolve a variante default e não
     * a que você vai rodar.
     */
    @IsOptional()
    @IsObject({ message: 'parametros precisa ser um objeto' })
    parametros?: Record<string, unknown>;
}
