<template>
  <div class="loading-01" role="status" aria-live="polite" aria-label="页面加载中">
    <div class="loading-01__scene" aria-hidden="true">
      <svg class="loading-01__ridge" viewBox="0 0 1440 360" preserveAspectRatio="none" focusable="false">
        <path
          class="loading-01__ridge-far"
          d="M0 246 C100 232 180 210 250 168 C280 148 300 96 340 96 C390 96 420 168 480 186 C560 210 620 176 700 196 C760 210 800 150 860 142 C920 134 960 186 1040 200 C1120 214 1200 190 1280 204 C1360 216 1400 198 1440 200 L1440 360 L0 360 Z"
        />
        <path
          class="loading-01__ridge-mid"
          d="M0 292 C110 288 200 268 300 272 C390 276 440 236 520 226 C590 218 640 248 720 250 C800 252 850 196 930 192 C1000 190 1050 230 1130 242 C1220 256 1320 234 1440 240 L1440 360 L0 360 Z"
        />
        <path class="loading-01__ridge-near" d="M0 328 C160 320 280 302 420 312 C560 322 660 294 800 298 C940 302 1040 280 1160 288 C1280 296 1380 284 1440 290 L1440 360 L0 360 Z" />
        <path
          class="loading-01__ridge-line loading-01__ridge-line--far"
          d="M0 246 C100 232 180 210 250 168 C280 148 300 96 340 96 C390 96 420 168 480 186 C560 210 620 176 700 196 C760 210 800 150 860 142 C920 134 960 186 1040 200 C1120 214 1200 190 1280 204 C1360 216 1400 198 1440 200"
        />
        <path
          class="loading-01__ridge-line loading-01__ridge-line--mid"
          d="M0 292 C110 288 200 268 300 272 C390 276 440 236 520 226 C590 218 640 248 720 250 C800 252 850 196 930 192 C1000 190 1050 230 1130 242 C1220 256 1320 234 1440 240"
        />
      </svg>
      <div class="loading-01__water">
        <span class="loading-01__reflection"></span>
        <span class="loading-01__ripple loading-01__ripple--one"></span>
        <span class="loading-01__ripple loading-01__ripple--two"></span>
        <span class="loading-01__glint"></span>
      </div>
    </div>

    <div class="loading-01__wrap">
      <img src="/favicon.svg" class="loading-01__logo" alt="Logo" draggable="false" />
      <div class="loading-01__title">{{ appTitle }}</div>
      <div class="loading-01__progress"><span class="loading-01__progress-ink"></span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.loading-01 {
  --loading-bg: #f5f3ee;
  --loading-sky: rgb(0 119 255 / 7%);
  --loading-sky-warm: rgb(27 167 132 / 5%);
  --loading-title: #1f2d38;
  --loading-ridge-far: rgb(45 76 99 / 9%);
  --loading-ridge-mid: rgb(38 66 88 / 19%);
  --loading-ridge-near: rgb(31 53 71 / 33%);
  --loading-ridge-line: rgb(27 167 132 / 38%);
  --loading-ridge-line-2: rgb(0 119 255 / 28%);
  --loading-reflection: rgb(31 53 71 / 18%);
  --loading-line: rgb(31 53 71 / 22%);
  --loading-accent: #1ba784;
  --loading-accent-2: #0077ff;
  --loading-glow: rgb(27 167 132 / 34%);

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 28px;
  overflow: hidden;
  border-radius: 8px;
  user-select: none;
  background: var(--loading-bg);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(20rem 14rem at 18% -8%, var(--loading-sky), transparent 62%), radial-gradient(16rem 12rem at 92% 12%, var(--loading-sky-warm), transparent 60%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 3;
    pointer-events: none;
    opacity: 0.04;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__scene {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 100%;
    height: 52%;
    pointer-events: none;
  }

  &__ridge {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 68%;
  }

  &__ridge-far {
    fill: var(--loading-ridge-far);
    animation: loading-01-ridge-fade 1s ease-out backwards;
  }

  &__ridge-mid {
    fill: var(--loading-ridge-mid);
    animation: loading-01-ridge-fade 1s ease-out 120ms backwards;
  }

  &__ridge-near {
    fill: var(--loading-ridge-near);
    animation: loading-01-ridge-fade 1s ease-out 240ms backwards;
  }

  &__ridge-line {
    fill: none;
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;

    &--far {
      stroke: var(--loading-ridge-line);
      animation: loading-01-ridge-fade 1.2s ease-out 120ms backwards;
    }

    &--mid {
      stroke: var(--loading-ridge-line-2);
      animation: loading-01-ridge-fade 1.2s ease-out 240ms backwards;
    }
  }

  &__water {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 32%;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--loading-line) 18%, var(--loading-line) 82%, transparent);
      transform: scaleX(0);
      animation: loading-01-water-line 900ms cubic-bezier(0.16, 1, 0.3, 1) 360ms both;
    }
  }

  &__reflection {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, var(--loading-reflection), transparent 72%);
    filter: blur(3px);
    animation: loading-01-ridge-fade 1.2s ease-out 420ms backwards;
  }

  &__ripple {
    position: absolute;
    left: -10%;
    width: 120%;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--loading-line), transparent);
    animation: loading-01-ripple-drift 7s ease-in-out infinite;

    &--one {
      top: 34%;
    }

    &--two {
      top: 66%;
      animation-duration: 9s;
      animation-delay: -3s;
    }
  }

  &__glint {
    position: absolute;
    top: 22%;
    left: 0;
    width: 38%;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, var(--loading-accent) 42%, var(--loading-accent-2) 70%, transparent);
    box-shadow: 0 0 12px 1px var(--loading-glow);
    animation: loading-01-glint-sweep 3s ease-in-out 700ms infinite alternate;
  }

  &__wrap {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__logo {
    width: 52px;
    border-radius: 50%;
    filter: drop-shadow(0 6px 14px rgb(0 101 204 / 25%));
    animation: loading-01-logo-float 2.4s ease-in-out infinite;
  }

  &__title {
    margin-top: 10px;
    color: var(--loading-title);
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    white-space: nowrap;
  }

  &__progress {
    position: relative;
    width: 140px;
    height: 2px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--loading-line);
    animation: loading-01-ridge-fade 600ms ease-out 760ms backwards;
  }

  &__progress-ink {
    position: absolute;
    top: 0;
    left: 0;
    width: 45%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--loading-accent) 46%, var(--loading-accent-2) 76%, transparent);
    box-shadow: 0 0 10px var(--loading-glow);
    animation: loading-01-ink-track 1.8s ease-in-out 900ms infinite alternate;
  }
}

