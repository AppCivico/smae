import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
        console.log(dto);

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

        const dePara: Record<ProjetoAcao, typeof DbActions[number]> = {
            'arquivar': { h: 'arquivado_em', p: 'arquivado_por' },
            'restaurar': { h: 'restaurado_em', p: 'restaurado_por' },
            'selecionar': { h: 'selecionado_em', p: 'selecionado_por' },
            'finalizar_planejamento': { h: 'finalizou_planejamento_em', p: 'finalizou_planejamento_por' },
            'validar': { h: 'validado_em', p: 'validado_por' },
            'iniciar': { h: 'iniciado_em', p: 'iniciado_por' },
            'suspender': { h: 'suspenso_em', p: 'suspenso_por' },
            'reiniciar': { h: 'reiniciado_em', p: 'reiniciado_por' },
            'cancelar': { h: 'cancelado_em', p: 'cancelado_por' },
            'terminar': { h: 'terminado_em', p: 'terminado_por' },
        } as const;

        const acao = dePara[dto.acao];
        if (!acao) throw new HttpException(`Ação ${dto.acao} não foi encontrada.`, 500);

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const [colunaHora, colunaPessoa] = [acao.h, acao.p];

            let arquivado: boolean | undefined = undefined;
            if (dto.acao == 'arquivar') arquivado = true;
            if (dto.acao == 'restaurar') arquivado = false;

            await prismaTx.projeto.update({
                where: { id: projeto.id },
                data: {
                    [colunaHora]: new Date(Date.now()),
                    [colunaPessoa]: user.id,
                    arquivado: arquivado
                }
            });

            // basta isso para gerar um relatório
            await prismaTx.projetoRelatorioFila.create({ data: { projeto_id: projeto.id } });
        });

    }


}
