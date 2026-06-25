<script setup>
import { Extension } from '@tiptap/core';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';
import {
  defineOptions,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue';

import iconDiminuirRecuo from './assets/ic--round-format-indent-decrease.svg?raw';
import iconAumentarRecuo from './assets/ic--round-format-indent-increase.svg?raw';
import iconCorDeFundo from './assets/jam--background-color.svg?raw';
import iconCorDeTexto from './assets/jam--color.svg?raw';
import iconListaComMarcadores from './assets/material-symbols--format-list-bulleted-rounded.svg?raw';
import iconListaNumerada from './assets/material-symbols--format-list-numbered-rounded.svg?raw';
import iconLink from './assets/material-symbols--link-rounded.svg?raw';
import iconInserirTabela from './assets/material-symbols--table-outline.svg?raw';
import iconFamiliaFonte from './assets/mingcute--font-line.svg?raw';
import iconAlinharCentro from './assets/quill--text-center.svg?raw';
import iconAlinharJustificado from './assets/quill--text-justify.svg?raw';
import iconAlinharEsquerda from './assets/quill--text-left.svg?raw';
import iconAlinharDireita from './assets/quill--text-right.svg?raw';
import iconFonte from './assets/raphael--font.svg?raw';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions: () => ({ types: ['textStyle'] }),
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: ({ fontSize }) => (fontSize ? { style: `font-size:${fontSize}` } : {}),
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size) => ({ chain }) => chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }) => chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];

const INDENTABLE_NODES = ['paragraph', 'heading', 'blockquote'];
const MAX_INDENT = 8;

const Indent = Extension.create({
  name: 'indent',
  addGlobalAttributes() {
    return [{
      types: INDENTABLE_NODES,
      attributes: {
        indent: {
          default: 0,
          renderHTML: ({ indent }) => (indent ? { style: `margin-left:${indent * 2}rem` } : {}),
          parseHTML: (el) => {
            const ml = el.style.marginLeft;
            return ml ? Math.round(Number.parseFloat(ml) / 2) : 0;
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (INDENTABLE_NODES.includes(node.type.name)) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              indent: Math.min((node.attrs.indent || 0) + 1, MAX_INDENT),
            });
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { from, to } = state.selection;
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (INDENTABLE_NODES.includes(node.type.name)) {
            const current = node.attrs.indent || 0;
            if (current > 0) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: current - 1 });
            }
          }
        });
        if (dispatch) dispatch(tr);
        return true;
      },
    };
  },
});

const FONT_FACES = [
  { label: 'Padrão', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: String,
    default: null,
  },
  value: {
    type: String,
    default: null,
  },
});
const emit = defineEmits(['update:modelValue', 'change']);
const editor = shallowRef(null);

const showTableMenu = ref(false);
const tableButtonRef = ref(null);
const tableDropdownFlipped = ref(false);

function closeTableMenu() {
  if (showTableMenu.value) {
    showTableMenu.value = false;
  }
}

const DROPDOWN_MIN_WIDTH_REM = 14;

function updateTableMenuAlignment() {
  if (!tableButtonRef.value) {
    return;
  }

  const { left } = tableButtonRef.value.getBoundingClientRect();

  const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  tableDropdownFlipped.value = left + DROPDOWN_MIN_WIDTH_REM * remPx > window.innerWidth;
}

const dashboardObserver = new ResizeObserver(updateTableMenuAlignment);

onMounted(() => {
  document.addEventListener('click', closeTableMenu);
  const dashboard = document.querySelector('#dashboard');

  if (dashboard) {
    dashboardObserver.observe(dashboard);
  }

  updateTableMenuAlignment();

  editor.value = new Editor({
    extensions: [
      StarterKit,
      Indent,
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false }),
      FontFamily,
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: props.modelValue ?? props.value,
    onUpdate: () => {
      // @see https://github.com/ueberdosis/tiptap/issues/154#issuecomment-2182692943
      const content = editor.value.getText() ? editor.value.getHTML() : '';

      emit('update:modelValue', content);
      emit('change', content);
    },
    onBlur: () => {
      const content = editor.value.getText() ? editor.value.getHTML() : '';

      emit('update:modelValue', content);
      emit('change', content);
    },
  });
});

