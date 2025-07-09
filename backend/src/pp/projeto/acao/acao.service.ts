import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { Prisma, ProjetoStatus, TipoProjeto } from 'src/generated/prisma/client';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { ReportsService } from '../../../reports/relatorios/reports.service';
import { ProjetoService } from '../projeto.service';
import { CreateAcaoDto, ProjetoAcao } from './dto/acao.dto';

@Injectable()
export class AcaoService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => ProjetoService)) private readonly projetoService: ProjetoService,
        @Inject(forwardRef(() => ReportsService)) private readonly reportsService: ReportsService
    ) {}

    async create(tipo: TipoProjeto, dto: CreateAcaoDto, user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(tipo, dto.projeto_id, user, 'ReadWrite');

        const acaoDesejada = 'acao_' + dto.acao;
        if (!(projeto.permissoes as any)[acaoDesejada])
            throw new HttpException(`Não é possível executar ação ${dto.acao} no momento`, 400);

        // 'MDO_NaoIniciada', 'MDO_Concluida', 'MDO_EmAndamento',  'MDO_Paralisada'
        // nao iniciada -> Registro
        // em andamento -> Acompanhamento
        // paralisada -> Acompanhamento
        // concluída -> Encerramento

        const dePara: Record<
            ProjetoAcao,
            {
                date: keyof Prisma.ProjetoUncheckedCreateInput;
                user: keyof Prisma.ProjetoUncheckedCreateInput;
                status: ProjetoStatus | undefined;
            }
        > = {
            'arquivar': { date: 'arquivado_em', user: 'arquivado_por', status: undefined },
            'restaurar': { date: 'restaurado_em', user: 'restaurado_por', status: undefined },
            'selecionar': { date: 'selecionado_em', user: 'selecionado_por', status: 'Selecionado' },
            'iniciar_planejamento': {
                date: 'em_planejamento_em',
                user: 'em_planejamento_por',
                status: 'EmPlanejamento',
            },
            'finalizar_planejamento': {
                date: 'finalizou_planejamento_em',
                user: 'finalizou_planejamento_por',
                status: 'Planejado',
            },
            'validar': { date: 'validado_em', user: 'validado_por', status: 'Validado' },
            'iniciar': { date: 'iniciado_em', user: 'iniciado_por', status: 'EmAcompanhamento' },
            'suspender': { date: 'suspenso_em', user: 'suspenso_por', status: 'Suspenso' },
            'reiniciar': { date: 'reiniciado_em', user: 'reiniciado_por', status: 'EmAcompanhamento' },
            'cancelar': { date: 'cancelado_em', user: 'cancelado_por', status: 'Fechado' },
            'terminar': { date: 'terminado_em', user: 'terminado_por', status: 'Fechado' },

            'iniciar_obra': { date: 'iniciado_em', user: 'iniciado_por', status: 'MDO_EmAndamento' },
            'concluir_obra': { date: 'terminado_em', user: 'terminado_por', status: 'MDO_Concluida' },
            'paralisar_obra': { date: 'suspenso_em', user: 'suspenso_por', status: 'MDO_Paralisada' },
        } as const;

        const dbAction = dePara[dto.acao];
        if (!dbAction) throw new HttpException(`Ação ${dto.acao} não foi encontrada.`, 500);

        const now = new Date(Date.now());
        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                let arquivado: boolean | undefined = undefined;
                let eh_prioritario: boolean | undefined = undefined;
                let codigo: string | undefined = undefined;

                if (dto.acao == 'arquivar') arquivado = true;
                if (dto.acao == 'restaurar') arquivado = false;
                if (tipo == 'PP') {
                    if (dto.acao == 'selecionar') eh_prioritario = true;
                    if (dto.acao == 'iniciar_planejamento')
                        codigo = await this.projetoService.geraProjetoCodigo(projeto.id, prismaTx);
                }

                await prismaTx.projeto.update({
                    where: { id: projeto.id },
                    data: {
                        [dbAction.date]: now,
                        [dbAction.user]: user.id,
                        status: dbAction.status,
                        eh_prioritario,
                        arquivado,
                        codigo,
                    },
                });

                let motivo: string = 'MudancaDeStatus';
                switch (dbAction.status) {
                    case 'Selecionado':
                        motivo = 'ProjetoSelecionado';
                        break;
                    case 'Planejado':
                        motivo = 'ProjetoPlanejado';
                        break;
                    case 'Fechado':
                        motivo = 'ProjetoEncerrado';
                        break;
                }

                // aguardar os reports de MDO
                if (tipo == 'PP') {
                    await this.reportsService.criaRelatorioProjeto(projeto.id, motivo, user, prismaTx);
                }
            },
            {
                isolationLevel: 'Serializable',
                maxWait: 60 * 1000,
                timeout: 15 * 1000,
            }
        );
    }
}
