import { ApiProperty } from '@nestjs/swagger';
import { RelatorioVisibilidade } from '@prisma/client';

export class RelatorioParamDto {
    filtro: string;
    valor: string | string[];
}

export class RelatorioDto {
    id: number;
    criado_em: Date;
    criador: { nome_exibicao: string };
    fonte: string;
    arquivo: string | null;
    parametros: any;
    progresso: number | null;
    err_msg: string | null;
    // TODO: Remover isso aqui e mandar só enum de visibilidade.
    eh_publico: boolean;
    visibilidade: RelatorioVisibilidade;
    @ApiProperty({
        type: RelatorioParamDto,
        isArray: true,
        description: 'Lista de parâmetros processados do relatório',
    })
    parametros_processados: RelatorioParamDto[] | null;
    pdm_id: number | null;
}
