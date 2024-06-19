import { MacroTemaDto } from '../../macro-tema/entities/macro-tema.entity';
import { Meta } from '../../meta/entities/meta.entity';
import { ObjetivoEstrategico } from '../../tema/entities/objetivo-estrategico.entity';
import { SubTema } from '../../subtema/entities/subtema.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { ListPdm } from '../entities/list-pdm.entity';
import { OrcamentoConfig } from './list-pdm.dto';

export class DetalhePdmDto {
    /**
     * Objeto do PDM, único que sempre será retornado
     * @example pdm
     */
    pdm: ListPdm;

    /**
     * Lista de objetos de Objetivos Estratégicos
     * @example ObjetivoEstrategico[]
     */
    tema?: ObjetivoEstrategico[];

    /**
     * Lista de objetos de Objetivos Estratégicos
     * @example ObjetivoEstrategico[]
     */
    sub_tema?: SubTema[];

    /**
     * Lista de objetos de
     * @example Eixo[]
     */
    eixo?: MacroTemaDto[];

    /**
     * Lista de objetos de
     * @example Meta[]
     */
    meta?: Meta[];

    /**
     * Lista de objetos de
     * @example Tag[]
     */
    tag?: Tag[];

    orcamento_config: OrcamentoConfig[] | null;
}

