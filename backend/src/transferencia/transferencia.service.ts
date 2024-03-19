import { HttpException, Injectable } from '@nestjs/common';
import { RecordWithId } from 'src/common/dto/record-with-id.dto';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransferenciaTipoDto } from './dto/create-transferencia-tipo.dto';
import { Prisma } from '@prisma/client';
import { UpdateTransferenciaTipoDto } from './dto/update-transferencia-tipo.dto';
import { TransferenciaTipoDto } from './entities/transferencia-tipo.dto';
import { CreateTransferenciaAnexoDto, CreateTransferenciaDto } from './dto/create-transferencia.dto';
import { UpdateTransferenciaAnexoDto, UpdateTransferenciaDto } from './dto/update-transferencia.dto';
import { TransferenciaAnexoDto, TransferenciaDetailDto, TransferenciaDto } from './entities/transferencia.dto';
import { UploadService } from 'src/upload/upload.service';

@Injectable()
export class TransferenciaService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly uploadService: UploadService
    ) {}

    async createTransferencia(dto: CreateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const tipoExiste = await prismaTxn.transferenciaTipo.count({
                    where: { id: dto.tipo_id, removido_em: null },
                });
                if (!tipoExiste) throw new HttpException('tipo_id| Tipo não encontrado.', 400);

                if (dto.parlamentar_id != undefined) {
                    const parlamentarExiste = await prismaTxn.parlamentar.count({
                        where: { id: dto.parlamentar_id, removido_em: null },
                    });

                    if (!parlamentarExiste) throw new HttpException('parlamentar_id| Parlamentar não encontrado.', 400);
                }

                if (dto.partido_id != undefined) {
                    const partidoExiste = await prismaTxn.partido.count({
                        where: { id: dto.partido_id, removido_em: null },
                    });

                    if (!partidoExiste) throw new HttpException('partido_id| Partido não encontrado.', 400);
                }

                const transferencia = await prismaTxn.transferencia.create({
                    data: {
                        tipo_id: dto.tipo_id,
                        orgao_concedente_id: dto.orgao_concedente_id,
                        secretaria_concedente_id: dto.secretaria_concedente_id,
                        partido_id: dto.partido_id,
                        parlamentar_id: dto.parlamentar_id,
                        objeto: dto.objeto,
                        critico: dto.critico,
                        interface: dto.interface,
                        esfera: dto.esfera,
                        identificador: dto.identificador,
                        clausula_suspensiva: dto.clausula_suspensiva,
                        clausula_suspensiva_vencimento: dto.clausula_suspensiva_vencimento,
                        ano: dto.ano,
                        emenda: dto.emenda,
                        demanda: dto.demanda,
                        programa: dto.programa,
                        normativa: dto.normativa,
                        observacoes: dto.observacoes,
                        detalhamento: dto.detalhamento,
                        nome_programa: dto.nome_programa,
                        agencia_aceite: dto.agencia_aceite,
                        emenda_unitaria: dto.emenda_unitaria,
                        numero_identificacao: dto.numero_identificacao,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferencia;
            }
        );

        return created;
    }

    async updateTransferencia(id: number, dto: UpdateTransferenciaDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const self = await this.prisma.transferencia.findFirst({
            where: {
                id,
                removido_em: null,
            },
        });
        if (!self) throw new HttpException('id| Transferência não encontrada', 404);

        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                let pendente_preenchimento_valores: boolean = self.pendente_preenchimento_valores;
                if (dto.valor && dto.valor_contrapartida && dto.valor_total && pendente_preenchimento_valores == false)
                    pendente_preenchimento_valores = true;

                const transferencia = await prismaTxn.transferencia.update({
                    where: { id },
                    data: {
                        pendente_preenchimento_valores: pendente_preenchimento_valores,
                        valor: dto.valor,
                        valor_total: dto.valor_total,
                        valor_contrapartida: dto.valor_contrapartida,
                        dotacao: dto.dotacao,
                        ordenador_despesa: dto.ordenador_despesa,
                        gestor_contrato: dto.gestor_contrato,
                        banco_aceite: dto.banco_aceite,
                        conta_aceite: dto.conta_aceite,
                        conta_fim: dto.conta_fim,
                        agencia_fim: dto.agencia_fim,
                        banco_fim: dto.banco_fim,
                        empenho: dto.empenho,
                        criado_por: user.id,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferencia;
            }
        );

        return updated;
    }

    async findAllTransferencia(user: PessoaFromJwt): Promise<TransferenciaDto[]> {
        const rows = await this.prisma.transferencia.findMany({
            where: {
                removido_em: null,
                pendente_preenchimento_valores: false,
            },
            select: {
                id: true,
                ano: true,
                objeto: true,
                detalhamento: true,
                critico: true,
                clausula_suspensiva: true,
                clausula_suspensiva_vencimento: true,
                normativa: true,
                observacoes: true,
                programa: true,

                orgao_concedente: {
                    select: {
                        id: true,
                        descricao: true,
                        sigla: true,
                    },
                },

                secretaria_concedente: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
            },
        });

        return rows;
    }

    async findOneTransferencia(id: number, user: PessoaFromJwt): Promise<TransferenciaDetailDto> {
        const row = await this.prisma.transferencia.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: {
                id: true,
                identificador: true,
                ano: true,
                objeto: true,
                detalhamento: true,
                critico: true,
                clausula_suspensiva: true,
                clausula_suspensiva_vencimento: true,
                normativa: true,
                observacoes: true,
                programa: true,
                empenho: true,
                pendente_preenchimento_valores: true,
                valor: true,
                valor_total: true,
                valor_contrapartida: true,
                emenda: true,
                dotacao: true,
                demanda: true,
                banco_fim: true,
                conta_fim: true,
                agencia_fim: true,
                banco_aceite: true,
                conta_aceite: true,
                nome_programa: true,
                agencia_aceite: true,
                emenda_unitaria: true,
                gestor_contrato: true,
                ordenador_despesa: true,
                numero_identificacao: true,
                interface: true,
                esfera: true,
                cargo: true,
                partido: {
                    select: {
                        id: true,
                        sigla: true,
                    },
                },
                parlamentar: {
                    select: {
                        id: true,
                        nome: true,
                        nome_popular: true,
                    },
                },
                orgao_concedente: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
                secretaria_concedente: {
                    select: {
                        id: true,
                        sigla: true,
                        descricao: true,
                    },
                },
            },
        });
        if (!row) throw new HttpException('id| Transferência não encontrada.', 404);

        return row;
    }

    async removeTransferencia(id: number, user: PessoaFromJwt) {
        await this.prisma.transferencia.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async createTransferenciaTipo(dto: CreateTransferenciaTipoDto, user: PessoaFromJwt): Promise<RecordWithId> {
        const created = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: dto.nome, mode: 'insensitive' },
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 0)
                    throw new HttpException('nome| Nome igual ou semelhante já existe em outro registro ativo', 400);

                const transferenciaTipo = await prismaTxn.transferenciaTipo.create({
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        criado_por: user.id,
                        criado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });

                return transferenciaTipo;
            }
        );

        return created;
    }

    async findAllTransferenciaTipo(): Promise<TransferenciaTipoDto[]> {
        const rows = await this.prisma.transferenciaTipo.findMany({
            where: { removido_em: null },
            orderBy: { nome: 'asc' },
            select: {
                id: true,
                nome: true,
                categoria: true,
                esfera: true,
            },
        });

        return rows;
    }

    async updateTransferenciaTipo(
        id: number,
        dto: UpdateTransferenciaTipoDto,
        user: PessoaFromJwt
    ): Promise<RecordWithId> {
        const updated = await this.prisma.$transaction(
            async (prismaTxn: Prisma.TransactionClient): Promise<RecordWithId> => {
                const transferenciaTipo = await prismaTxn.transferenciaTipo.update({
                    where: { id },
                    data: {
                        nome: dto.nome,
                        categoria: dto.categoria,
                        esfera: dto.esfera,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: {
                        nome: true,
                        categoria: true,
                        esfera: true,
                    },
                });

                const similarExists = await this.prisma.transferenciaTipo.count({
                    where: {
                        nome: { endsWith: transferenciaTipo.nome, mode: 'insensitive' },
                        categoria: transferenciaTipo.categoria,
                        esfera: transferenciaTipo.esfera,
                        removido_em: null,
                    },
                });
                if (similarExists > 1) throw new HttpException('Já existe um registro com estes campos.', 400);

                return { id };
            }
        );

        return updated;
    }

    async removeTransferenciaTipo(id: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaTipo.update({
            where: { id },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }

    async append_document(transferenciaId: number, dto: CreateTransferenciaAnexoDto, user: PessoaFromJwt) {
        const arquivoId = this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const arquivo = await prismaTx.arquivo.findFirstOrThrow({
                    where: { id: arquivoId },
                    select: { descricao: true },
                });

                return await prismaTx.transferenciaAnexo.create({
                    data: {
                        criado_em: new Date(Date.now()),
                        criado_por: user.id,
                        arquivo_id: arquivoId,
                        transferencia_id: transferenciaId,
                        descricao: dto.descricao || arquivo.descricao,
                        data: dto.data,
                    },
                    select: {
                        id: true,
                    },
                });
            }
        );

        return { id: documento.id };
    }

    async list_document(transferenciaId: number, user: PessoaFromJwt) {
        const arquivos: TransferenciaAnexoDto[] = await this.findAllDocumentos(transferenciaId);
        for (const item of arquivos) {
            item.arquivo.download_token = this.uploadService.getDownloadToken(item.arquivo.id, '30d').download_token;
        }

        return arquivos;
    }

    private async findAllDocumentos(transferenciaId: number): Promise<TransferenciaAnexoDto[]> {
        const documentosDB = await this.prisma.transferenciaAnexo.findMany({
            where: { transferencia_id: transferenciaId, removido_em: null },
            orderBy: [{ descricao: 'asc' }, { data: 'asc' }],
            select: {
                id: true,
                descricao: true,
                data: true,
                arquivo: {
                    select: {
                        id: true,
                        tamanho_bytes: true,
                        TipoDocumento: true,
                        descricao: true,
                        nome_original: true,
                        diretorio_caminho: true,
                    },
                },
            },
        });

        const documentosRet: TransferenciaAnexoDto[] = documentosDB.map((d) => {
            return {
                id: d.id,
                data: d.data,
                descricao: d.descricao,
                arquivo: {
                    id: d.arquivo.id,
                    tamanho_bytes: d.arquivo.tamanho_bytes,
                    descricao: d.arquivo.descricao,
                    nome_original: d.arquivo.nome_original,
                    diretorio_caminho: d.arquivo.diretorio_caminho,
                    data: d.data,
                    TipoDocumento: d.arquivo.TipoDocumento,
                },
            };
        });

        return documentosRet;
    }

    async updateDocumento(
        transferenciaId: number,
        documentoId: number,
        dto: UpdateTransferenciaAnexoDto,
        user: PessoaFromJwt
    ) {
        this.uploadService.checkUploadOrDownloadToken(dto.upload_token);
        if (dto.diretorio_caminho)
            await this.uploadService.updateDir({ caminho: dto.diretorio_caminho }, dto.upload_token);

        const documento = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                return await prismaTx.transferenciaAnexo.update({
                    where: {
                        id: documentoId,
                        transferencia_id: transferenciaId,
                    },
                    data: {
                        descricao: dto.descricao,
                        data: dto.data,
                        atualizado_por: user.id,
                        atualizado_em: new Date(Date.now()),
                    },
                    select: { id: true },
                });
            }
        );

        return { id: documento.id };
    }

    async remove_document(transferenciaId: number, transferenciaAnexoId: number, user: PessoaFromJwt) {
        await this.prisma.transferenciaAnexo.updateMany({
            where: { transferencia_id: transferenciaId, removido_em: null, id: transferenciaAnexoId },
            data: {
                removido_por: user.id,
                removido_em: new Date(Date.now()),
            },
        });
    }
}