onBeforeUnmount(() => {
  editor.value.destroy();
  document.removeEventListener('click', closeTableMenu);
  dashboardObserver.disconnect();
});

watch(() => [props.modelValue, props.value], ([newModelValue, newValue]) => {
  if (editor.value.isFocused) return;

  const value = newModelValue ?? newValue;
  if (value == null) return;

  const isSame = editor.value.getHTML() === value
    || (value === '' && editor.value.getText() === '');
  if (!isSame) {
    editor.value.commands.setContent(value, false);
  }
});

const showLinkInput = ref(false);
const linkUrl = ref('');
const linkText = ref('');
const linkHasSelection = ref(false);
const linkInputRef = ref(null);
const linkUrlRef = ref(null);

function toggleLink() {
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run();
    return;
  }
  linkHasSelection.value = !editor.value.state.selection.empty;
  linkUrl.value = editor.value.getAttributes('link').href || '';
  linkText.value = '';
  showLinkInput.value = true;
  nextTick(() => linkInputRef.value?.focus());
}

function applyLink() {
  if (!showLinkInput.value) return;
  showLinkInput.value = false;
  if (linkUrl.value) {
    if (linkHasSelection.value) {
      editor.value.chain().focus().setLink({ href: linkUrl.value }).run();
    } else if (linkText.value) {
      editor.value.chain().focus().insertContent({
        type: 'text',
        text: linkText.value,
        marks: [{ type: 'link', attrs: { href: linkUrl.value } }],
      }).run();
    }
  }
  linkUrl.value = '';
  linkText.value = '';
}

function setFontSize(e) {
  const size = e.target.value;
  if (size) {
    editor.value.chain().focus().setFontSize(size).run();
  } else {
    editor.value.chain().focus().unsetFontSize().run();
  }
}

function doIndent() {
  if (editor.value.can().sinkListItem('listItem')) {
    editor.value.chain().focus().sinkListItem('listItem').run();
  } else {
    editor.value.chain().focus().indent().run();
  }
}

function doOutdent() {
  if (editor.value.can().liftListItem('listItem')) {
    editor.value.chain().focus().liftListItem('listItem').run();
  } else {
    editor.value.chain().focus().outdent().run();
  }
}

