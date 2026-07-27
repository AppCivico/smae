import { HttpException, Injectable } from '@nestjs/common';
import { FonteRelatorio, ModuloSistema, Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RelatorioModeloArquivoDto, RelatorioModeloConfigDto } from '../post-process/dto/relatorio-modelo.dto';
import { compilarFiltros } from '../post-process/filtro-compiler';
import {
    findReportRowClassesByFonte,
    getReportRowColumns,
    getReportRowsOptions,
} from '../post-process/report-column.decorator';
import { ReportColumnDef } from '../post-process/report-schema';
import { getVisibilidadeLabel, VisibilidadeTipo } from '../relatorios/helpers/visibilidade-templates';
import { CreateRelatorioModeloDto } from './dto/create-relatorio-modelo.dto';
import { FilterRelatorioModeloDto } from './dto/filter-relatorio-modelo.dto';
import { UpdateRelatorioModeloDto } from './dto/update-relatorio-modelo.dto';
import {
    ListRelatorioColunasDto,
    RelatorioArquivoColunasDto,
    RelatorioModeloDetailDto,
    RelatorioModeloItemDto,
} from './entities/relatorio-modelo.entity';
import {
    fonteEhDoSistema,
    fontesPermitidas,
    hasReportPriv,
    modeloVisibilidadeWhere,
} from '../helpers/report-priv.helper';

/** Schema de um arquivo da fonte, já achatado a partir dos decoradores. */
type ArquivoDaFonte = {
    arquivo: string;
    descricao: string | null;
    colunas: ReportColumnDef[];
    /** Colunas que não podem ser removidas nem renomeadas (`customizavel: false`). */
    travadas: Set<string>;
    /** Nota explicativa de cada coluna, quando declarada. */
    descricoes: Map<string, string | null>;
};

const SELECT_MODELO = {
    id: true,
    nome: true,
    descricao: true,
    fonte: true,
    sistema: true,
    visibilidade_tipo: true,
    orgao_id: true,
    criado_em: true,
    criado_por: true,
    criador: { select: { nome_exibicao: true } },
} satisfies Prisma.RelatorioModeloSelect;

type RowModelo = Prisma.RelatorioModeloGetPayload<{ select: typeof SELECT_MODELO }>;

/**
 * Amostra dos nomes válidos para a mensagem de erro. Alguns arquivos passam de 60 colunas — a lista
 * inteira transformaria o 400 num despejo ilegível, então truncamos e apontamos para o endpoint de
 * descoberta, que é a lista completa e autoritativa.
 */
function amostraDeNomes(nomes: string[], limite = 15): string {
    if (nomes.length <= limite) return nomes.join(', ');
    return (
        nomes.slice(0, limite).join(', ') +
        ` e mais ${nomes.length - limite} (lista completa em GET /relatorio-modelo/colunas)`
    );
}

@Injectable()
export class RelatorioModeloService {
    constructor(private readonly prisma: PrismaService) {}

