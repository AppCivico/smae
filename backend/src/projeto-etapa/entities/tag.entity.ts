import { IdDescricaoDto, IdTituloDto } from 'src/common/dto/IdTitulo.dto';

export class ProjetoEtapaDto {
    id: number;
    descricao: string;
    portfolio: IdTituloDto | null;
    etapa_padrao: IdDescricaoDto | null;
    eh_padrao: boolean;
}
