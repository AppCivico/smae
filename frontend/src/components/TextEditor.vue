<script setup>
import StarterKit from '@tiptap/starter-kit';
import { Editor, EditorContent } from '@tiptap/vue-3';
import {
  defineOptions,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  value: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);
const editor = ref(null);

onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
    ],
    content: props.modelValue || props.value,
    onUpdate: () => {
      // @see https://github.com/ueberdosis/tiptap/issues/154#issuecomment-2182692943
      const content = editor.value.getText() ? editor.value.getHTML() : '';

      emit('update:modelValue', content);
    },
  });
});

onBeforeUnmount(() => {
  editor.value.destroy();
});

watch(() => [props.modelValue, props.value], ([newModelValue, newValue]) => {
  const value = newModelValue || newValue;

  const isSame = editor.value.getHTML() === value;
  if (!isSame) {
    editor.value.commands.setContent(value, false);
  }
});
</script>
<template>
  <div
    v-if="editor"
    class="menueditor"
  >
    <a
      :disabled="!editor.can().chain().focus().toggleBold().run()"
      class="editorbt w700"
      :class="{ 'is-active': editor.isActive('bold') }"
      @click="editor.chain().focus().toggleBold().run()"
    >N</a>
    <a
      :disabled="!editor.can().chain().focus().toggleItalic().run()"
      class="editorbt i"
      :class="{ 'is-active': editor.isActive('italic') }"
      @click="editor.chain().focus().toggleItalic().run()"
    >It</a>
    <a
      :disabled="!editor.can().chain().focus().toggleStrike().run()"
      class="editorbt c"
      :class="{ 'is-active': editor.isActive('strike') }"
      @click="editor.chain().focus().toggleStrike().run()"
    >S</a>

    <a
      class="editorbt"
      :class="{ 'is-active': editor.isActive('bulletList') }"
      @click="editor.chain().focus().toggleBulletList().run()"
    >&bull;</a>
    <a
      class="editorbt"
      :class="{ 'is-active': editor.isActive('orderedList') }"
      @click="editor.chain().focus().toggleOrderedList().run()"
    >1.</a>
    <a
      class="editorbt c"
      @click="editor.chain().focus().setHardBreak().run()"
    >&crarr;</a>

    <a
      class="editorbt"
      @click="editor.chain().focus().unsetAllMarks().clearNodes().run()"
    >
      Limpar formatação
    </a>
  </div>
  <div
    class="contentStyle"
    v-bind="$attrs"
  >
    <editor-content :editor="editor" />
  </div>
</template>
