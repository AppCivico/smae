import decodificadorDePrimitivas from '@/helpers/decodificadorDePrimitivas';
import type { RouteLocation } from 'vue-router';

export default (route:RouteLocation) => {
  const props: Record<string, unknown> = {};

  Object.entries(route.params).forEach(([prop, value]) => {
    props[prop] = typeof value === 'object'
      ? value
      : decodificadorDePrimitivas(value);
  });

  return props;
};