html.dark .loading-01 {
  --loading-bg: #141414;
  --loading-sky: rgb(77 159 255 / 16%);
  --loading-sky-warm: rgb(58 198 160 / 9%);
  --loading-title: #f0efe9;
  --loading-ridge-far: rgb(120 170 210 / 9%);
  --loading-ridge-mid: rgb(110 160 205 / 19%);
  --loading-ridge-near: rgb(96 148 196 / 34%);
  --loading-ridge-line: rgb(58 198 160 / 42%);
  --loading-ridge-line-2: rgb(77 159 255 / 32%);
  --loading-reflection: rgb(110 160 205 / 18%);
  --loading-line: rgb(190 215 235 / 20%);
  --loading-accent: #3ac6a0;
  --loading-accent-2: #4d9fff;
  --loading-glow: rgb(58 198 160 / 42%);
}

@keyframes loading-01-logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes loading-01-ridge-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes loading-01-water-line {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@keyframes loading-01-ripple-drift {
  0%,
  100% {
    transform: translateX(-3%);
    opacity: 0.35;
  }
  50% {
    transform: translateX(3%);
    opacity: 0.75;
  }
}

@keyframes loading-01-glint-sweep {
  from {
    transform: translateX(-10%);
  }
  to {
    transform: translateX(170%);
  }
}

@keyframes loading-01-ink-track {
  from {
    transform: translateX(-10%);
  }
  to {
    transform: translateX(122%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-01,
  .loading-01 *,
  .loading-01 *::before,
  .loading-01 *::after {
    animation: none !important;
  }

  .loading-01__water::before {
    transform: scaleX(1);
  }
}
</style>
