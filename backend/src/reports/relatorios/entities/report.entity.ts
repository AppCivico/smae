import { ApiProperty } from '@nestjs/swagger';

export class RelatorioParamDto {
    filtro: string;
    valor: string | string[];
}

export class RelatorioDto {
    id: number;
    criado_em: Date;
    criador: { nome_exibicao: string };
    fonte: string;
    arquivo: string;
    parametros: any;

    @ApiProperty({
        type: RelatorioParamDto,
        isArray: true,
        description: 'Lista de parâmetros processados do relatório',
    })
    parametros_processados: RelatorioParamDto[] | null;
    pdm_id: number | null;
}
