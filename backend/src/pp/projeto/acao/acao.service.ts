import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, ProjetoStatus } from '@prisma/client';
import { PessoaFromJwt } from '../../../auth/models/PessoaFromJwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { ProjetoService } from '../projeto.service';
import { CreateAcaoDto, ProjetoAcao } from './dto/acao.dto';

@Injectable()
export class AcaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly projetoService: ProjetoService,

    ) { }

    async create(dto: CreateAcaoDto, user: PessoaFromJwt) {
        const projeto = await this.projetoService.findOne(dto.projeto_id, user, false);

        const acaoDesejada = 'acao_' + dto.acao;
        if (!(projeto.permissoes as any)[acaoDesejada])
            throw new HttpException(`Não é possível executar ação ${dto.acao} no momento`, 400);

        const dePara: Record<ProjetoAcao, {
            date: keyof Prisma.ProjetoUncheckedCreateInput,
            user: keyof Prisma.ProjetoUncheckedCreateInput,
            status: ProjetoStatus | undefined
        }> = {
            'arquivar': { date: 'arquivado_em', user: 'arquivado_por', status: undefined },
            'restaurar': { date: 'restaurado_em', user: 'restaurado_por', status: undefined },
            'selecionar': { date: 'selecionado_em', user: 'selecionado_por', status: 'Selecionado' },
            'iniciar_planejamento': { date: 'em_planejamento_em', user: 'em_planejamento_por', status: 'EmPlanejamento' },
            'finalizar_planejamento': { date: 'finalizou_planejamento_em', user: 'finalizou_planejamento_por', status: 'Planejado' },
            'validar': { date: 'validado_em', user: 'validado_por', status: 'Validado' },
            'iniciar': { date: 'iniciado_em', user: 'iniciado_por', status: 'EmAcompanhamento' },
            'suspender': { date: 'suspenso_em', user: 'suspenso_por', status: 'Suspenso' },
            'reiniciar': { date: 'reiniciado_em', user: 'reiniciado_por', status: 'EmAcompanhamento' },
            'cancelar': { date: 'cancelado_em', user: 'cancelado_por', status: 'Fechado' },
            'terminar': { date: 'terminado_em', user: 'terminado_por', status: 'Fechado' },
        } as const;

        const dbAction = dePara[dto.acao];
        if (!dbAction) throw new HttpException(`Ação ${dto.acao} não foi encontrada.`, 500);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            let arquivado: boolean | undefined = undefined;
            let eh_prioritario: boolean | undefined = undefined;
            let codigo: string | undefined = undefined;

            if (dto.acao == 'arquivar') arquivado = true;
            if (dto.acao == 'restaurar') arquivado = false;
            if (dto.acao == 'selecionar') eh_prioritario = true;

            if (dto.acao == 'iniciar_planejamento') codigo = await this.projetoService.getProjetoCodigo(projeto.id, prismaTx);

            await prismaTx.projeto.update({
                where: { id: projeto.id },
                data: {
                    [dbAction.date]: new Date(Date.now()),
                    [dbAction.user]: user.id,
                    status: dbAction.status,
                    arquivado: arquivado,
                    eh_prioritario: eh_prioritario,
                    codigo
                }
            });

            // basta isso para gerar um relatório
            await prismaTx.projetoRelatorioFila.create({ data: { projeto_id: projeto.id } });
        });

    }


}
