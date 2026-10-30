<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

import { formErrorId } from './form-error';

interface FormError {
  readonly field: string;
  readonly message: string;
}

interface Props {
  errors: readonly FormError[];
  heading?: string;
}

const props = withDefaults(defineProps<Props>(), { heading: '请检查以下内容' });
type HtmlElement = InstanceType<typeof globalThis.HTMLElement>;
const summary = ref<HtmlElement>();

watch(() => props.errors.length, (length, previousLength) => {
  if (previousLength === 0 && length > 0) {
    void nextTick(() => summary.value?.focus());
  }
});

</script>

<template>
  <section
    v-if="errors.length > 0"
    ref="summary"
    class="form-error-summary"
    role="alert"
    aria-live="assertive"
    tabindex="-1"
  >
    <h2>{{ heading }}</h2>
    <ul>
      <li
        v-for="error in errors"
        :key="error.field"
      >
        <a
          :id="formErrorId(error.field)"
          :href="`#${error.field}`"
        >
          {{ error.message }}
        </a>
      </li>
    </ul>
  </section>
</template>
