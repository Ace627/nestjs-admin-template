<template>
  <div class="loading-04" role="status" aria-live="polite" aria-label="页面加载中">
    <div class="loading-04__content">
      <div class="loading-04__badge">
        <img src="/favicon.svg" class="loading-04__logo" alt="Logo" draggable="false" />
      </div>

      <div class="loading-04__wordmark">
        <span class="loading-04__title">{{ appTitle }}</span><span class="loading-04__caret" aria-hidden="true"></span>
      </div>
      <div class="loading-04__label">SYSTEM BOOT SEQUENCE / V1.0</div>

      <div class="loading-04__rule" aria-hidden="true"></div>

      <div class="loading-04__log">
        <div v-for="(line, index) in bootLines" :key="line" class="loading-04__log-line" :style="{ animationDelay: `${420 + index * 130}ms` }">
          <span class="loading-04__prompt" aria-hidden="true">▸</span>
          <span class="loading-04__action">{{ line }}</span>
          <span class="loading-04__dots" aria-hidden="true"></span>
          <span class="loading-04__status">ok</span>
        </div>
      </div>
    </div>

    <div class="loading-04__index" aria-hidden="true">04 / 04</div>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
const bootLines = ['initialize runtime', 'mount modules', 'sync configuration', 'ready']
</script>

<style lang="scss" scoped>
.loading-04 {
  --boot-bg: #f5f4f0;
  --boot-ink: #1a1c1b;
  --boot-muted: #6c716d;
  --boot-line: rgb(26 28 27 / 14%);
  --boot-accent: var(--el-color-primary);
  --boot-grid: rgb(26 28 27 / 4%);
  --boot-ease: cubic-bezier(0.16, 1, 0.3, 1);

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8%;
  overflow: hidden;
  user-select: none;
  background:
    repeating-linear-gradient(0deg, transparent 0 23px, var(--boot-grid) 23px 24px),
    var(--boot-bg);
  font-family: 'JetBrains Mono', 'IBM Plex Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;

  // 颗粒质感，避免纸底/CRT 底纯色平铺
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.05;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__content {
    position: relative;
    z-index: 1;
    width: min(560px, 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  // 对角缺角框：只画左上与右下的 L 形角标，打破完整边框的呆板
  &__badge {
    width: 92px;
    height: 92px;
    display: grid;
    place-items: center;
    background:
      linear-gradient(var(--boot-ink), var(--boot-ink)) left top / 18px 1px no-repeat,
      linear-gradient(var(--boot-ink), var(--boot-ink)) left top / 1px 18px no-repeat,
      linear-gradient(var(--boot-ink), var(--boot-ink)) right bottom / 18px 1px no-repeat,
      linear-gradient(var(--boot-ink), var(--boot-ink)) right bottom / 1px 18px no-repeat;
    animation: loading-04-badge-in 720ms var(--boot-ease) both;
  }

  &__logo {
    width: 68px;
    height: 68px;
    object-fit: contain;
  }

  &__wordmark {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 22px;
    animation: loading-04-rise 680ms var(--boot-ease) 120ms both;
  }

  &__title {
    color: var(--boot-ink);
    font-size: clamp(24px, 3vw, 36px);
    font-weight: 700;
    line-height: 1.05;
    letter-spacing: -0.04em;
    white-space: nowrap;
  }

  &__caret {
    flex: none;
    width: 10px;
    height: 1em;
    background: var(--boot-accent);
    animation: loading-04-caret 1s steps(1) infinite;
  }

  &__label {
    margin-top: 12px;
    color: var(--boot-muted);
    font-size: 10px;
    letter-spacing: 0.28em;
    animation: loading-04-rise 680ms var(--boot-ease) 200ms both;
  }

  &__rule {
    width: 100%;
    height: 1px;
    margin: 26px 0 18px;
    background: var(--boot-line);
    transform-origin: center;
    animation: loading-04-rule-in 640ms var(--boot-ease) 300ms both;
  }

  &__log {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 28px;
    width: 100%;
  }

  &__log-line {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 22px;
    color: var(--boot-muted);
    font-size: 11px;
    letter-spacing: 0.04em;
    animation: loading-04-log-in 420ms var(--boot-ease) both;
  }

  &__prompt {
    flex: none;
    color: var(--boot-accent);
  }

  &__action {
    flex: none;
  }

  &__dots {
    flex: 1;
    height: 1px;
    border-bottom: 1px dotted var(--boot-line);
  }

  &__status {
    flex: none;
    color: var(--boot-accent);
    font-weight: 700;
  }

  &__index {
    position: absolute;
    right: 20px;
    bottom: 16px;
    color: var(--boot-muted);
    font-size: 10px;
    letter-spacing: 0.2em;
    animation: loading-04-rise 680ms var(--boot-ease) 900ms both;
  }
}

html.dark .loading-04 {
  --boot-bg: #101312;
  --boot-ink: #e8ede9;
  --boot-muted: #8b948f;
  --boot-line: rgb(232 237 233 / 16%);
  --boot-accent: var(--el-color-primary-light-3);
  --boot-grid: rgb(0 119 255 / 7%);
}

@keyframes loading-04-badge-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes loading-04-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes loading-04-rule-in {
  from {
    opacity: 0;
    transform: scaleX(0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes loading-04-log-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes loading-04-caret {
  0%,
  49% {
    opacity: 1;
  }
  50%,
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-04,
  .loading-04 *,
  .loading-04 *::before,
  .loading-04 *::after {
    animation: none !important;
  }
}
</style>
