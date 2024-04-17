import { TarefaCronogramaDto } from 'src/common/dto/TarefaCronograma.dto';
import { ListApenasTarefaListDto } from 'src/pp/tarefa/entities/tarefa.entity';

export class ListTarefaTransferenciaDto extends ListApenasTarefaListDto {
    cabecalho: TarefaCronogramaDto;
}
