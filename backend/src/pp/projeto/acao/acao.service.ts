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

        const DbActions: { h: keyof Prisma.ProjetoUncheckedCreateInput, p: keyof Prisma.ProjetoUncheckedCreateInput }[] = [
            { h: 'arquivado_em', p: 'arquivado_por' },
            { h: 'restaurado_em', p: 'restaurado_por' },
            { h: 'selecionado_por', p: 'selecionado_por' },
            { h: 'finalizou_planejamento_em', p: 'finalizou_planejamento_por' },
            { h: 'validado_em', p: 'validado_por' },
            { h: 'suspenso_em', p: 'suspenso_por' },
            { h: 'iniciado_em', p: 'iniciado_por' },
            { h: 'reiniciado_em', p: 'reiniciado_por' },
            { h: 'cancelado_em', p: 'cancelado_por' },
            { h: 'terminado_em', p: 'terminado_por' },
        ];

        const dePara: Record<ProjetoAcao, (typeof DbActions[number]) & { status: ProjetoStatus | undefined }> = {
            'arquivar': { h: 'arquivado_em', p: 'arquivado_por', status: undefined },
            'restaurar': { h: 'restaurado_em', p: 'restaurado_por', status: undefined },
            'selecionar': { h: 'selecionado_em', p: 'selecionado_por', status: 'Planejado' },
            'finalizar_planejamento': { h: 'finalizou_planejamento_em', p: 'finalizou_planejamento_por', status: 'Planejado' },
            'validar': { h: 'validado_em', p: 'validado_por', status: 'Validado' },
            'iniciar': { h: 'iniciado_em', p: 'iniciado_por', status: 'EmAcompanhamento' },
            'suspender': { h: 'suspenso_em', p: 'suspenso_por', status: 'Suspenso' },
            'reiniciar': { h: 'reiniciado_em', p: 'reiniciado_por', status: 'EmAcompanhamento' },
            'cancelar': { h: 'cancelado_em', p: 'cancelado_por', status: 'Fechado' },
            'terminar': { h: 'terminado_em', p: 'terminado_por', status: 'Fechado' },
        } as const;

        const dbAction = dePara[dto.acao];
        if (!dbAction) throw new HttpException(`Ação ${dto.acao} não foi encontrada.`, 500);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            let arquivado: boolean | undefined = undefined;
            let eh_prioritario: boolean | undefined = undefined;

            if (dto.acao == 'arquivar') arquivado = true;
            if (dto.acao == 'restaurar') arquivado = false;
            if (dto.acao == 'selecionar') eh_prioritario = true;

            await prismaTx.projeto.update({
                where: { id: projeto.id },
                data: {
                    [dbAction.h]: new Date(Date.now()),
                    [dbAction.p]: user.id,
                    status: dbAction.status,
                    arquivado: arquivado,
                    eh_prioritario: eh_prioritario,
                }
            });

            // basta isso para gerar um relatório
            await prismaTx.projetoRelatorioFila.create({ data: { projeto_id: projeto.id } });
        });

    }


}
