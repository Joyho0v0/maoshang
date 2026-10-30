<script setup lang="ts">
import PageState from '../ui/PageState.vue';
</script>

<template>
  <div class="page page--workspace">
    <section class="page-intro">
      <div>
        <p class="eyebrow">
          今天的业务脉搏
        </p>
        <h1>工作台骨架已就绪</h1>
        <p>这里将承接订单漏斗、回款提醒和客户跟进。本阶段先把安全边界和可替换的接口入口准备好。</p>
      </div>
      <span class="stage-badge">前端并行层</span>
    </section>
    <PageState
      state="empty"
      heading="还没有接入业务数据"
      message="真实契约冻结后，工作台会从同一个适配器读取客户、订单和待办。当前 fixture 只用于验证壳的状态表现。"
    />
  </div>
</template>