function setFontFamily(e) {
  const font = e.target.value;
  if (font) {
    editor.value.chain().focus().setFontFamily(font).run();
  } else {
    editor.value.chain().focus().unsetFontFamily().run();
  }
}
</script>
<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    v-if="editor"
    class="menueditor"
  >
    <div class="control-group">
      <div class="button-group">
        <button
          type="button"
          :disabled="!editor.can().chain().focus().toggleBold().run()"
          class="editorbt w700"
          title="Negrito"
          :class="{ 'is-active': editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()"
        >
          N
        </button>
        <button
          type="button"
          :disabled="!editor.can().chain().focus().toggleItalic().run()"
          class="editorbt i mono"
          title="Itálico"
          :class="{ 'is-active': editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()"
        >
          I
        </button>
        <button
          type="button"
          :disabled="!editor.can().chain().focus().toggleUnderline().run()"
          class="editorbt u"
          title="Sublinhado"
          :class="{ 'is-active': editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()"
        >
          U
        </button>
        <button
          type="button"
          :disabled="!editor.can().chain().focus().toggleStrike().run()"
          class="editorbt c"
          title="Tachado"
          :class="{ 'is-active': editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()"
        >
          S
        </button>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Lista com marcadores"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()"
        >
          <span v-html="iconListaComMarcadores" />
        </button>
        <button
          type="button"
          class="editorbt"
          title="Lista numerada"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()"
        >
          <span v-html="iconListaNumerada" />
        </button>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Sobrescrito"
          :class="{ 'is-active': editor.isActive('superscript') }"
          @click="editor.chain().focus().toggleSuperscript().run()"
        >
          x<sup>2</sup>
        </button>
        <button
          type="button"
          class="editorbt"
          title="Subscrito"
          :class="{ 'is-active': editor.isActive('subscript') }"
          @click="editor.chain().focus().toggleSubscript().run()"
        >
          x<sub>2</sub>
        </button>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          :class="{ 'is-active': editor.isActive('link') }"
          :title="editor.isActive('link') ? 'Remover link' : 'Inserir link'"
          @click="toggleLink"
        >
          <span v-html="iconLink" />
        </button>
        <template v-if="showLinkInput">
          <input
            v-if="!linkHasSelection"
            ref="linkInputRef"
            v-model="linkText"
            type="text"
            class="link-input"
            aria-label="Texto do link"
            placeholder="Texto do link..."
            @keydown.enter.prevent="linkUrlRef?.focus()"
            @keydown.escape="showLinkInput = false"
          >
          <input
            :ref="linkHasSelection ? 'linkInputRef' : 'linkUrlRef'"
            v-model="linkUrl"
            type="url"
            class="link-input"
            aria-label="URL do link"
            placeholder="https://..."
            @keydown.enter.prevent="applyLink"
            @keydown.escape="showLinkInput = false"
            @blur="applyLink"
          >
        </template>
      </div>
      <div class="button-group">
        <label
          class="editorbt editorbt--select-group"
          title="Família da fonte"
        >
          <span
            aria-hidden="true"
            v-html="iconFamiliaFonte"
          />
          <select
            aria-label="Família da fonte"
            :value="editor.getAttributes('textStyle').fontFamily || ''"
            @change="setFontFamily"
          >
            <option
              v-for="font in FONT_FACES"
              :key="font.value"
              :value="font.value"
              :style="font.value ? `font-family:${font.value}` : ''"
            >
              {{ font.label }}
            </option>
          </select>
        </label>
        <label
          class="editorbt editorbt--select-group"
          title="Tamanho da fonte"
        >
          <span
            aria-hidden="true"
            v-html="iconFonte"
          />
          <select
            aria-label="Tamanho da fonte"
            :value="editor.getAttributes('textStyle').fontSize || ''"
            @change="setFontSize"
          >
            <option value="">
              —
            </option>
            <option
              v-for="size in FONT_SIZES"
              :key="size"
              :value="size + 'pt'"
            >
              {{ size }}
            </option>
          </select>
        </label>
      </div>
      <div class="button-group">
        <label
          class="editorbt editorbt--colorpicker"
          title="Cor do texto"
          aria-label="Cor do texto"
        >
          <span v-html="iconCorDeTexto" />
          <input
            type="color"
            :value="editor.getAttributes('textStyle').color || '#000000'"
            @change="e => editor.chain().focus().setColor(e.target.value).run()"
          >
        </label>
        <label
          class="editorbt editorbt--colorpicker"
          title="Cor de fundo"
          aria-label="Cor de fundo"
        >
          <span v-html="iconCorDeFundo" />
          <input
            type="color"
            :value="editor.getAttributes('highlight').color || '#ffff00'"
            @change="e => editor.chain().focus().setHighlight({ color: e.target.value }).run()"
          >
        </label>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Alinhar à esquerda"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()"
        >
          <span v-html="iconAlinharEsquerda" />
        </button>
        <button
          type="button"
          class="editorbt"
          title="Alinhar ao centro"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()"
        >
          <span v-html="iconAlinharCentro" />
        </button>
        <button
          type="button"
          class="editorbt"
          title="Alinhar à direita"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()"
        >
          <span v-html="iconAlinharDireita" />
        </button>
        <button
          type="button"
          class="editorbt"
          title="Alinhar justificado"
          :class="{ 'is-active': editor.isActive({ textAlign: 'justify' }) }"
          @click="editor.chain().focus().setTextAlign('justify').run()"
        >
          <span v-html="iconAlinharJustificado" />
        </button>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Aumentar recuo"
          @click="doIndent"
        >
          <span v-html="iconAumentarRecuo" />
        </button>
        <button
          type="button"
          class="editorbt"
          title="Diminuir recuo"
          @click="doOutdent"
        >
          <span v-html="iconDiminuirRecuo" />
        </button>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Quebra de linha"
          @click="editor.chain().focus().setHardBreak().run()"
        >
          &crarr;
        </button>
      </div>
      <div class="button-group">
        <div
          class="table-menu"
          @click.stop
        >
          <button
            ref="tableButtonRef"
            type="button"
            class="editorbt"
            :class="{ 'is-active': editor.isActive('table') || showTableMenu }"
            title="Tabela"
            @click="showTableMenu = !showTableMenu"
          >
            <span v-html="iconInserirTabela" />
          </button>
          <div
            v-if="showTableMenu"
            class="table-dropdown"
            :class="{ 'table-dropdown--flipped': tableDropdownFlipped }"
            @click="showTableMenu = false"
          >
            <div class="table-dropdown__group">
              <button
                type="button"
                class="table-dropdown__bt"
                @click="editor.chain().focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                "
              >
                Inserir tabela
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().deleteTable()"
                @click="editor.chain().focus().deleteTable().run()"
              >
                Excluir tabela
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().fixTables()"
                @click="editor.chain().focus().fixTables().run()"
              >
                Corrigir tabelas
              </button>
            </div>
            <div class="table-dropdown__group">
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().addColumnBefore()"
                @click="editor.chain().focus().addColumnBefore().run()"
              >
                Adicionar coluna antes
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().addColumnAfter()"
                @click="editor.chain().focus().addColumnAfter().run()"
              >
                Adicionar coluna depois
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().deleteColumn()"
                @click="editor.chain().focus().deleteColumn().run()"
              >
                Excluir coluna
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().toggleHeaderColumn()"
                @click="editor.chain().focus().toggleHeaderColumn().run()"
              >
                Alternar como cabeçalho de coluna
              </button>
            </div>
            <div class="table-dropdown__group">
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().addRowBefore()"
                @click="editor.chain().focus().addRowBefore().run()"
              >
                Adicionar linha antes
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().addRowAfter()"
                @click="editor.chain().focus().addRowAfter().run()"
              >
                Adicionar linha depois
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().deleteRow()"
                @click="editor.chain().focus().deleteRow().run()"
              >
                Excluir linha
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().toggleHeaderRow()"
                @click="editor.chain().focus().toggleHeaderRow().run()"
              >
                Alternar como cabeçalho de linha
              </button>
            </div>
            <div class="table-dropdown__group">
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().mergeCells()"
                @click="editor.chain().focus().mergeCells().run()"
              >
                Mesclar células
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().splitCell()"
                @click="editor.chain().focus().splitCell().run()"
              >
                Dividir célula
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().mergeOrSplit()"
                @click="editor.chain().focus().mergeOrSplit().run()"
              >
                Mesclar ou dividir
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().toggleHeaderCell()"
                @click="editor.chain().focus().toggleHeaderCell().run()"
              >
                Alternar como célula de cabeçalho
              </button>
            </div>
            <div class="table-dropdown__group">
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().goToPreviousCell()"
                @click="editor.chain().focus().goToPreviousCell().run()"
              >
                Célula anterior
              </button>
              <button
                type="button"
                class="table-dropdown__bt"
                :disabled="!editor.can().goToNextCell()"
                @click="editor.chain().focus().goToNextCell().run()"
              >
                Próxima célula
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="button-group">
        <button
          type="button"
          class="editorbt"
          title="Limpar formatação"
          @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
        >
          Limpar formatação
        </button>
      </div>
    </div>
  </div>
  <div
    class="contentStyle tiptap"
    v-bind="$attrs"
  >
    <editor-content :editor="editor" />
  </div>
