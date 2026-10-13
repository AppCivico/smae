import type { PsCicloFaseBlocoConfigDto } from '@back/pdm-ciclo/entities/ps-ciclo-fase.entity';

import {
  array,
  number,
  object,
  string,
} from './initSchema';

type Bloco = Pick<PsCicloFaseBlocoConfigDto, 'id' | 'rotulo'>;

type Opcoes = {
  aceitaTags?: boolean;
};

export const chaveDoBloco = (blocoId: number | string) => `bloco_${blocoId}`;

export default (blocos: Bloco[] = [], { aceitaTags = false }: Opcoes = {}) => object()
  .shape({
    blocos: object()
      .shape(blocos.reduce((acc, bloco) => {
        acc[chaveDoBloco(bloco.id)] = string()
          .label(bloco.rotulo)
          .max(10240)
          .required();

        return acc;
      }, {} as Record<string, ReturnType<typeof string>>)),
    ...(aceitaTags
      ? {
        // lista vazia também conta como fase preenchida
        tags: array()
          .label('Tags')
          .of(number())
          .max(100),
      }
      : {}),
  });