    async create(dto: CreateRelatorioModeloDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('criar', 'Modelos de relatório');
        this.assertPodeEscrever(dto.fonte, sistema, user);
        this.validaConfig(dto.fonte, dto.config);

        const visibilidadeTipo: VisibilidadeTipo = dto.visibilidade_tipo ?? 'privado';
        if (visibilidadeTipo === 'meu_orgao' && !user.orgao_id)
            throw new HttpException('Usuário sem órgão associado não pode criar modelo restrito ao órgão.', 400);

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                await this.assertNomeDisponivel(prismaTx, dto.nome, dto.fonte, null);

                const criado = await prismaTx.relatorioModelo
                    .create({
                        data: {
                            nome: dto.nome,
                            descricao: dto.descricao ?? null,
                            fonte: dto.fonte,
                            sistema: sistema,
                            config: dto.config as unknown as Prisma.InputJsonObject,
                            visibilidade_tipo: visibilidadeTipo,
                            // Órgão do criador no momento da criação — é o que o escopo 'meu_orgao' compara.
                            orgao_id: user.orgao_id ?? null,
                            criado_por: user.id,
                            criado_em: new Date(Date.now()),
                        },
                        select: { id: true },
                    })
                    .catch((e) => this.traduzNomeDuplicado(e, dto.nome, dto.fonte));

                return { id: criado.id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async update(id: number, dto: UpdateRelatorioModeloDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const sistema = user.assertOneModuloSistema('editar', 'Modelos de relatório');

        const modelo = await this.prisma.relatorioModelo.findFirst({
            where: { id, removido_em: null },
            select: { id: true, fonte: true, nome: true, criado_por: true },
        });
        if (!modelo) throw new HttpException('Modelo de relatório não encontrado', 404);

        this.assertPodeEscrever(modelo.fonte, sistema, user);
        if (!this.podeEditar(modelo.criado_por, modelo.fonte, sistema, user))
            throw new HttpException('Somente o criador do modelo pode alterá-lo.', 403);

        // A config é validada contra o schema da fonte persistida — a fonte é imutável (ver
        // UpdateRelatorioModeloDto), então não há como o modelo passar a apontar para outro schema.
        if (dto.config !== undefined) this.validaConfig(modelo.fonte, dto.config);

        if (dto.visibilidade_tipo === 'meu_orgao' && !user.orgao_id)
            throw new HttpException('Usuário sem órgão associado não pode tornar o modelo restrito ao órgão.', 400);

        return await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                if (dto.nome !== undefined && dto.nome !== modelo.nome)
                    await this.assertNomeDisponivel(prismaTx, dto.nome, modelo.fonte, id);

                // UncheckedUpdateManyInput para poder escrever os escalares de FK (atualizado_por/orgao_id).
                const data: Prisma.RelatorioModeloUncheckedUpdateManyInput = {
                    atualizado_por: user.id,
                    atualizado_em: new Date(Date.now()),
                };

                if (dto.nome !== undefined) data.nome = dto.nome;
                if (dto.descricao !== undefined) data.descricao = dto.descricao;
                if (dto.config !== undefined) data.config = dto.config as unknown as Prisma.InputJsonObject;
                if (dto.visibilidade_tipo !== undefined) {
                    data.visibilidade_tipo = dto.visibilidade_tipo;
                    // Ao passar para 'meu_orgao', o escopo é o órgão de quem editou.
                    if (dto.visibilidade_tipo === 'meu_orgao') data.orgao_id = user.orgao_id ?? null;
                }

                // `removido_em: null` também no write: a checagem de existência acima roda fora da
                // transação, e um `remove()` concorrente no intervalo deixaria o modelo removido
                // *e* atualizado. Sem a linha, o P2025 vira 404 em vez de escrita silenciosa.
                const atualizados = await prismaTx.relatorioModelo
                    .updateMany({ where: { id, removido_em: null }, data })
                    .catch((e) => this.traduzNomeDuplicado(e, dto.nome ?? modelo.nome, modelo.fonte));
                if (atualizados.count === 0) throw new HttpException('Modelo de relatório não encontrado', 404);

                return { id };
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    async findAll(filters: FilterRelatorioModeloDto, user: PessoaFromJwt): Promise<RelatorioModeloItemDto[]> {
        const sistema = user.assertOneModuloSistema('buscar', 'Modelos de relatório');

        const rows = await this.prisma.relatorioModelo.findMany({
            where: {
                removido_em: null,
                fonte: this.filtroDeFonte(filters.fonte, user, sistema),
                OR: modeloVisibilidadeWhere(user),
            },
            select: SELECT_MODELO,
            orderBy: [{ nome: 'asc' }],
        });

        return rows.map((r) => this.renderItem(r, sistema, user));
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<RelatorioModeloDetailDto> {
        const sistema = user.assertOneModuloSistema('buscar', 'Modelos de relatório');

        const row = await this.prisma.relatorioModelo.findFirst({
            where: {
                id,
                removido_em: null,
                fonte: this.filtroDeFonte(undefined, user, sistema),
                OR: modeloVisibilidadeWhere(user),
            },
            select: { ...SELECT_MODELO, config: true },
        });
        if (!row) throw new HttpException('Modelo de relatório não encontrado', 404);

        return {
            ...this.renderItem(row, sistema, user),
            config: row.config as unknown as RelatorioModeloConfigDto,
        };
    }

    async remove(id: number, user: PessoaFromJwt): Promise<void> {
        const sistema = user.assertOneModuloSistema('remover', 'Modelos de relatório');

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                const modelo = await prismaTx.relatorioModelo.findFirst({
                    where: { id, removido_em: null },
                    select: { id: true, fonte: true, criado_por: true },
                });
                if (!modelo) throw new HttpException('Modelo de relatório não encontrado', 404);

                if (!fonteEhDoSistema(modelo.fonte, sistema))
                    throw new HttpException(`Fonte ${modelo.fonte} não pertence ao sistema ${sistema}.`, 400);

                if (!this.podeEditar(modelo.criado_por, modelo.fonte, sistema, user))
                    throw new HttpException('Usuário não tem permissão para remover este modelo.', 403);

                await prismaTx.relatorioModelo.update({
                    where: { id },
                    data: { removido_em: new Date(Date.now()), removido_por: user.id },
                });
            },
            { isolationLevel: 'ReadCommitted' }
        );
    }

    /**
     * Colunas disponíveis para montar um modelo — a origem é apenas o registro de decoradores
     * (`@ReportRows`/`@ReportColumn`), nunca o banco. É o endpoint que o frontend usa para
     * construir o seletor de colunas.
     */
    listColunas(fonte: FonteRelatorio, user: PessoaFromJwt): ListRelatorioColunasDto {
        const sistema = user.assertOneModuloSistema('buscar', 'Modelos de relatório');
        this.assertPodeEscrever(fonte, sistema, user);

        const arquivos: RelatorioArquivoColunasDto[] = this.arquivosDaFonte(fonte).map((a) => ({
            arquivo: a.arquivo,
            descricao: a.descricao,
            colunas: a.colunas.map((c) => ({
                name: c.name,
                label: c.label,
                type: c.type,
                customizavel: !a.travadas.has(c.name),
                descricao: a.descricoes.get(c.name) ?? null,
                format: c.format ?? null,
            })),
        }));

        return { fonte, arquivos };
    }

    // ---------------------------------------------------------------------------------------
    // Privilégios e visibilidade
    // ---------------------------------------------------------------------------------------

    /**
     * Um modelo só pode ser lido/escrito por quem pode executar a fonte no sistema da requisição.
     * Aceita tanto o privilégio amplo (`Reports.executar.CasaCivil`) quanto o escopado por fonte
     * (`Reports.executar.CasaCivil:Transferencias`).
     */
    private assertPodeEscrever(fonte: FonteRelatorio, sistema: ModuloSistema, user: PessoaFromJwt): void {
        if (!fonteEhDoSistema(fonte, sistema))
            throw new HttpException(`Fonte ${fonte} não pertence ao sistema ${sistema}.`, 400);

        if (!hasReportPriv(user, 'executar', sistema, fonte))
            throw new HttpException('Usuário não tem permissão para gerenciar modelos desta fonte.', 403);
    }

    /**
     * Editar/remover: o criador sempre pode; quem tem o privilégio de remoção da fonte
     * (`Reports.remover.{sistema}`, amplo ou escopado) também, para poder faxinar modelos
     * compartilhados de pessoas que saíram.
     */
    private podeEditar(criadoPor: number, fonte: FonteRelatorio, sistema: ModuloSistema, user: PessoaFromJwt): boolean {
        return criadoPor === user.id || hasReportPriv(user, 'remover', sistema, fonte);
    }

    /** Restringe a listagem às fontes do sistema que o usuário pode executar. */
    private filtroDeFonte(
        fonte: FonteRelatorio | undefined,
        user: PessoaFromJwt,
        sistema: ModuloSistema
    ): Prisma.RelatorioModeloWhereInput['fonte'] {
        const permitidas = fontesPermitidas(user, sistema);
        if (fonte) return permitidas.includes(fonte) ? fonte : { in: [] };
        return { in: permitidas };
    }

    private renderItem(row: RowModelo, sistema: ModuloSistema, user: PessoaFromJwt): RelatorioModeloItemDto {
        const visTipo = (row.visibilidade_tipo as VisibilidadeTipo | null) ?? null;
        const podeEditar = this.podeEditar(row.criado_por, row.fonte, sistema, user);

        return {
            id: row.id,
            nome: row.nome,
            descricao: row.descricao,
            fonte: row.fonte,
            sistema: row.sistema,
            visibilidade_tipo: visTipo,
            visibilidade_tipo_label: getVisibilidadeLabel(visTipo),
            criado_em: row.criado_em,
            criador: { nome_exibicao: row.criador?.nome_exibicao ?? '(sistema)' },
            pode_editar: podeEditar,
            pode_remover: podeEditar,
        };
    }

    /**
     * Converte a violação do índice único parcial em 400 legível.
     *
     * `assertNomeDisponivel` é check-then-write: dois pedidos simultâneos com o mesmo nome veem o
     * nome livre e o segundo bate na constraint. Sem esta tradução o P2002 sobe como 500, perdendo
     * justamente a mensagem que a pré-checagem existe para dar.
     */
    private traduzNomeDuplicado(e: unknown, nome: string, fonte: FonteRelatorio): never {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')
            throw new HttpException(`Já existe um modelo com o nome "${nome}" para a fonte ${fonte}.`, 400);
        throw e;
    }

    private async assertNomeDisponivel(
        prismaTx: Prisma.TransactionClient,
        nome: string,
        fonte: FonteRelatorio,
        ignorarId: number | null
    ): Promise<void> {
        // Espelha o índice único parcial `relatorio_modelo_nome_fonte_unico` (criado na migration),
        // só para devolver 400 com mensagem legível em vez do erro de constraint.
        const existe = await prismaTx.relatorioModelo.findFirst({
            where: {
                nome,
                fonte,
                removido_em: null,
                ...(ignorarId ? { id: { not: ignorarId } } : {}),
            },
            select: { id: true },
        });
        if (existe) throw new HttpException(`Já existe um modelo com o nome "${nome}" para a fonte ${fonte}.`, 400);
    }

    // ---------------------------------------------------------------------------------------
    // Validação da config contra o schema declarado
    // ---------------------------------------------------------------------------------------

    /** Achata os decoradores das classes de linha registradas para a fonte. */
    private arquivosDaFonte(fonte: FonteRelatorio): ArquivoDaFonte[] {
        const out: ArquivoDaFonte[] = [];

        for (const cls of findReportRowClassesByFonte(fonte)) {
            const opts = getReportRowsOptions(cls);
            if (!opts) continue;
            if (out.some((a) => a.arquivo === opts.arquivo)) continue;

            const colunas = getReportRowColumns(cls);

            out.push({
                arquivo: opts.arquivo,
                descricao: opts.descricao ?? null,
                colunas: colunas.map(({ propriedade, options }) => ({
                    name: propriedade,
                    type: options.type,
                    label: options.label,
                    format: options.format,
                })),
                travadas: new Set(
                    colunas.filter(({ options }) => options.customizavel === false).map((c) => c.propriedade)
                ),
                descricoes: new Map(
                    colunas.map(({ propriedade, options }) => [propriedade, options.descricao ?? null])
                ),
            });
        }

        return out;
    }

    /**
     * Valida a config contra o schema declarado da fonte. Toda coluna referenciada (seleção,
     * filtro ou ordenação) precisa existir no arquivo correspondente, e as colunas marcadas
     * `customizavel: false` não podem ser renomeadas nem ficar fora da seleção.
     */
    private validaConfig(fonte: FonteRelatorio, config: RelatorioModeloConfigDto): void {
        const disponiveis = this.arquivosDaFonte(fonte);
        if (!disponiveis.length)
            throw new HttpException(
                `A fonte ${fonte} ainda não declara colunas customizáveis, então não aceita modelos.`,
                400
            );

        if (!config.arquivos?.length) throw new HttpException('Informe ao menos um arquivo em config.arquivos.', 400);

        const vistos = new Set<string>();
        for (const cfg of config.arquivos) {
            if (vistos.has(cfg.arquivo))
                throw new HttpException(`O arquivo "${cfg.arquivo}" aparece mais de uma vez em config.arquivos.`, 400);
            vistos.add(cfg.arquivo);

            const schema = disponiveis.find((a) => a.arquivo === cfg.arquivo);
            if (!schema)
                throw new HttpException(
                    `O arquivo "${cfg.arquivo}" não é produzido pela fonte ${fonte}. ` +
                        `Arquivos válidos: ${disponiveis.map((a) => a.arquivo).join(', ')}.`,
                    400
                );

            this.validaArquivo(cfg, schema);
        }
    }

    private validaArquivo(cfg: RelatorioModeloArquivoDto, schema: ArquivoDaFonte): void {
        const porNome = new Map(schema.colunas.map((c) => [c.name, c]));

        const exigeColuna = (nome: string, onde: string): ReportColumnDef => {
            const def = porNome.get(nome);
            if (!def)
                throw new HttpException(
                    `A coluna "${nome}" (em ${onde}) não existe no arquivo "${schema.arquivo}". ` +
                        `Colunas válidas: ${amostraDeNomes(schema.colunas.map((c) => c.name))}.`,
                    400
                );
            return def;
        };

        if (cfg.colunas?.length) {
            const selecionadas = new Set<string>();

            for (const sel of cfg.colunas) {
                const def = exigeColuna(sel.coluna, 'colunas');

                if (selecionadas.has(sel.coluna))
                    throw new HttpException(
                        `A coluna "${sel.coluna}" aparece mais de uma vez na seleção do arquivo "${schema.arquivo}".`,
                        400
                    );
                selecionadas.add(sel.coluna);

                if (schema.travadas.has(sel.coluna) && sel.label !== undefined && sel.label !== def.label)
                    throw new HttpException(
                        `A coluna "${sel.coluna}" do arquivo "${schema.arquivo}" não pode ser renomeada.`,
                        400
                    );
            }

            // Seleção explícita = as ausentes serão removidas da saída; as travadas precisam ficar.
            for (const travada of schema.travadas) {
                if (!selecionadas.has(travada))
                    throw new HttpException(
                        `A coluna "${travada}" do arquivo "${schema.arquivo}" é obrigatória e não pode ser ` +
                            `removida do modelo.`,
                        400
                    );
            }
        }

        for (const f of cfg.filtros ?? []) exigeColuna(f.coluna, 'filtros');
        for (const o of cfg.order_by ?? []) exigeColuna(o.coluna, 'order_by');

        // Reaproveita o compilador do pós-processamento para validar operador × tipo × valor
        // (ex.: `in` com lista vazia, data fora do formato ISO). O SQL gerado é descartado —
        // o objetivo é falhar na criação do modelo, não na hora de rodar o relatório.
        compilarFiltros(cfg.filtros ?? [], schema.colunas);
    }
}
