import { IsString } from 'class-validator';

export class SeiUsuarioDto {
    nome: string;
    rf: string;
}
export class SeiUnidadeDto {
    id_unidade: string;
    sigla: string;
    descricao: string;
    tipo_unidade: string;
}

export class SeiProcessadoDto {
    ultimo_andamento_por: SeiUsuarioDto;
    ultimo_andamento_em: Date | null;
    ultimo_andamento_unidade: SeiUnidadeDto;
}

export class SeiIntegracaoDto {
    id: number;
    processo_sei: string;
    ativo: boolean;
    link: string;
    atualizado_em: Date;
    sei_atualizado_em: Date;
    resumo_atualizado_em: Date;
    status_code: number | null;
    json_resposta?: any;
    resumo_json_resposta?: any;
    processado: SeiProcessadoDto | null;
}
//7610.2019/0001393-8
//export const CONST_PROC_SEI_REGEXP = /^\d{4}\.?\d{4}\/?\d{7}-?\d$/;
export const CONST_PROC_SEI_MESSAGE = 'Processo não está no formato esperado: DDDD.DDDD/DDDDDDD-D (SEI)';

export class FilterSeiParams {
    @IsString()
    //@Matches(/^\d{4}\.?\d{4}\/?\d{7}-?\d$/, { message: CONST_PROC_SEI_MESSAGE })
    processo_sei: string;
}
