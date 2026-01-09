import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PosicaoLogotipo, Prisma, TipoProjeto } from '@prisma/client';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { ProjetoStatusParaExibicao } from '../projeto/projeto.service';
import { UpsertTermoEncerramentoDto } from './dto/termo-encerramento.dto';
import { TermoEncerramentoDetalheDto, TermoEncerramentoIconeDto } from './dto/termo-encerramento.entity';

// Tipo auxiliar para o snapshot calculado
type SnapshotCalculado = Omit<
    TermoEncerramentoDetalheDto,
    'id' | 'projeto_id' | 'em_rascunho' | 'pode_excluir' | 'icone' | 'justificativa'
> & {
    icone_arquivo_id: number | null;
};

@Injectable()
export class TermoEncerramentoService {
    private readonly logger = new Logger(TermoEncerramentoService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    /**
     * Busca a versão ativa (rascunho) ou calcula os valores padrão baseados no projeto atual.
     */
    async buscarOuCalcular(
        tipo: TipoProjeto,
        projeto_id: number,
        user: PessoaFromJwt,
        pode_escrever: boolean
    ): Promise<TermoEncerramentoDetalheDto> {
        // 1. Tenta buscar rascunho ativo
        const termoExistente = await this.prisma.projetoTermoEncerramento.findFirst({
            where: {
                projeto_id: projeto_id,
                projeto: { tipo: tipo },
                ultima_versao: true,
                removido_em: null,
            },
            include: {
                icone: { select: { id: true } },
                justificativa: { select: { id: true, descricao: true, habilitar_info_adicional: true } },
            },
        });

        if (termoExistente) {
            // Monta o DTO de retorno com os dados do banco
            const iconeDto = this.montarIconeDto(termoExistente.icone);

            return {
                id: termoExistente.id,
                projeto_id: termoExistente.projeto_id,
                em_rascunho: true,
                pode_excluir: pode_escrever,

                nome_projeto: termoExistente.nome_projeto,
                orgao_responsavel_nome: termoExistente.orgao_responsavel_nome,
                portfolios_nomes: termoExistente.portfolios_nomes,
                objeto: termoExistente.objeto,
                status_final: termoExistente.status_final,
                etapa_nome: termoExistente.etapa_nome,

                previsao_inicio: termoExistente.previsao_inicio,
                previsao_termino: termoExistente.previsao_termino,
                data_inicio_real: termoExistente.data_inicio_real,
                data_termino_real: termoExistente.data_termino_real,
                previsao_custo: termoExistente.previsao_custo,
                valor_executado_total: termoExistente.valor_executado_total,

                justificativa_id: termoExistente.justificativa_id,
                justificativa_complemento: termoExistente.justificativa_complemento,
                responsavel_encerramento_nome: termoExistente.responsavel_encerramento_nome,
                data_encerramento: termoExistente.data_encerramento,
                assinatura: termoExistente.assinatura,
                posicao_logotipo: termoExistente.posicao_logotipo,

                icone: iconeDto,
                justificativa: termoExistente.justificativa,
            };
        }

        // 2. Se não existir rascunho, calcula valores padrão do Projeto
        const snapshot = await this.calcularSnapshotPeloProjeto(projeto_id);
        const iconeDto = snapshot.icone_arquivo_id ? await this.buscarIconeDto(snapshot.icone_arquivo_id) : null;

        return {
            id: null,
            projeto_id: projeto_id,
            em_rascunho: false,
            pode_excluir: false,

            nome_projeto: snapshot.nome_projeto,
            orgao_responsavel_nome: snapshot.orgao_responsavel_nome,
            portfolios_nomes: snapshot.portfolios_nomes,
            objeto: snapshot.objeto,
            status_final: snapshot.status_final,
            etapa_nome: snapshot.etapa_nome,

            previsao_inicio: snapshot.previsao_inicio,
            previsao_termino: snapshot.previsao_termino,
            data_inicio_real: snapshot.data_inicio_real,
            data_termino_real: snapshot.data_termino_real,
            previsao_custo: snapshot.previsao_custo,
            valor_executado_total: snapshot.valor_executado_total,

            justificativa_id: null,
            justificativa_complemento: null,
            responsavel_encerramento_nome: user.nome_exibicao,
            data_encerramento: new Date(),
            assinatura: null,
            posicao_logotipo: 'Esquerda',

            icone: iconeDto,
            justificativa: null,
        };
    }

    /**
     * Salva ou atualiza o termo de encerramento.
     * Usa estratégia de "Archive & Insert" para manter histórico imutável.
     */
    async upsert(
        tipo: TipoProjeto,
        projeto_id: number,
        dto: UpsertTermoEncerramentoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const now = new Date();

        return await this.prisma.$transaction(async (prismaTx) => {
            // Busca snapshot atual do projeto (para campos de texto/snapshot)
            const snapshotAtual = await this.calcularSnapshotPeloProjeto(projeto_id, prismaTx);

            // Busca versão anterior ativa
            const versaoAnterior = await prismaTx.projetoTermoEncerramento.findFirst({
                where: {
                    projeto_id: projeto_id,
                    ultima_versao: true,
                    removido_em: null,
                },
            });

            // Se não há versão anterior, usa o ícone do snapshot (que pode vir do portfolio)
            const iconeBaseId = versaoAnterior?.icone_arquivo_id ?? snapshotAtual.icone_arquivo_id;
            const iconeArquivoId = this.processarIcone(dto, iconeBaseId);

            // Valida justificativa e complemento
            await this.validarJustificativa(dto, versaoAnterior?.justificativa_complemento ?? null, prismaTx);

            // Monta os dados base (da versão anterior ou defaults calculados)
            const baseDados = versaoAnterior
                ? {
                      previsao_inicio: versaoAnterior.previsao_inicio,
                      previsao_termino: versaoAnterior.previsao_termino,
                      data_inicio_real: versaoAnterior.data_inicio_real,
                      data_termino_real: versaoAnterior.data_termino_real,
                      previsao_custo: versaoAnterior.previsao_custo,
                      valor_executado_total: versaoAnterior.valor_executado_total,
                      icone_arquivo_id: versaoAnterior.icone_arquivo_id,
                      justificativa_id: versaoAnterior.justificativa_id,
                      justificativa_complemento: versaoAnterior.justificativa_complemento,
                      responsavel_encerramento_nome: versaoAnterior.responsavel_encerramento_nome,
                      data_encerramento: versaoAnterior.data_encerramento,
                      assinatura: versaoAnterior.assinatura,
                      posicao_logotipo: versaoAnterior.posicao_logotipo,
                  }
                : {
                      previsao_inicio: snapshotAtual.previsao_inicio,
                      previsao_termino: snapshotAtual.previsao_termino,
                      data_inicio_real: snapshotAtual.data_inicio_real,
                      data_termino_real: snapshotAtual.data_termino_real,
                      previsao_custo: snapshotAtual.previsao_custo,
                      valor_executado_total: snapshotAtual.valor_executado_total,
                      icone_arquivo_id: snapshotAtual.icone_arquivo_id,
                      justificativa_id: null,
                      justificativa_complemento: null,
                      responsavel_encerramento_nome: user.nome_exibicao,
                      data_encerramento: now,
                      assinatura: null,
                      posicao_logotipo: 'Esquerda' as PosicaoLogotipo,
                  };

            // Arquiva versão anterior se existir
            if (versaoAnterior) {
                await prismaTx.projetoTermoEncerramento.update({
                    where: { id: versaoAnterior.id },
                    data: {
                        removido_em: now,
                        removido_por: user.id,
                        ultima_versao: null,
                    },
                });
            }

            // Cria nova versão
            const novoTermo = await prismaTx.projetoTermoEncerramento.create({
                data: {
                    projeto_id: projeto_id,
                    ultima_versao: true,

                    // Snapshot (sempre atualizado do projeto)
                    nome_projeto: snapshotAtual.nome_projeto,
                    orgao_responsavel_nome: snapshotAtual.orgao_responsavel_nome,
                    portfolios_nomes: snapshotAtual.portfolios_nomes,
                    objeto: snapshotAtual.objeto,
                    status_final: snapshotAtual.status_final,
                    etapa_nome: snapshotAtual.etapa_nome,

                    // Campos editáveis (merge: DTO > Base)
                    previsao_inicio: this.mergeValue(dto.previsao_inicio, baseDados.previsao_inicio),
                    previsao_termino: this.mergeValue(dto.previsao_termino, baseDados.previsao_termino),
                    data_inicio_real: this.mergeValue(dto.data_inicio_real, baseDados.data_inicio_real),
                    data_termino_real: this.mergeValue(dto.data_termino_real, baseDados.data_termino_real),
                    previsao_custo: this.mergeValue(dto.previsao_custo, baseDados.previsao_custo),
                    valor_executado_total: this.mergeValue(dto.valor_executado_total, baseDados.valor_executado_total),

                    icone_arquivo_id: iconeArquivoId,
                    justificativa_id: this.mergeValue(dto.justificativa_id, baseDados.justificativa_id),
                    justificativa_complemento: this.mergeValue(
                        dto.justificativa_complemento,
                        baseDados.justificativa_complemento
                    ),

                    responsavel_encerramento_nome:
                        dto.responsavel_encerramento_nome ?? baseDados.responsavel_encerramento_nome ?? '',
                    data_encerramento: dto.data_encerramento ?? baseDados.data_encerramento ?? now,
                    assinatura: dto.assinatura ?? baseDados.assinatura ?? null,
                    posicao_logotipo: dto.posicao_logotipo ?? baseDados.posicao_logotipo ?? 'Esquerda',

                    // Metadados

                    criado_por: user.id,
                    criado_em: now,
                },
                select: { id: true },
            });

            return novoTermo;
        });
    }

    /**
     * Exclui o rascunho atual (soft delete).
     */
    async excluir(tipo: TipoProjeto, projeto_id: number, user: PessoaFromJwt): Promise<void> {
        const updated = await this.prisma.projetoTermoEncerramento.updateMany({
            where: {
                projeto_id: projeto_id,
                ultima_versao: true,
                removido_em: null,
            },
            data: {
                removido_em: new Date(),
                removido_por: user.id,
                ultima_versao: null,
            },
        });

        if (updated.count === 0) {
            throw new HttpException('Nenhum rascunho encontrado para excluir', 404);
        }
    }

    /**
     * Calcula o snapshot baseado nos dados atuais do Projeto/Cronograma/Orçamento.
     */
    private async calcularSnapshotPeloProjeto(
        projeto_id: number,
        tx: Prisma.TransactionClient = this.prisma
    ): Promise<SnapshotCalculado> {
        const projeto = await tx.projeto.findUniqueOrThrow({
            where: { id: projeto_id },
            include: {
                orgao_responsavel: { select: { sigla: true, descricao: true } },
                portfolio: { select: { titulo: true, icone_impressao: true } },
                portfolios_compartilhados: {
                    where: { removido_em: null },
                    include: { portfolio: { select: { titulo: true } } },
                },
                projeto_etapa: { select: { descricao: true } },
                TarefaCronograma: {
                    where: { removido_em: null },
                    take: 1,
                    select: {
                        previsao_inicio: true,
                        previsao_termino: true,
                        realizado_inicio: true,
                        realizado_termino: true,
                        previsao_custo: true,
                    },
                },
                OrcamentoRealizado: {
                    where: { removido_em: null },
                    select: {
                        soma_valor_empenho: true,
                    },
                },
            },
        });

        // Monta lista de nomes dos portfólios
        const nomesPortfolios = [projeto.portfolio.titulo];
        projeto.portfolios_compartilhados.forEach((pc) => nomesPortfolios.push(pc.portfolio.titulo));

        const crono = projeto.TarefaCronograma[0];

        // Calcula valor executado total (soma dos empenhados)
        const valorExecutadoTotal = projeto.OrcamentoRealizado.reduce((acc, curr) => {
            return acc + (curr.soma_valor_empenho?.toNumber() || 0);
        }, 0);

        // Ícone padrão: usa o do portfólio se existir
        const iconeArquivoId = projeto.portfolio.icone_impressao ?? null;

        return {
            nome_projeto: projeto.nome,
            orgao_responsavel_nome: projeto.orgao_responsavel
                ? `${projeto.orgao_responsavel.sigla} - ${projeto.orgao_responsavel.descricao}`
                : '',
            portfolios_nomes: nomesPortfolios.join(', '),
            objeto: projeto.objeto ?? '',
            status_final: ProjetoStatusParaExibicao[projeto.status] ?? projeto.status,
            etapa_nome: projeto.projeto_etapa?.descricao ?? '',

            previsao_inicio: crono?.previsao_inicio ?? projeto.previsao_inicio ?? null,
            previsao_termino: crono?.previsao_termino ?? projeto.previsao_termino ?? null,
            data_inicio_real: crono?.realizado_inicio ?? null,
            data_termino_real: crono?.realizado_termino ?? null,

            previsao_custo: crono?.previsao_custo ?? projeto.previsao_custo ?? null,
            valor_executado_total: valorExecutadoTotal || null,

            justificativa_id: null,
            justificativa_complemento: null,
            responsavel_encerramento_nome: null,
            data_encerramento: null,
            assinatura: null,
            posicao_logotipo: 'Esquerda',

            icone_arquivo_id: iconeArquivoId,
        };
    }

    /**
     * Processa o token de upload/download do ícone.
     * Retorna o ID do arquivo ou null.
     */
    private processarIcone(dto: UpsertTermoEncerramentoDto, iconeAnteriorId: number | null): number | null {
        // Se não enviou nada sobre ícone, mantém o anterior
        if (dto.icone_upload_token === undefined && !dto.sobrescrever_icone) {
            return iconeAnteriorId;
        }

        // Se quer remover o ícone
        if (dto.icone_upload_token === null && dto.sobrescrever_icone) {
            return null;
        }

        // Se enviou um token
        if (dto.icone_upload_token) {
            const novoIconeId = this.uploadService.checkUploadOrDownloadToken(dto.icone_upload_token);

            // Se o ID é o mesmo do anterior, OK
            if (novoIconeId === iconeAnteriorId) {
                return iconeAnteriorId;
            }

            // Se tem ícone anterior e está tentando trocar sem flag
            if (iconeAnteriorId !== null && !dto.sobrescrever_icone) {
                throw new HttpException(
                    'Para trocar o ícone existente, envie sobrescrever_icone=true junto com o novo token',
                    400
                );
            }

            return novoIconeId;
        }

        return iconeAnteriorId;
    }

    /**
     * Valida se pode usar justificativa_complemento baseado na configuração da justificativa.
     */
    private async validarJustificativa(
        dto: UpsertTermoEncerramentoDto,
        complementoAnterior: string | null,
        tx: Prisma.TransactionClient
    ): Promise<void> {
        // Se não está enviando justificativa_id, não precisa validar
        if (dto.justificativa_id === undefined || dto.justificativa_id === null) {
            return;
        }

        // Se não está enviando complemento, não precisa validar
        if (dto.justificativa_complemento === undefined || dto.justificativa_complemento === null) {
            return;
        }

        // Busca a justificativa selecionada
        const justificativa = await tx.projetoTipoEncerramento.findUnique({
            where: { id: dto.justificativa_id },
            select: { habilitar_info_adicional: true },
        });

        if (!justificativa) {
            throw new HttpException('Justificativa não encontrada', 400);
        }

        // Se info adicional está desabilitada
        if (!justificativa.habilitar_info_adicional) {
            // Permite manter se já existia na versão anterior
            if (complementoAnterior && dto.justificativa_complemento === complementoAnterior) {
                return;
            }

            // Se está tentando adicionar/modificar, bloqueia
            if (dto.justificativa_complemento && dto.justificativa_complemento !== complementoAnterior) {
                throw new HttpException('Esta justificativa não permite informação adicional', 400);
            }
        }
    }

    /**
     * Monta o DTO do ícone com download token.
     */
    private montarIconeDto(icone: { id: number } | null): TermoEncerramentoIconeDto | null {
        if (!icone) return null;

        return {
            id: icone.id,
            download_token: this.uploadService.getDownloadToken(icone.id, '1 days').download_token,
        };
    }

    /**
     * Busca o ícone pelo ID e monta o DTO.
     */
    private async buscarIconeDto(icone_arquivo_id: number): Promise<TermoEncerramentoIconeDto | null> {
        const arquivo = await this.prisma.arquivo.findUnique({
            where: { id: icone_arquivo_id },
            select: { id: true },
        });

        return this.montarIconeDto(arquivo);
    }

    /**
     * Helper para merge de valores: se dto value é undefined, usa base. Se é null ou valor, usa dto.
     */
    private mergeValue<T>(dtoValue: T | undefined, baseValue: T): T {
        return dtoValue !== undefined ? dtoValue : baseValue;
    }
}
