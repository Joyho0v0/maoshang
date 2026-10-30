<script setup lang="ts">
import PageState, {
  type PageStateHeadingLevel,
  type PageStateKind,
} from './PageState.vue';

interface Props {
  state: PageStateKind;
  heading: string;
  message: string;
  actionLabel?: string;
  headingLevel?: PageStateHeadingLevel;
  requestId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  actionLabel: '',
  headingLevel: 2,
  requestId: '',
});
const emit = defineEmits<{ action: [] }>();
</script>

<template>
  <PageState
    v-bind="props"
    @action="emit('action')"
  />
</template>
