<template>
  <div class="loading-03" role="status" aria-live="polite" aria-label="页面加载中">
    <div class="loading-03__wrap">
      <div class="loading-03__loader"></div>
      <div class="loading-03__title">正在加载系统资源，请耐心等待</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.loading-03 {
  --loading-bg: #7171c6;
  --loading-ring: #fff;
  --loading-text: rgb(255 255 255 / 92%);

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  background: var(--loading-bg);

  &__loader {
    position: relative;
    width: 90px;
    height: 90px;
    border: 2px solid transparent;
    border-top-color: var(--loading-ring);
    border-radius: 50%;
    animation: loading-03-spin 2s linear infinite;

    &::before,
    &::after {
      content: '';
      position: absolute;
      border: 2px solid transparent;
      border-top-color: var(--loading-ring);
      border-radius: 50%;
    }

    &::before {
      inset: 5px;
      animation: loading-03-spin 3s linear infinite;
    }

    &::after {
      inset: 12px;
      animation: loading-03-spin 1.5s linear infinite;
    }
  }

  &__wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__title {
    color: var(--loading-text);
    font-size: 14px;
    line-height: 1.5;
    text-align: center;
  }

}

html.dark .loading-03 {
  --loading-bg: #2f2f52;
  --loading-text: rgb(255 255 255 / 85%);
}

@keyframes loading-03-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
