<template>
  <div class="loading-02" role="status" aria-live="polite" aria-label="页面加载中">
    <div class="loading-02__wrap">
      <img src="/favicon.svg" class="loading-02__logo" alt="Logo" draggable="false" />
      <div class="loading-02__item">
        <div class="loading-02__outter"></div>
        <div class="loading-02__inner"></div>
      </div>
      <div class="loading-02__title">{{ appTitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.loading-02 {
  --loading-bg: #eef3f8;
  --loading-grid: rgb(0 101 204 / 9%);
  --loading-glow-a: rgb(0 101 204 / 22%);
  --loading-glow-b: rgb(0 101 204 / 18%);
  --loading-title: rgb(0 0 0 / 85%);
  --loading-bar: #0065cc;
  --loading-bar-light: #7fb3e8;

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  background:
    linear-gradient(var(--loading-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--loading-grid) 1px, transparent 1px),
    radial-gradient(circle 240px at 12% 8%, var(--loading-glow-a), transparent 70%),
    radial-gradient(circle 280px at 88% 92%, var(--loading-glow-b), transparent 70%),
    var(--loading-bg);
  background-size: 24px 24px, 24px 24px, auto, auto, auto;

  &__wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  &__logo {
    width: 52px;
    border-radius: 50%;
    filter: drop-shadow(0 6px 14px rgb(0 101 204 / 25%));
    animation: loading-02-logo-float 2.4s ease-in-out infinite;
  }

  &__item {
    position: relative;
    width: 44px;
    height: 44px;
    margin-top: 16px;
  }

  &__outter {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 3px solid var(--loading-bar);
    border-bottom: 0;
    border-left-color: transparent;
    border-radius: 50%;
    animation: loading-02-outter 1s cubic-bezier(0.42, 0.61, 0.58, 0.41) infinite;
  }

  &__inner {
    position: absolute;
    top: calc(50% - 14px);
    left: calc(50% - 14px);
    width: 28px;
    height: 28px;
    border: 3px solid var(--loading-bar-light);
    border-right: 0;
    border-top-color: transparent;
    border-radius: 50%;
    animation: loading-02-inner 1s cubic-bezier(0.42, 0.61, 0.58, 0.41) infinite;
  }

  &__title {
    margin-top: 16px;
    color: var(--loading-title);
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    white-space: nowrap;
  }

}

html.dark .loading-02 {
  --loading-bg: #141414;
  --loading-grid: rgb(255 255 255 / 6%);
  --loading-glow-a: rgb(0 101 204 / 35%);
  --loading-glow-b: rgb(0 101 204 / 28%);
  --loading-title: rgb(255 255 255 / 88%);
  --loading-bar: #4d9fff;
  --loading-bar-light: #8ec4ff;
}

@keyframes loading-02-logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes loading-02-outter {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-02-inner {
  to {
    transform: rotate(-360deg);
  }
}
</style>
