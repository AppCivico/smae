# Documentação do Componente SmaeDialog

## Visão Geral

`SmaeDialog` é um componente de diálogo modal que integra-se com Vue Router para gerenciar sua visibilidade através de query parameters. O componente utiliza o elemento nativo `<dialog>` do HTML e oferece funcionalidades como confirmação de fechamento e gerenciamento automático de parâmetros de URL.

## Props

### `id` (obrigatória)

- **Tipo:** `String | Number`
- **Descrição:** Identificador único do diálogo. Usado para controlar a visibilidade através do query parameter `dialogo`.

### `titulo`

- **Tipo:** `String`
- **Padrão:** `''`
- **Descrição:** Título exibido no cabeçalho do diálogo. Pode ser substituído usando o slot `titulo`.

### `subtitulo`

- **Tipo:** `String`
- **Padrão:** `''`
- **Descrição:** Subtítulo exibido abaixo do título do diálogo. Pode ser substituído usando o slot `subtitulo`.

### `tamanhoAjustavel`

- **Tipo:** `Boolean`
- **Padrão:** `false`
- **Descrição:** Quando `true`, aplica a classe `editModal--tamanho-ajustavel` ao diálogo, permitindo dimensões personalizadas.

### `parametrosAssociados`

- **Tipo:** `Array<string>`
- **Padrão:** `[]`
- **Descrição:** Lista de query parameters que devem ser removidos da URL quando o diálogo for fechado. Útil para limpar parâmetros relacionados ao diálogo.

### `confirmarFechamento`

- **Tipo:** `Boolean`
- **Padrão:** `false`
- **Descrição:** Quando `true`, exibe uma confirmação antes de fechar o diálogo com a mensagem "Deseja sair sem salvar as alterações?".

## Eventos

### `@dialogo-fechado`

- **Descrição:** Emitido quando o diálogo é efetivamente fechado.
- **Quando é emitido:**
  - Após fechar o diálogo (sem `confirmarFechamento`)
  - Após o usuário confirmar o fechamento (com `confirmarFechamento="true"`)
- **Quando NÃO é emitido:**
  - Quando o usuário cancela a confirmação de fechamento

## Slots

### `default`

- **Descrição:** Conteúdo principal do diálogo.
- **Scoped Slot Props:**
  - `fecharDialogo` (Function): Função para fechar o diálogo programaticamente. Útil para fechar o diálogo após uma ação bem-sucedida (ex: salvar um formulário).

**Exemplo de uso do scoped slot:**

```vue
<SmaeDialog id="meu-dialogo" titulo="Formulário">
  <template #default="{ fecharDialogo }">
    <form @submit.prevent="salvar(fecharDialogo)">
      <input type="text" />
      <button type="submit">Salvar</button>
    </form>
  </template>
</SmaeDialog>

<script setup>
async function salvar(fecharFn) {
  await api.salvar();
  fecharFn(); // Fecha o diálogo após salvar
}
</script>
```

### `titulo`

- **Descrição:** Substitui o título padrão. Se não fornecido, usa a prop `titulo`.

### `subtitulo`

- **Descrição:** Substitui o subtítulo padrão. Se não fornecido, usa a prop `subtitulo`.

## Como Usar

### Exemplo Básico

```vue
<template>
  <SmaeDialog
    id="meu-dialogo"
    titulo="Adicionar Item"
  >
    <!-- Conteúdo do diálogo -->
    <form>
      <input type="text" placeholder="Nome" />
      <button type="submit">Salvar</button>
    </form>
  </SmaeDialog>
</template>

<script setup>
import SmaeDialog from '@/components/SmaeDialog.vue';
</script>
```

Para abrir este diálogo, navegue para a rota com o query parameter:

```javascript
router.push({ query: { dialogo: 'meu-dialogo' } });
```

### Exemplo com Confirmação de Fechamento

```vue
<SmaeDialog
  id="editar-item"
  titulo="Editar Item"
  :confirmar-fechamento="true"
>
  <form>
    <!-- campos do formulário -->
  </form>
</SmaeDialog>
```

### Exemplo com Parâmetros Associados

```vue
<SmaeDialog
  id="detalhes"
  titulo="Detalhes"
  :parametros-associados="['itemId', 'modo']"
>
  <!-- Ao fechar, remove ?dialogo=detalhes&itemId=123&modo=edicao -->
</SmaeDialog>
```

Para abrir com parâmetros:

```javascript
router.push({
  query: {
    dialogo: 'detalhes',
    itemId: '123',
    modo: 'edicao'
  }
});
```

