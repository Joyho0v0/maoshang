<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink, useRoute } from 'vue-router';

import PageState from '../ui/PageState.vue';
import { canUsePageCapability, listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

const route = useRoute();
const api = useDomainApi();
const id = computed(() => routeString(route.params.id) ?? '');
const query = useQuery({ queryKey: computed(() => ['product', id.value]), queryFn: () => api.getProduct(id.value), enabled: computed(() => id.value.length > 0) });
const product = computed(() => query.data.value?.data);
const state = computed(() => listState(query.isPending.value, product.value ? 1 : 0, query.error.value));
const copy = computed(() => pageStateMessage(state.value));
</script>

<template>
  <div class="page domain-page">
    <RouterLink
      class="back-link"
      to="/catalog"
    >
      ← 返回商品目录
    </RouterLink>
    <PageState
      v-if="state !== 'ready'"
      :state="state"
      :heading="copy.heading"
      :message="copy.message"
      :request-id="problemRequestId(query.error.value)"
      action-label="重新加载"
      @action="query.refetch"
    />
    <template v-else-if="product">
      <section class="page-intro domain-page__intro">
        <div>
          <p class="eyebrow">
            标准目录件
          </p><h1>{{ product.name }}</h1><p>{{ product.productCode }} · {{ product.unit }}</p>
        </div>
        <RouterLink
          v-if="canUsePageCapability(api, 'product.update')"
          class="button button--quiet"
          :to="`/catalog/products/${product.id}/edit`"
        >
          编辑商品
        </RouterLink>
      </section>
      <section class="detail-grid">
        <article class="detail-card">
          <h2>商品信息</h2><dl><div><dt>状态</dt><dd>{{ product.status }}</dd></div><div><dt>单位</dt><dd>{{ product.unit }}</dd></div><div><dt>分类</dt><dd>{{ product.categoryId ?? '未提供' }}</dd></div></dl>
        </article>
        <article class="detail-card">
          <h2>说明</h2><p>{{ product.description ?? '未提供描述。' }}</p><p class="muted-copy">
            商品详情不推导库存；库存由后续纵切负责。
          </p>
        </article>
      </section>
    </template>
  </div>
</template>
