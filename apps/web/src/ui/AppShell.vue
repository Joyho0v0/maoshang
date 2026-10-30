<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
</script>

<template>
  <a
    class="skip-link"
    href="#main-content"
  >跳到主要内容</a>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand-lockup">
        <span
          class="brand-mark"
          aria-hidden="true"
        >A</span>
        <div>
          <strong>Autoflow</strong>
          <span>出口业务工作台</span>
        </div>
      </div>
      <nav aria-label="主导航">
        <p class="nav-label">
          工作区
        </p>
        <div class="nav-links">
          <RouterLink to="/workspace">
            工作台
          </RouterLink>
          <RouterLink to="/customers">
            客户
          </RouterLink>
          <RouterLink to="/catalog">
            商品目录
          </RouterLink>
          <RouterLink to="/orders">
            订单
          </RouterLink>
          <RouterLink to="/empty">
            待办中心
          </RouterLink>
          <RouterLink to="/loading">
            同步状态
          </RouterLink>
        </div>
      </nav>
      <div class="sidebar-footnote">
        <span
          class="status-dot status-dot--pending"
          aria-hidden="true"
        />
        <span>契约接入准备中</span>
      </div>
    </aside>

    <div class="shell-content">
      <header class="topbar">
        <div>
          <p class="eyebrow">
            Autoflow CRM · Stage 2
          </p>
          <p class="topbar-title">
            把每一次跟进，留在同一条业务线上
          </p>
        </div>
        <div
          class="identity-chip"
          aria-label="当前身份"
        >
          <span class="identity-chip__avatar">试</span>
          <span>演示工作区</span>
        </div>
      </header>
      <main
        id="main-content"
        tabindex="-1"
      >
        <RouterView />
      </main>
    </div>
  </div>
</template>
