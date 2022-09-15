import { IsTrueFalseString } from "src/common/decorators/IsTrueFalseStr";
import { Eixo } from "src/eixo/entities/eixo.entity";
import { Meta } from "src/meta/entities/meta.entity";
import { ListObjetivoEstrategicoDto } from "src/objetivo-estrategico/dto/list-objetivo-estrategico.dto";
import { ObjetivoEstrategico } from "src/objetivo-estrategico/entities/objetivo-estrategico.entity";
import { SubTema } from "src/subtema/entities/subtema.entity";
import { Tag } from "src/tag/entities/tag.entity";
import { ListPdm } from "../entities/list-pdm.entity";

export class DetalhePdmDto {
     /**
   * Filtrar Pdm com Ativo?
   * @example "true"
    */
    @IsTrueFalseString()
    incluir_auxiliares?: string;

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
    sub_tema?: SubTema[] | undefined

    /**
   * Lista de objetos de 
   * @example Eixo[]
    */
    eixo?: Eixo[] | undefined

    /**
   * Lista de objetos de 
   * @example Meta[]
    */
    meta?: Meta[] | undefined

    /**
   * Lista de objetos de 
   * @example Tag[]
    */
    tag?: Tag[] | undefined
}