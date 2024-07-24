import { MacroTemaDto } from '../../macro-tema/entities/macro-tema.entity';
import { MetaItemDto } from '../../meta/entities/meta.entity';
import { ObjetivoEstrategicoDto } from '../../tema/entities/objetivo-estrategico.entity';
import { SubTemaDto } from '../../subtema/entities/subtema.entity';
import { TagDto } from '../../tag/entities/tag.entity';
import { ListPdm } from '../entities/list-pdm.entity';
import { OrcamentoConfig } from './list-pdm.dto';
import { PlanoSetorialDto } from './pdm.dto';

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
    tema?: ObjetivoEstrategicoDto[];

    /**
     * Lista de objetos de Objetivos Estratégicos
     * @example ObjetivoEstrategico[]
     */
    sub_tema?: SubTemaDto[];

    /**
     * Lista de objetos de
     * @example Eixo[]
     */
    eixo?: MacroTemaDto[];

    /**
     * Lista de objetos de
     * @example Meta[]
     */
    meta?: MetaItemDto[];

    /**
     * Lista de objetos de
     * @example Tag[]
     */
    tag?: TagDto[];

    orcamento_config: OrcamentoConfig[] | null;
}

export class DetalhePSDto {

    pdm: PlanoSetorialDto;


    orcamento_config: OrcamentoConfig[] | null;
}

