<script setup lang="ts">
import Dialog from './Dialog.vue';

interface Props {
  open: boolean;
  title?: string;
  currentVersion?: number;
  currentEtag?: string;
  requestId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '内容已更新',
  currentVersion: 0,
  currentEtag: '',
  requestId: '',
});
const emit = defineEmits<{ refresh: []; close: [] }>();
</script>

<template>
  <Dialog
    :open="open"
    :title="props.title"
    @close="emit('close')"
  >
    <p>服务器上的内容已经变化。请刷新后重做你的操作。</p>
    <p
      v-if="props.currentVersion > 0"
      class="conflict-dialog__version"
    >
      当前版本：{{ props.currentVersion }}
    </p>
    <p
      v-if="props.currentEtag"
      class="conflict-dialog__version"
    >
      当前 ETag：{{ props.currentEtag }}
    </p>
    <p
      v-if="props.requestId"
      class="conflict-dialog__request-id"
    >
      请求编号：{{ props.requestId }}
    </p>
    <template #actions>
      <button
        class="button"
        type="button"
        aria-label="刷新后重做"
        @click="emit('refresh')"
      >
        刷新后重做
      </button>
    </template>
  </Dialog>
</template>
