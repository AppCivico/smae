import { IdNomeDto } from 'src/common/dto/IdNome.dto';

export class WorkflowDto {
    id: number;
    ativo: boolean;
    inicio: Date;
    termino: Date | null;
    transferencia_tipo: IdNomeDto;
}

export class ListWorkflowDto {
    linhas: WorkflowDto[];
}
