<script setup lang="ts">
interface FormError {
  readonly field: string;
  readonly message: string;
}

interface Props {
  errors: readonly FormError[];
  heading?: string;
}

withDefaults(defineProps<Props>(), { heading: '请检查以下内容' });
</script>

<template>
  <section
    v-if="errors.length > 0"
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
        <a :href="`#${error.field}`">{{ error.message }}</a>
      </li>
    </ul>
  </section>
</template>
