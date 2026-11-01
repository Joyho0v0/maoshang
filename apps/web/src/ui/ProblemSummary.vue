<script setup lang="ts">
import type { ProblemDetails } from '../core/types';

interface Props {
  problem: ProblemDetails;
}

defineProps<Props>();
</script>

<template>
  <section
    class="problem-summary"
    role="alert"
    aria-live="assertive"
  >
    <p class="eyebrow">
      请求未完成
    </p>
    <h2>{{ problem.title }}</h2>
    <p
      v-if="problem.code"
      class="problem-summary__code"
    >
      {{ problem.code }}
    </p>
    <ul
      v-if="problem.violations && problem.violations.length > 0"
      class="problem-summary__violations"
    >
      <li
        v-for="violation in problem.violations"
        :key="`${violation.field}-${violation.code}`"
      >
        <strong>{{ violation.field }}</strong>：{{ violation.message }}
      </li>
    </ul>
    <p
      v-if="problem.requestId"
      class="problem-summary__request-id"
    >
      请求编号：{{ problem.requestId }}
    </p>
  </section>
</template>
