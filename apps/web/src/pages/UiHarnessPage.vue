<script setup lang="ts">
import { ref } from 'vue';

import Dialog from '../ui/Dialog.vue';
import Drawer from '../ui/Drawer.vue';
import FormErrorSummary from '../ui/FormErrorSummary.vue';
import { formErrorId } from '../ui/form-error';

const dialogOpen = ref(false);
const drawerOpen = ref(false);
const errors = ref<readonly { field: string; message: string }[]>([]);

function submitForm(): void {
  errors.value = [{ field: 'customer-name', message: '请输入客户名称' }];
}
</script>

<template>
  <div class="page ui-harness-page">
    <section class="page-intro">
      <div>
        <p class="eyebrow">
          共享组件检查台
        </p>
        <h1>可访问交互基线</h1>
        <p>
          仅供本地 component/browser harness 使用，不承载业务数据。
        </p>
      </div>
    </section>

    <div class="ui-harness-page__actions">
      <button
        class="button"
        type="button"
        data-testid="open-dialog"
        @click="dialogOpen = true"
      >
        打开对话框
      </button>
      <button
        class="button button--quiet"
        type="button"
        data-testid="open-drawer"
        @click="drawerOpen = true"
      >
        打开抽屉
      </button>
      <button
        class="button button--quiet"
        type="button"
        data-testid="submit-form"
        @click="submitForm"
      >
        提交表单
      </button>
    </div>

    <FormErrorSummary :errors="errors" />
    <form
      class="ui-harness-page__form"
      @submit.prevent="submitForm"
    >
      <label for="customer-name">客户名称</label>
      <input
        id="customer-name"
        name="customer-name"
        type="text"
        :aria-invalid="errors.length > 0 ? 'true' : undefined"
        :aria-describedby="errors.length > 0 ? formErrorId('customer-name') : undefined"
      >
    </form>

    <Dialog
      :open="dialogOpen"
      title="可访问对话框"
      description="对话框描述会和可见标题建立唯一关联。"
      @close="dialogOpen = false"
    >
      <button
        class="button"
        type="button"
        @click="dialogOpen = false"
      >
        完成
      </button>
    </Dialog>
    <Drawer
      :open="drawerOpen"
      title="可访问抽屉"
      description="抽屉使用同样的焦点圈定和关闭恢复契约。"
      @close="drawerOpen = false"
    >
      <button
        class="button"
        type="button"
        @click="drawerOpen = false"
      >
        应用筛选
      </button>
    </Drawer>
  </div>
</template>
