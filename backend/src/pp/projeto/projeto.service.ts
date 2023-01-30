import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ProjetoStatus } from '@prisma/client';
import { IdCodTituloDto } from 'src/common/dto/IdCodTitulo.dto';
import { PessoaFromJwt } from '../../auth/models/PessoaFromJwt';
import { RecordWithId } from '../../common/dto/record-with-id.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../../upload/upload.service';
import { PortfolioDto } from '../portfolio/entities/portfolio.entity';
import { PortfolioService } from '../portfolio/portfolio.service';
import { CreateProjetoDocumentDto, CreateProjetoDto } from './dto/create-projeto.dto';
import { FilterProjetoDto } from './dto/filter-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { ProjetoDetailDto, ProjetoDocumentoDto, ProjetoDto } from './entities/projeto.entity';

@Injectable()
export class ProjetoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly portfolioService: PortfolioService,
        private readonly uploadService: UploadService
    ) { }

    private async processaOrigem(dto: CreateProjetoDto) {
        let meta_id: number | null = dto.meta_id ? dto.meta_id : null;
        let iniciativa_id: number | null = dto.iniciativa_id ? dto.iniciativa_id : null;
        let atividade_id: number | null = dto.atividade_id ? dto.atividade_id : null;
        let origem_outro: string = dto.origem_outro || '';

        if (dto.origem_outro && (dto.atividade_id || dto.iniciativa_id || dto.meta_id))
            throw new HttpException('origem_outro| não pode ser definido se enviar meta|iniciativa|atividade', 400);

        if (!dto.atividade_id && !dto.iniciativa_id && !dto.meta_id) {
            if (!dto.origem_outro)
                throw new HttpException('origem_outro| é obrigatório quando não enviar meta|iniciativa|atividade', 400);
        }

        // verificar se a meta/ini/ativ existem, preencher os parents

        return {
            meta_id, atividade_id, iniciativa_id, origem_outro,
        }
    }

    private async processaOrgaoGestor(dto: CreateProjetoDto, portfolio: PortfolioDto) {
        let orgao_gestor_id: number = + dto.orgao_gestor_id;
        let responsaveis_no_orgao_gestor: number[] = dto.responsaveis_no_orgao_gestor;

        if (portfolio.orgaos.map(r => r.id).includes(orgao_gestor_id) == false)
            throw new HttpException('orgao_gestor_id| não faz parte do Portfolio', 400);

        // TODO verificar se cada [responsaveis_no_orgao_gestor] existe realmente
        // e se tem o privilegio gestor_de_projeto

        return {
            orgao_gestor_id, responsaveis_no_orgao_gestor
        }
    }

    async create(dto: CreateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const portfolios = await this.portfolioService.findAll(user);

        const portfolio = portfolios.filter(r => r.id == dto.portfolio_id)[0];
        if (!portfolio)
            throw new HttpException('portfolio_id| Portfolio não está liberado para criação de projetos para seu usuário', 400);

        const { meta_id, atividade_id, iniciativa_id, origem_outro } = await this.processaOrigem(dto);
        const { orgao_gestor_id, responsaveis_no_orgao_gestor } = await this.processaOrgaoGestor(dto, portfolio);

        const created = await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
            const row = await prismaTx.projeto.create({
                data: {
                    registrado_por: user.id,
                    registrado_em: new Date(Date.now()),
                    portfolio_id: dto.portfolio_id,
                    orgao_gestor_id: orgao_gestor_id,
                    responsaveis_no_orgao_gestor: responsaveis_no_orgao_gestor,

                    orgaos_participantes: {
                        createMany: {
                            data: dto.orgaos_participantes.map(o => { return { orgao_id: o } })
                        }
                    },
                    orgao_responsavel_id: dto.orgao_responsavel_id,
                    responsavel_id: dto.responsavel_id,
                    nome: dto.nome,
                    resumo: dto.resumo,
                    previsao_inicio: dto.previsao_inicio,
                    previsao_termino: dto.previsao_termino,

                    origem_outro: origem_outro,
                    meta_id: meta_id,
                    iniciativa_id: iniciativa_id,
                    atividade_id: atividade_id,

                    previsao_custo: dto.previsao_custo,
                    escopo: dto.escopo,
                    principais_etapas: dto.principais_etapas,
                    versao: dto.versao,
                    data_aprovacao: dto.data_aprovacao,

                    descricao: '',
                    objetivo: '',
                    objeto: '',
                    publico_alvo: '',
                    fase: 'Registro',
                    status: 'Registrado',
                },
                select: { id: true }
            });

            return row;
        });

        return created;
    }

    async findAll(filters: FilterProjetoDto, user: PessoaFromJwt): Promise<ProjetoDto[]> {
        const ret: ProjetoDto[] = [];

        const rows = await this.prisma.projeto.findMany({
            where: {
                eh_prioritario: filters.eh_prioritario,
                orgao_responsavel_id: filters.orgao_responsavel_id,
                arquivado: filters.arquivado,
                status: filters.status,
            },
            select: {
                id: true,
                nome: true,
                status: true,

                atividade: {
                    select: {
                        iniciativa: {
                            select: {
                                meta: {
                                    select: {
                                        id: true,
                                        codigo: true,
                                        titulo: true
                                    }
                                }
                            }
                        }
                    }
                },

                iniciativa: {
                    select: {
                        meta: {
                            select: {
                                id: true,
                                codigo: true,
                                titulo: true
                            }
                        }
                    }
                },

                meta: {
                    select: {
                        id: true,
                        codigo: true,
                        titulo: true
                    }
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true
                    }
                }
            }
        });

        for (const row of rows) {
            let meta: IdCodTituloDto | null;

            if (row.atividade) {
                meta = { ...row.atividade.iniciativa.meta }
            } else if (row.iniciativa) {
                meta = { ...row.iniciativa.meta }
            } else if (row.meta) {
                meta = row.meta
            } else {
                meta = null;
            }

            ret.push({
                id: row.id,
                nome: row.nome,
                status: row.status,
                meta: meta,
                orgao_responsavel: row.orgao_responsavel ? { ...row.orgao_responsavel } : null
            })
        }

        return ret;
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<ProjetoDetailDto> {

        if (!user.hasSomeRoles(['Projeto.administrador'])) {
            // TODO verificar a permissão do "user",
            // se chegou aqui ele pode ser tanto um SMAE.gestor_de_projeto ou então ser um dos respostáveis

        }

        const projetoRow = await this.prisma.projeto.findFirstOrThrow({
            where: { id: id },
            select: {
                id: true,
                meta_id: true,
                iniciativa_id: true,
                atividade_id: true,
                nome: true,
                status: true,
                resumo: true,
                codigo: true,
                descricao: true,
                objeto: true,
                objetivo: true,
                publico_alvo: true,
                previsao_inicio: true,
                previsao_custo: true,
                previsao_duracao: true,
                previsao_termino: true,
                inicio_real: true,
                custo_real: true,
                realizado_inicio: true,
                realizado_termino: true,
                realizado_custo: true,
                escopo: true,
                nao_escopo: true,
                principais_etapas: true,
                responsaveis_no_orgao_gestor: true,

                orgao_gestor: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true
                    }
                },

                orgao_responsavel: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true
                    }
                },

                premissas: {
                    select: {
                        id: true,
                        premissa: true
                    }
                },

                restricoes: {
                    select: {
                        id: true,
                        restricao: true,
                    }
                },

                recursos: {
                    select: {
                        id: true,
                        fonte_recurso_cod_sof: true,
                        fonte_recurso_ano: true,
                        valor_percentual: true,
                        valor_nominal: true,
                    }
                },

                responsavel: {
                    select: {
                        id: true,
                        nome_exibicao: true,
                    }
                },

                orgaos_participantes: {
                    select: {
                        orgao: {
                            select: {
                                id: true,
                                sigla: true,
                                descricao: true
                            }
                        }
                    }
                }

            }
        });

        return {
            ...projetoRow,
            orgaos_participantes: projetoRow.orgaos_participantes.map(o => {
                return {
                    id: o.orgao.id,
                    sigla: o.orgao.sigla,
                    descricao: o.orgao.descricao
                }
            })
        }
    }

    async update(id: number, updateProjetoDto: UpdateProjetoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        throw '...'
    }

    async remove(id: number, user: PessoaFromJwt) {
        await this.prisma.portfolio.updateMany({
            where: { id: id, removido_em: null },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });
        return;
    }

    async append_document(projetoId: number, createPdmDocDto: CreateProjetoDocumentDto, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user);

        const arquivoId = this.uploadService.checkUploadToken(createPdmDocDto.upload_token);

        const arquivo = await this.prisma.projetoDocumento.create({
            data: {
                criado_em: new Date(Date.now()),
                criado_por: user.id,
                arquivo_id: arquivoId,
                projeto_id: projetoId
            },
            select: {
                id: true
            }
        });

        return { id: arquivo.id }
    }

    async list_document(projetoId: number, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user);

        const arquivos: ProjetoDocumentoDto[] = await this.prisma.projetoDocumento.findMany({
            where: { projeto_id: projetoId, removido_em: null },
            select: {
                id: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true
                    }
                }
            }
        });
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos
    }

    async remove_document(projetoId: number, projetoDocId: number, user: PessoaFromJwt) {
        // aqui é feito a verificação se esse usuário pode realmente acessar esse recurso
        await this.findOne(projetoId, user);

        await this.prisma.projetoDocumento.updateMany({
            where: { projeto_id: projetoId, removido_em: null, id: projetoDocId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            }
        });
    }
}