</template>
<style lang="less" scoped>
.menueditor {
  background: @primary;
  color: white;
  padding: .25rem;
}

.control-group {
  display: flex;
  margin-bottom: .5rem;
  flex-wrap: wrap;
}

.button-group {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;

  &::after {
    position: absolute;
    top: .5rem;
    bottom: .5rem;
    right: 0;
    content: "";
    display: block;
    border-right: 1px solid;
    opacity: .35;
  }

  &:last-child {
    &::after {
      content: none;
    }
  }
}

.editorbt {
  padding: .5rem;
  display: inline-block;
  min-width: 1.5rem;
  text-align: center;
  border: 0;
  background: transparent;

:deep(svg) {
    width: 1.25rem;
    height: 1.25rem;
  }

  &:hover {
    color: @c100;
  }

  &.is-active {
    color: @amarelo;
  }

  &.mono {
    font-family: 'Roboto Mono', monospace;
  }

  &.u {
    text-decoration: underline;
    text-decoration-color: @amarelo;
  }

  &.c {
    text-decoration: line-through;
    text-decoration-color: @amarelo;
  }

  sup,
  sub {
    color: @amarelo;
  }
}

.editorbt--select-group {
  display: inline-flex;
  align-items: center;
  padding: 0;
  cursor: pointer;

  > span {
    padding: .5rem .25rem .5rem .5rem;
  }

  select {
    padding: .5rem .5rem .5rem .25rem;
    background: transparent;
    border: 0;
    color: inherit;
    font-size: inherit;
    cursor: pointer;
  }

  option {
    background-color: @branco;
    color: @escuro;
  }
}

