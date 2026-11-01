<script setup lang="ts">
import { computed } from 'vue';
import { useQuery } from '@tanstack/vue-query';
import { RouterLink, useRoute } from 'vue-router';

import MoneyText from '../ui/MoneyText.vue';
import QuantityText from '../ui/QuantityText.vue';
import PageState from '../ui/PageState.vue';
import { asDecimalString } from '../core/formatters';
import { canUsePageCapability, listState, pageStateMessage, problemRequestId, routeString, useDomainApi } from './domain-page-helpers';

const route = useRoute();
const api = useDomainApi();
const id = computed(() => routeString(route.params.id) ?? '');
const query = useQuery({ queryKey: computed(() => ['sku', id.value]), queryFn: () => api.getSku(id.value), enabled: computed(() => id.value.length > 0) });
const sku = computed(() => query.data.value?.data);
const state = computed(() => listState(query.isPending.value, sku.value ? 1 : 0, query.error.value));
const copy = computed(() => pageStateMessage(state.value));
function decimal(value: string) { return asDecimalString(value); }
</script>

<template>
  <div class="page domain-page">
    <RouterLink
      class="back-link"
      to="/catalog?tab=catalog-skus"
    >
      ← 返回 SKU 列表
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
    <template v-else-if="sku">
      <section class="page-intro domain-page__intro">
        <div>
          <p class="eyebrow">
            SKU
          </p><h1>{{ sku.name }}</h1><p>{{ sku.skuCode }} · {{ sku.status }}</p>
        </div>
        <RouterLink
          v-if="canUsePageCapability(api, 'sku.update')"
          class="button button--quiet"
          :to="`/catalog/skus/${sku.id}/edit`"
        >
          编辑 SKU
        </RouterLink>
      </section>
      <section class="detail-grid">
        <article class="detail-card">
          <h2>计量与跟踪</h2><dl>
            <div>
              <dt>基础单位</dt><dd>
                {{ sku.baseUnit }}
              </dd>
            </div><div><dt>跟踪方式</dt><dd>{{ sku.trackingMode }}</dd></div><div>
              <dt>库存阈值</dt><dd>
                <QuantityText
                  :value="decimal(sku.lowStockThreshold)"
                  :unit="sku.unit"
                />
              </dd>
            </div>
          </dl>
        </article>
        <article class="detail-card">
          <h2>价格</h2><MoneyText
            v-if="sku.price"
            :value="decimal(sku.price)"
            currency="CNY"
          /><p v-else>
            未设置价格。
          </p><p class="muted-copy">
            价格与数量保持 DecimalString；页面不进行 JavaScript 浮点运算。
          </p>
        </article>
      </section>
    </template>
  </div>
</template>
