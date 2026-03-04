# Router Helpers

## tiparPropsDeRota

Sempre que lidar com props de rotas, use a funcao `tiparPropsDeRota`:

```js
props: tiparPropsDeRota,
```

Esta funcao converte automaticamente os parametros da rota para os tipos corretos (string, boolean, number) e decodifica primitivas quando necessario.
