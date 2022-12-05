import { Eixo } from "src/eixo/entities/eixo.entity";
import { Meta } from "src/meta/entities/meta.entity";
import { ObjetivoEstrategico } from "src/objetivo-estrategico/entities/objetivo-estrategico.entity";
import { SubTema } from "src/subtema/entities/subtema.entity";
import { Tag } from "src/tag/entities/tag.entity";
import { ListPdm } from "../entities/list-pdm.entity";
import { OrcamentoConfig } from "./list-pdm.dto";

export class DetalhePdmDto {

    /**
   * Objeto do PDM, único que sempre será retornado
   * @example pdm
    */
    pdm: ListPdm

    /**
   * Lista de objetos de Objetivos Estratégicos
   * @example ObjetivoEstrategico[]
    */
    tema?: ObjetivoEstrategico[]

    /**
   * Lista de objetos de Objetivos Estratégicos
   * @example ObjetivoEstrategico[]
    */
    sub_tema?: SubTema[]

    /**
   * Lista de objetos de
   * @example Eixo[]
    */
    eixo?: Eixo[]

    /**
   * Lista de objetos de
   * @example Meta[]
    */
    meta?: Meta[]

    /**
   * Lista de objetos de
   * @example Tag[]
    */
    tag?: Tag[]

    orcamento_config: OrcamentoConfig[] | null
}