### Exemplo com Título Personalizado (Slot)

```vue
<SmaeDialog id="custom">
  <template #titulo>
    <h2>
      <svg><use xlink:href="#i_info" /></svg>
      Título Personalizado
    </h2>
  </template>

  <p>Conteúdo do diálogo</p>
</SmaeDialog>
```

### Exemplo com Tamanho Ajustável

```vue
<SmaeDialog
  id="grande-dialogo"
  titulo="Diálogo Grande"
  :tamanho-ajustavel="true"
>
  <!-- Conteúdo extenso -->
</SmaeDialog>
```

### Exemplo com Atributos Nativos

O componente permite passar atributos nativos do `<dialog>` através de `v-bind`:

```vue
<SmaeDialog
  id="dialogo"
  titulo="Exemplo"
  class="minha-classe-custom"
  data-test="dialogo-teste"
>
  <!-- O componente usa inheritAttrs: false e aplica $attrs ao <dialog> -->
</SmaeDialog>
```

## Comportamento

1. **Abertura Automática:** O diálogo abre automaticamente quando `$route.query.dialogo` corresponde ao `id` da prop.

2. **Fechamento:** O diálogo pode ser fechado de três formas:
   - Clicando no botão X
   - Clicando fora do diálogo (backdrop)
   - Pressionando a tecla **ESC**
   - Todas as formas respeitam a prop `confirmarFechamento` e removem os query parameters da URL

3. **ID no DOM:** O elemento `<dialog>` recebe o ID `smae-dialog-{id}` no DOM, onde `{id}` é o valor da prop `id`.

4. **Teleport:** O diálogo é renderizado via `<Teleport to="#modais">`, movendo-o para um container específico no DOM.

5. **Modal Nativo:** Utiliza `showModal()` do elemento `<dialog>` nativo, garantindo comportamento padrão de modal (bloqueia interação com conteúdo abaixo).

6. **Navegação do Navegador:** O diálogo responde aos botões voltar/avançar do navegador, abrindo e fechando conforme a URL muda.

## Requisitos

- O HTML da aplicação deve ter um elemento com `id="modais"` para o Teleport funcionar
- O componente `TituloDaPagina` deve estar disponível globalmente
- O ícone SVG `#i_x` deve estar definido

## Integração com Router

O componente gerencia automaticamente a URL através do Vue Router:

- **Abre quando:** `?dialogo=<id>` está presente na URL
- **Fecha removendo:** o query parameter `dialogo` e todos os `parametrosAssociados`

Isso permite que o estado do diálogo seja compartilhável via URL e funcione com navegação (voltar/avançar do navegador).

## Classes CSS Disponíveis

### `.largura-total`

Classe utilitária que pode ser aplicada via `$attrs` para diálogos que precisam ocupar toda a largura disponível:

```vue
<SmaeDialog
  id="dialogo-largo"
  titulo="Diálogo Largo"
  class="largura-total"
>
  <!-- Conteúdo -->
</SmaeDialog>
```

## Avisos de Desenvolvimento

Em modo de desenvolvimento (`import.meta.env.DEV`), o componente emite avisos no console para ajudar a identificar problemas:

### IDs Duplicados

Se múltiplos componentes `SmaeDialog` com o mesmo `id` forem detectados:

```text
[SmaeDialog] Múltiplos componentes SmaeDialog com id="meu-dialogo" detectados.
Isso pode causar conflitos de ID no DOM. Certifique-se de usar IDs únicos para cada diálogo.
```

**Solução:** Use IDs únicos para cada diálogo na aplicação.

### Elemento #modais Não Encontrado

Se o elemento `#modais` não existir no DOM:

```text
[SmaeDialog] Elemento #modais não encontrado no DOM
```

**Solução:** Adicione um elemento com `id="modais"` no HTML da aplicação.

## Notas Importantes

- **IDs Únicos:** Cada diálogo deve ter um `id` único na aplicação para evitar conflitos
- **Apenas um diálogo por vez:** Embora tecnicamente possível ter múltiplos diálogos abertos, recomenda-se apenas um por vez para melhor UX
- **Compatibilidade:**
  - O componente usa `structuredClone()` para clonar query parameters, que requer navegadores modernos
  - O atributo `closedby="any"` é usado para fechar o diálogo ao clicar fora, mas não é suportado no Safari. Um elemento de backdrop é usado como fallback para garantir compatibilidade
- **Acessibilidade:** O botão de fechar possui `aria-label="Fechar diálogo"` para melhor acessibilidade
