import { createWriteStream, WriteStream } from 'fs';
import { ListaDePrivilegios } from '../../../common/ListaDePrivilegios';
import { PrismaService } from '../../../prisma/prisma.service';
import { FileOutput } from '../../utils/utils.service';
import { GetTempFileName } from '../reports.service';
import { ModuloSistema } from '@prisma/client';

export type RestricaoAcesso = {
    portfolio_orgao_ids?: number[];
    roles?: ListaDePrivilegios[];
};

export class ReportContext {
    private cancelled: boolean = false;
    private files: FileOutput[] = [];
    private restricaoAcesso: RestricaoAcesso | null = null;
    private prisma: PrismaService;
    private relatorio_id: number | null;
    private resumoSaidaData: Record<string, any> = {};

    public readonly sistema: ModuloSistema;

    constructor(prisma: PrismaService, relatorio_id: number, sistema: ModuloSistema) {
        this.prisma = prisma;
        this.relatorio_id = relatorio_id;
        this.sistema = sistema;
    }

    cancel() {
        this.cancelled = true;
    }

    isCancelled() {
        return this.cancelled;
    }

    async progress(progresso: number): Promise<void> {
        if (this.relatorio_id) {
            progresso = Math.min(100, Math.max(0, progresso));

            this.prisma.relatorio
                .update({
                    where: { id: this.relatorio_id },
                    data: {
                        progresso: progresso,
                    },
                })
                .catch((e) => {
                    console.error('Erro ao atualizar progresso do relatório', e);
                });
        }
    }

    getTmpFile(prefix: string): { path: string; stream: WriteStream } {
        const path = GetTempFileName(prefix);
        const stream = createWriteStream(path);
        return { path, stream };
    }

    getFiles(): FileOutput[] {
        return this.files;
    }

    addFile(file: FileOutput) {
        this.files.push(file);
    }

    setRestricaoAcesso(restricao: RestricaoAcesso) {
        this.restricaoAcesso = { ...this.restricaoAcesso, ...restricao };
    }

    getRestricaoAcesso(): RestricaoAcesso | null {
        return this.restricaoAcesso;
    }

    /**
     * Adiciona ou atualiza um campo no resumo_saida do relatório.
     */
    async resumoSaida(chave: string, valor: any): Promise<void> {
        this.resumoSaidaData[chave] = valor;

        if (this.relatorio_id) {
            try {
                await this.prisma.relatorio.update({
                    where: { id: this.relatorio_id },
                    data: {
                        resumo_saida: JSON.parse(JSON.stringify(this.resumoSaidaData)),
                    },
                });
            } catch (error) {
                console.error('Erro ao atualizar resumo_saida do relatório', error);
            }
        }
    }

    getResumoSaida(): Record<string, any> {
        return this.resumoSaidaData;
    }
}
