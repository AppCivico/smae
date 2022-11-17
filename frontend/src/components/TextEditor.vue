<script setup>
  import { ref } from 'vue';
  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'
  
  const props = defineProps(['class','modelValue']);
  const emit = defineEmits(['update:modelValue']);
  const editor = useEditor({
    content: props.modelValue,
    extensions: [
      StarterKit,
    ],
    onUpdate: ({editor}) => {
      emit('update:modelValue', editor.getHTML())
    },
    onCreate: ({editor}) =>{
      editor.commands.setContent(props.modelValue);
    },
  });
</script>
<template>
  <div class="menueditor" v-if="editor">
    <a @click="editor.chain().focus().toggleBold().run()" 
      :disabled="!editor.can().chain().focus().toggleBold().run()" 
      class="editorbt w700"
      :class="{ 'is-active': editor.isActive('bold') }">N</a>
    <a @click="editor.chain().focus().toggleItalic().run()" 
      :disabled="!editor.can().chain().focus().toggleItalic().run()" 
      class="editorbt i"
      :class="{ 'is-active': editor.isActive('italic') }">It</a>
    <a @click="editor.chain().focus().toggleStrike().run()" 
      :disabled="!editor.can().chain().focus().toggleStrike().run()" 
      class="editorbt c" 
      :class="{ 'is-active': editor.isActive('strike') }">S</a>

    <a @click="editor.chain().focus().toggleBulletList().run()" 
      class="editorbt"
      :class="{ 'is-active': editor.isActive('bulletList') }">&bull;</a>
    <a @click="editor.chain().focus().toggleOrderedList().run()" 
      class="editorbt"
      :class="{ 'is-active': editor.isActive('orderedList') }">1.</a>
    <a @click="editor.chain().focus().setHardBreak().run()" 
      class="editorbt c" >&crarr;</a>

    <a class="editorbt" @click="editor.chain().focus().unsetAllMarks().clearNodes().run()">
      Limpar formatação
    </a>
  </div>
  <div class="contentStyle" :class="class">
    <editor-content :editor="editor" />
  </div>
</template>