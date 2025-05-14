import decodificadorDePrimitivas from '@/helpers/decodificadorDePrimitivas';
import type { RouteLocation } from 'vue-router';

export type Tipos = {
  [key: string]: 'string' | 'boolean' | 'number';
};

export default (route:RouteLocation, tipos:Tipos = {}) => {
  const props: Record<string, unknown> = {};

  Object.entries(route.params).forEach(([prop, value]) => {
    switch (tipos[prop]) {
      case 'string':
        props[prop] = String(value);
        break;

      case 'boolean':
        props[prop] = ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
        break;

      case 'number': {
        props[prop] = Number.parseInt(String(value), 10);
        break;
      }

      default:
        props[prop] = typeof value === 'object'
          ? value
          : decodificadorDePrimitivas(value);
        break;
    }
  });

  return props;
};