.editorbt--larger {
  font-size: larger;
  line-height: 0.5;
}

.editorbt--colorpicker {
  position: relative;
  cursor: pointer;

  input[type="color"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
  }
}

.link-input {
  background: transparent;
  border: 0;
  border-bottom: 1px solid @c300;
  color: inherit;
  font-size: inherit;
  padding: .25rem .5rem;
  width: 12rem;

  &::placeholder {
    color: @c400;
    opacity: 1;
  }
}
.table-menu {
  position: relative;
}

.table-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;

  &--flipped {
    left: auto;
    right: 0;
  }

  background: @primary;
  border: 1px solid rgba(255, 255, 255, .15);
  border-radius: .25rem;
  padding: .25rem;
  min-width: 14rem;
  display: flex;
  flex-direction: column;
}

.table-dropdown__group {
  display: flex;
  flex-direction: column;

  & + & {
    margin-top: .25rem;
    padding-top: .25rem;
    border-top: 1px solid rgba(255, 255, 255, .15);
  }
}

.table-dropdown__bt {
  display: flex;
  align-items: center;
  gap: .5rem;
  width: 100%;
  text-align: left;
  padding: .375rem .5rem;
  border: 0;
  background: transparent;
  color: white;
  border-radius: .2rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, .1);
  }

  &:disabled {
    cursor: default;
  }
}
</style>
<style lang="less">
/* Basic editor styles */
.tiptap {
  :first-child {
    margin-top: 0;
  }

  /* List styles */
  ul,
  ol {
    padding: 0 1rem;
    margin: 1.25rem 1rem 1.25rem 0.4rem;

    li p {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
  }

  /* Heading styles */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    line-height: 1.1;
    margin-top: 2.5rem;
    text-wrap: pretty;
  }

  h1,
  h2 {
    margin-top: 3.5rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.4rem;
  }

  h2 {
    font-size: 1.2rem;
  }

  h3 {
    font-size: 1.1rem;
  }

  h4,
  h5,
  h6 {
    font-size: 1rem;
  }

  /* Code and preformatted text styles */
  code {
    background-color: @cinza-claro;
    border-radius: 0.4rem;
    color: @escuro;
    font-size: 0.85rem;
    padding: 0.25em 0.3em;
  }

  pre {
    background: @escuro;
    border-radius: 0.5rem;
    color: @branco;
    font-family: 'JetBrainsMono', monospace;
    margin: 1.5rem 0;
    padding: 0.75rem 1rem;

    code {
      background: none;
      color: inherit;
      font-size: 0.8rem;
      padding: 0;
    }
  }

  blockquote {
    border-left: 3px solid @c300;
    margin: 1.5rem 0;
    padding-left: 1rem;
  }

  hr {
    border: none;
    border-top: 1px solid @c200;
    margin: 2rem 0;
  }

  /* Table-specific styling */
  table {
    td,
    th {
      border: 1px solid @c300;
      box-sizing: border-box;
      min-width: 1em;
      position: relative;
      vertical-align: top;

      > * {
        margin-bottom: 0;
      }
    }

    th {
      background-color: @c100;
      font-weight: bold;
      text-align: left;
    }

    .selectedCell:after {
      background: @c200;
      content: "";
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      pointer-events: none;
      position: absolute;
      z-index: 2;
    }

    .column-resize-handle {
      background-color: @azul;
      bottom: -2px;
      pointer-events: none;
      position: absolute;
      right: -2px;
      top: 0;
      width: 4px;
    }
  }

  .tableWrapper {
    margin: 1.5rem 0;
    overflow-x: auto;
  }

  &.resize-cursor {
    cursor: ew-resize;
    cursor: col-resize;
  }
}
</style>
