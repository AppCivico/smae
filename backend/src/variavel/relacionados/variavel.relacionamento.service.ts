import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TipoPdm } from 'src/generated/prisma/client';

import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { IdCodTituloDto } from '../../common/dto/IdCodTitulo.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterVariavelDto, FilterVariavelRelacionamentosDto } from '../dto/filter-variavel.dto';
import { GetVariavelWhereSet } from '../variavel.service';
import {
    PdmInfoDto,
    VarGlobalRelFormulaCompostaDto,
    VarGlobalRelIndicadorDto,
    VariavelGlobalRelacionamentoDto,
} from './dto/variavel.relacionamento.dto';

@Injectable()
export class VariavelRelacionamentoService {
    constructor(private readonly prisma: PrismaService) {}

    /**
     * Obtém os relacionamentos de uma variável específica, incluindo indicadores e fórmulas compostas que a referenciam
     */
    async getRelacionamentos(
        variavelId: number,
        user: PessoaFromJwt,
        filter?: FilterVariavelRelacionamentosDto
    ): Promise<VariavelGlobalRelacionamentoDto> {
        // Etapa 1: Usar sistema de permissões adequado para obter a variável
        const whereSet = GetVariavelWhereSet({ id: variavelId });

        const variavel = await this.prisma.variavel.findFirst({
            where: {
                AND: whereSet,
                id: variavelId,
            },
            select: {
                id: true,
                tipo: true,
                variavel_mae_id: true,
            },
        });

        if (!variavel) throw new NotFoundException('Variável não encontrada');
        if (variavel.tipo == 'PDM')
            throw new BadRequestException('Este endpoint é exclusivo para variáveis do Banco de Variáveis');

        // Etapa 2: Determinar qual variável usar para busca de relacionamentos
        let targetVariavelId = variavelId;
        let variavelMae: IdCodTituloDto | null = null;
        let variaveisFilhas: IdCodTituloDto[] = [];

        filter = filter || {};
        if (filter?.buscar_familia_completa === undefined) filter.buscar_familia_completa = true;

        // Se a variável é uma filha, buscar a mãe e suas filhas
        if (variavel.variavel_mae_id && filter?.buscar_familia_completa) {
            Logger.log(`Variável ${variavelId} é uma filha, buscando sua mãe e filhas...`);
            // Buscar a mãe da variável
            const parentFilters: FilterVariavelDto = { id: variavel.variavel_mae_id };
            const parentWhereSet = GetVariavelWhereSet(parentFilters);

            const parentVariavel = await this.prisma.variavel.findFirst({
                where: { AND: parentWhereSet },
                select: { id: true, codigo: true, titulo: true },
            });

            if (parentVariavel) {
                targetVariavelId = parentVariavel.id;
                variavelMae = parentVariavel;

                variaveisFilhas = await this.prisma.variavel.findMany({
                    where: {
                        variavel_mae_id: parentVariavel.id,
                        removido_em: null,
                    },
                    select: { id: true, codigo: true, titulo: true },
                    orderBy: { codigo: 'asc' },
                });
            }
        } else if (!variavel.variavel_mae_id && filter.buscar_familia_completa) {
            Logger.log(
                `Variável ${variavelId} não tem mãe, buscando suas filhas diretamente. Se necessário, a mãe será buscada mais adiante se houver filhas.`
            );
            // Se esta já é uma variável mãe, obter suas filhas - ORDENADO POR CÓDIGO
            variaveisFilhas = await this.prisma.variavel.findMany({
                where: {
                    variavel_mae_id: variavelId,
                    removido_em: null,
                },
                select: { id: true, codigo: true, titulo: true },
                orderBy: { codigo: 'asc' },
            });
        } else {
            // Busca por mãe está desabilitada, obter info da mãe se existir
            if (variavel.variavel_mae_id) {
                Logger.log(
                    `Variável ${variavelId} tem mãe, mas busca por mãe está desabilitada. Obtendo info da mãe...`
                );
                variavelMae = await this.prisma.variavel.findUnique({
                    where: { id: variavel.variavel_mae_id },
                    select: { id: true, codigo: true, titulo: true },
                });
            }
        }

        // Obter todos os IDs de variáveis para buscar (mãe + todas as filhas)
        const searchVariableIds: number[] = [targetVariavelId];
        if (variaveisFilhas.length > 0) {
            searchVariableIds.push(...variaveisFilhas.map((f) => f.id));
        }

        // Etapa 3: Obter indicadores que referenciam qualquer uma dessas variáveis
        // ordenar por código do indicador e depois por código da variável
        const indicadoresData = await this.prisma.$queryRaw<
            {
                indicador_id: number;
                indicador_codigo: string;
                indicador_titulo: string;
                indicador_tipo: string;
                variavel_id: number;
                variavel_codigo: string;
                variavel_titulo: string;
                meta_id: number | null;
                meta_codigo: string | null;
                meta_titulo: string | null;
                iniciativa_id: number | null;
                iniciativa_codigo: string | null;
                iniciativa_titulo: string | null;
                atividade_id: number | null;
                atividade_codigo: string | null;
                atividade_titulo: string | null;
                pdm_id: number | null;
                pdm_nome: string | null;
            }[]
        >`
            SELECT DISTINCT
                i.id as indicador_id,
                i.codigo as indicador_codigo,
                i.titulo as indicador_titulo,
                i.indicador_tipo::text as indicador_tipo,
                var.id as variavel_id,
                var.codigo as variavel_codigo,
                var.titulo as variavel_titulo,
                v.meta_id,
                m.codigo as meta_codigo,
                m.titulo as meta_titulo,
                v.iniciativa_id,
                ini.codigo as iniciativa_codigo,
                ini.titulo as iniciativa_titulo,
                v.atividade_id,
                a.codigo as atividade_codigo,
                a.titulo as atividade_titulo,
                v.pdm_id,
                p.nome as pdm_nome
            FROM indicador_variavel iv
            JOIN variavel var ON var.id = iv.variavel_id AND var.removido_em IS NULL
            JOIN indicador i ON i.id = iv.indicador_id AND i.removido_em IS NULL
            LEFT JOIN view_metas_arvore_pdm v ON (
                (i.meta_id IS NOT NULL AND v.meta_id = i.meta_id) OR
                (i.iniciativa_id IS NOT NULL AND v.iniciativa_id = i.iniciativa_id) OR
                (i.atividade_id IS NOT NULL AND v.atividade_id = i.atividade_id)
            )
            LEFT JOIN meta m ON m.id = v.meta_id AND m.removido_em IS NULL
            LEFT JOIN iniciativa ini ON ini.id = v.iniciativa_id AND ini.removido_em IS NULL
            LEFT JOIN atividade a ON a.id = v.atividade_id AND a.removido_em IS NULL
            LEFT JOIN pdm p ON p.id = v.pdm_id AND p.removido_em IS NULL
            WHERE iv.variavel_id = ANY(${searchVariableIds}::int[])
            ORDER BY i.codigo, var.codigo
        `;

        // Etapa 4: Obter fórmulas compostas que referenciam qualquer uma dessas variáveis
        // ordenar por título da fórmula e depois por código da variável
        const formulasData = await this.prisma.$queryRaw<
            {
                formula_id: number;
                formula_titulo: string;
                formula_tipo_pdm: string;
                formula_autogerenciavel: boolean;
                variavel_id: number;
                variavel_codigo: string;
                variavel_titulo: string;
                pdm_id: number | null;
                pdm_nome: string | null;
            }[]
        >`
            SELECT DISTINCT
                fc.id as formula_id,
                fc.titulo as formula_titulo,
                fc.tipo_pdm::text as formula_tipo_pdm,
                fc.autogerenciavel as formula_autogerenciavel,
                var.id as variavel_id,
                var.codigo as variavel_codigo,
                var.titulo as variavel_titulo,
                v.pdm_id,
                p.nome as pdm_nome
            FROM formula_composta_rel_variavel fcrv
            JOIN variavel var ON var.id = fcrv.variavel_id AND var.removido_em IS NULL
            JOIN formula_composta fc ON fc.id = fcrv.formula_composta_id
                AND fc.removido_em IS NULL
                AND fc.autogerenciavel = false
            LEFT JOIN (
                -- Obter informações do PDM para fórmulas através de suas variáveis/indicadores relacionados
                SELECT DISTINCT fc2.id as fc_id, vma.pdm_id
                FROM formula_composta fc2
                JOIN formula_composta_rel_variavel fcrv2 ON fcrv2.formula_composta_id = fc2.id
                JOIN indicador_variavel iv2 ON iv2.variavel_id = fcrv2.variavel_id
                JOIN indicador i2 ON i2.id = iv2.indicador_id AND i2.removido_em IS NULL
                JOIN view_metas_arvore_pdm vma ON (
                    (i2.meta_id IS NOT NULL AND vma.meta_id = i2.meta_id) OR
                    (i2.iniciativa_id IS NOT NULL AND vma.iniciativa_id = i2.iniciativa_id) OR
                    (i2.atividade_id IS NOT NULL AND vma.atividade_id = i2.atividade_id)
                )
                WHERE fc2.tipo_pdm = 'PDM'
            ) v ON v.fc_id = fc.id
            LEFT JOIN pdm p ON p.id = v.pdm_id AND p.removido_em IS NULL
            WHERE fcrv.variavel_id = ANY(${searchVariableIds}::int[])
            ORDER BY fc.titulo, var.codigo
        `;

        // Etapa 5: Mapear resultados para DTOs
        const indicadoresReferenciando = indicadoresData.map(
            (ind): VarGlobalRelIndicadorDto => ({
                id: ind.indicador_id,
                codigo: ind.indicador_codigo,
                titulo: ind.indicador_titulo,
                tipo_indicador: ind.indicador_tipo as any,
                pdm_id: ind.pdm_id,
                variavel: {
                    id: ind.variavel_id,
                    codigo: ind.variavel_codigo,
                    titulo: ind.variavel_titulo,
                },
                meta: ind.meta_id
                    ? {
                          id: ind.meta_id,
                          codigo: ind.meta_codigo!,
                          titulo: ind.meta_titulo!,
                      }
                    : null,
                iniciativa: ind.iniciativa_id
                    ? {
                          id: ind.iniciativa_id,
                          codigo: ind.iniciativa_codigo!,
                          titulo: ind.iniciativa_titulo!,
                      }
                    : null,
                atividade: ind.atividade_id
                    ? {
                          id: ind.atividade_id,
                          codigo: ind.atividade_codigo!,
                          titulo: ind.atividade_titulo!,
                      }
                    : null,
            })
        );

        const formulasCompostasReferenciando = formulasData.map(
            (fc): VarGlobalRelFormulaCompostaDto => ({
                id: fc.formula_id,
                titulo: fc.formula_titulo,
                tipo_pdm: fc.formula_tipo_pdm as TipoPdm,
                autogerenciavel: fc.formula_autogerenciavel,
                pdm_id: fc.pdm_id,
                variavel: {
                    id: fc.variavel_id,
                    codigo: fc.variavel_codigo,
                    titulo: fc.variavel_titulo,
                },
            })
        );

        // Obter informações dos PDMs
        const pdmDbRows = await this.prisma.pdm.findMany({
            where: {
                id: {
                    in: Array.from(
                        new Set([
                            ...indicadoresReferenciando
                                .map((ind) => ind.pdm_id)
                                .filter((id): id is number => id !== undefined),
                            ...formulasCompostasReferenciando
                                .map((fc) => fc.pdm_id)
                                .filter((id): id is number => id !== undefined),
                        ])
                    ),
                },
            },
            orderBy: { nome: 'asc' },
        });

        const pdmFormatado = pdmDbRows.map(
            (pdm) =>
                ({
                    id: pdm.id,
                    nome: pdm.nome,
                    tipo: pdm.tipo,
                    rotulo_macro_tema: pdm.rotulo_macro_tema,
                    rotulo_tema: pdm.rotulo_tema,
                    rotulo_sub_tema: pdm.rotulo_sub_tema,
                    rotulo_contexto_meta: pdm.rotulo_contexto_meta,
                    rotulo_complementacao_meta: pdm.rotulo_complementacao_meta,
                    rotulo_iniciativa: pdm.rotulo_iniciativa,
                    rotulo_atividade: pdm.rotulo_atividade,
                }) satisfies PdmInfoDto
        );

        return {
            variavel_mae: variavelMae,
            variaveis_filhas: variaveisFilhas,
            indicadores_referenciando: indicadoresReferenciando,
            formulas_compostas_referenciando: formulasCompostasReferenciando,
            pdm_info: pdmFormatado,
            variaveis_busca: searchVariableIds,
        };
    }
}
