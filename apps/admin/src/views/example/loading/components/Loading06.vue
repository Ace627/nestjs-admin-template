<template>
  <div class="loading-06" role="status" aria-live="polite" aria-label="页面加载中">
    <!-- 天使：羽翼 · 光环 · 圣光 · 白羽 -->
    <svg class="loading-06__art loading-06__art--angel" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="loading06-angel-backlight" cx="50%" cy="46%" r="60%">
          <stop offset="0%" stop-color="#fffef9" />
          <stop offset="42%" stop-color="#fdf6e4" />
          <stop offset="100%" stop-color="#f6ecd7" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="loading06-angel-feather-fill" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="62%" stop-color="#faf7ef" />
          <stop offset="100%" stop-color="#e8e2d2" />
        </linearGradient>
        <linearGradient id="loading06-angel-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f7e6bb" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#f7e6bb" stop-opacity="0" />
        </linearGradient>

        <path id="loading06-angel-feather" d="M0 0 C-4 -11 -6 -24 -1 -33 C1 -36 5 -35 6 -29 C9 -19 4 -8 0 0 Z" />

        <g id="loading06-angel-wing">
          <path d="M0 0 C-6 -10 -18 -26 -26 -44 C-31 -56 -33 -66 -33 -74 L-26 -70 C-24 -56 -16 -36 -8 -18 Z" />
          <g>
            <use href="#loading06-angel-feather" transform="translate(0 0) rotate(-8) scale(0.62)" />
            <use href="#loading06-angel-feather" transform="translate(-8 -9) rotate(-20) scale(0.78)" />
            <use href="#loading06-angel-feather" transform="translate(-16 -20) rotate(-33) scale(0.94)" />
            <use href="#loading06-angel-feather" transform="translate(-23 -32) rotate(-46) scale(1.06)" />
            <use href="#loading06-angel-feather" transform="translate(-28 -45) rotate(-58) scale(1.12)" />
            <use href="#loading06-angel-feather" transform="translate(-31 -58) rotate(-70) scale(1)" />
            <use href="#loading06-angel-feather" transform="translate(-33 -70) rotate(-82) scale(0.86)" />
          </g>
          <g opacity="0.92">
            <use href="#loading06-angel-feather" transform="translate(-4 -6) rotate(-16) scale(0.5)" />
            <use href="#loading06-angel-feather" transform="translate(-12 -16) rotate(-28) scale(0.58)" />
            <use href="#loading06-angel-feather" transform="translate(-19 -27) rotate(-40) scale(0.64)" />
            <use href="#loading06-angel-feather" transform="translate(-25 -39) rotate(-52) scale(0.6)" />
            <use href="#loading06-angel-feather" transform="translate(-29 -51) rotate(-64) scale(0.5)" />
          </g>
        </g>

        <g id="loading06-angel-cloud">
          <path d="M8 0 A13 13 0 0 1 17 -19 A16 16 0 0 1 48 -26 A13 13 0 0 1 68 -15 A10 10 0 0 1 64 0 Z" />
        </g>
      </defs>

      <ellipse class="loading-06__backlight" cx="200" cy="118" rx="190" ry="128" fill="url(#loading06-angel-backlight)" />

      <g class="loading-06__beam">
        <path d="M168 20 L186 20 L214 214 L176 214 Z" fill="url(#loading06-angel-beam)" />
        <path d="M226 20 L238 20 L250 210 L224 210 Z" fill="url(#loading06-angel-beam)" opacity="0.6" />
      </g>

      <g class="loading-06__wing-box" transform="translate(176 176)">
        <g class="loading-06__wing" fill="url(#loading06-angel-feather-fill)" stroke="#ded6c2" stroke-width="0.6">
          <use href="#loading06-angel-wing" />
        </g>
      </g>
      <g class="loading-06__wing-box" transform="translate(224 176) scale(-1 1)">
        <g class="loading-06__wing loading-06__wing--right" fill="url(#loading06-angel-feather-fill)" stroke="#ded6c2" stroke-width="0.6">
          <use href="#loading06-angel-wing" />
        </g>
      </g>

      <g class="loading-06__halo">
        <ellipse cx="200" cy="128" rx="76" ry="76" fill="none" stroke="#e8cd94" stroke-width="1" opacity="0.4" />
        <path d="M200 52 A76 76 0 0 1 276 128" fill="none" stroke="#e0bd7b" stroke-width="2.6" stroke-linecap="round" opacity="0.85" />
        <path d="M200 204 A76 76 0 0 1 124 128" fill="none" stroke="#e0bd7b" stroke-width="1.4" stroke-linecap="round" opacity="0.4" />
      </g>

      <g class="loading-06__drift" fill="#fdfbf4">
        <use href="#loading06-angel-cloud" x="-20" y="214" opacity="0.85" />
        <use href="#loading06-angel-cloud" x="52" y="220" opacity="0.6" />
        <use href="#loading06-angel-cloud" x="180" y="214" opacity="0.85" />
        <use href="#loading06-angel-cloud" x="252" y="220" opacity="0.6" />
        <use href="#loading06-angel-cloud" x="380" y="214" opacity="0.85" />
      </g>

      <g fill="#ffffff" stroke="#e6dfcd" stroke-width="0.4">
        <g transform="translate(96 54)">
          <g class="loading-06__feather">
            <use href="#loading06-angel-feather" transform="scale(0.42)" />
          </g>
        </g>
        <g transform="translate(128 30)" opacity="0.8">
          <g class="loading-06__feather loading-06__feather--second">
            <use href="#loading06-angel-feather" transform="scale(0.32) rotate(24)" />
          </g>
        </g>
        <g transform="translate(306 40)">
          <g class="loading-06__feather loading-06__feather--third">
            <use href="#loading06-angel-feather" transform="scale(0.46) rotate(-14)" />
          </g>
        </g>
        <g transform="translate(330 96)" opacity="0.75">
          <g class="loading-06__feather loading-06__feather--second">
            <use href="#loading06-angel-feather" transform="scale(0.36) rotate(18)" />
          </g>
        </g>
        <g transform="translate(64 110)" opacity="0.7">
          <g class="loading-06__feather loading-06__feather--third">
            <use href="#loading06-angel-feather" transform="scale(0.3) rotate(-28)" />
          </g>
        </g>
      </g>

      <g fill="#d8bd86">
        <circle class="loading-06__mote" cx="112" cy="150" r="1.3" style="animation-delay: -0.6s" />
        <circle class="loading-06__mote" cx="288" cy="142" r="1.1" style="animation-delay: -2.4s" />
        <circle class="loading-06__mote" cx="196" cy="176" r="1.6" style="animation-delay: -3.8s" />
        <circle class="loading-06__mote" cx="76" cy="176" r="1" style="animation-delay: -4.6s" />
        <circle class="loading-06__mote" cx="322" cy="178" r="1.2" style="animation-delay: -1.8s" />
      </g>
    </svg>

    <!-- 堕天使：断翼 · 碎环 · 黑羽 · 余烬 -->
    <svg class="loading-06__art loading-06__art--fallen" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="loading06-fallen-backlight" cx="50%" cy="46%" r="62%">
          <stop offset="0%" stop-color="#4a1a25" stop-opacity="0.85" />
          <stop offset="46%" stop-color="#2a1019" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#120a10" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="loading06-fallen-feather-fill" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stop-color="#3a3442" />
          <stop offset="58%" stop-color="#241f2c" />
          <stop offset="100%" stop-color="#14111a" />
        </linearGradient>

        <filter id="loading06-fallen-mist" x="-12%" y="-40%" width="124%" height="180%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>

        <path id="loading06-fallen-feather" d="M0 0 C-4 -11 -6 -24 -1 -33 L3 -28 L1 -24 L5 -21 L2 -16 L6 -13 C8 -8 4 -3 0 0 Z" />

        <g id="loading06-fallen-wing">
          <path d="M0 0 C-6 -10 -18 -26 -26 -44 C-30 -54 -33 -64 -33 -72 L-24 -64 C-22 -52 -15 -34 -7 -17 Z" />
          <g>
            <use href="#loading06-fallen-feather" transform="translate(0 0) rotate(-10) scale(0.58)" />
            <use href="#loading06-fallen-feather" transform="translate(-8 -10) rotate(-24) scale(0.76)" />
            <use href="#loading06-fallen-feather" transform="translate(-23 -34) rotate(-48) scale(1.02)" />
            <use href="#loading06-fallen-feather" transform="translate(-28 -47) rotate(-60) scale(0.9)" />
            <use href="#loading06-fallen-feather" transform="translate(-32 -68) rotate(-84) scale(0.68)" />
          </g>
          <g opacity="0.8">
            <use href="#loading06-fallen-feather" transform="translate(-5 -7) rotate(-18) scale(0.46)" />
            <use href="#loading06-fallen-feather" transform="translate(-15 -20) rotate(-34) scale(0.54)" />
            <use href="#loading06-fallen-feather" transform="translate(-26 -42) rotate(-56) scale(0.5)" />
          </g>
        </g>
      </defs>

      <ellipse class="loading-06__backlight" cx="200" cy="118" rx="192" ry="130" fill="url(#loading06-fallen-backlight)" />

      <g stroke="#3a2b34" fill="none" stroke-linecap="round" filter="url(#loading06-fallen-mist)">
        <path class="loading-06__mist" d="M-20 186 C60 172 120 184 190 170" stroke-width="12" opacity="0.5" />
        <path class="loading-06__mist loading-06__mist--slow" d="M200 196 C268 182 322 192 420 176" stroke-width="9" opacity="0.42" />
      </g>

      <g class="loading-06__wing-box" transform="translate(176 178)">
        <g class="loading-06__wing" fill="url(#loading06-fallen-feather-fill)" stroke="#5b4a63" stroke-width="0.7">
          <use href="#loading06-fallen-wing" />
        </g>
      </g>
      <g class="loading-06__wing-box" transform="translate(224 178) scale(-1 1)">
        <g class="loading-06__wing loading-06__wing--right" fill="url(#loading06-fallen-feather-fill)" stroke="#5b4a63" stroke-width="0.7">
          <use href="#loading06-fallen-wing" />
        </g>
      </g>

      <g class="loading-06__halo loading-06__halo--broken" transform="rotate(-15 200 128)">
        <ellipse cx="200" cy="128" rx="76" ry="76" fill="none" stroke="#7a3a45" stroke-width="1" opacity="0.35" stroke-dasharray="46 10 22 8 30 12" />
        <path d="M200 52 A76 76 0 0 1 262 90" fill="none" stroke="#a8394a" stroke-width="2.4" stroke-linecap="round" opacity="0.8" />
        <path d="M150 190 A76 76 0 0 1 132 150" fill="none" stroke="#8c3140" stroke-width="1.6" stroke-linecap="round" opacity="0.5" />
        <path d="M252 172 L262 182 L256 188" fill="none" stroke="#b04352" stroke-width="1.2" opacity="0.6" />
        <path d="M124 96 L116 88" fill="none" stroke="#b04352" stroke-width="1.2" opacity="0.5" />
      </g>

      <g stroke="#3f3340" stroke-width="1.6" fill="none" stroke-linecap="round">
        <g transform="translate(74 8)">
          <g class="loading-06__chain">
            <path d="M0 0 C2 12 -2 24 0 36" stroke-dasharray="3.2 2.8" />
          </g>
        </g>
        <g transform="translate(326 8)">
          <g class="loading-06__chain loading-06__chain--right">
            <path d="M0 0 C-2 12 2 24 0 36" stroke-dasharray="3.2 2.8" />
          </g>
        </g>
      </g>

      <g fill="#2a2230" stroke="#4c3b48" stroke-width="0.4">
        <g transform="translate(112 44)">
          <g class="loading-06__fallen-feather">
            <use href="#loading06-fallen-feather" transform="scale(0.44)" />
          </g>
        </g>
        <g transform="translate(292 30)">
          <g class="loading-06__fallen-feather loading-06__fallen-feather--second">
            <use href="#loading06-fallen-feather" transform="scale(0.38) rotate(16)" />
          </g>
        </g>
        <g transform="translate(330 84)">
          <g class="loading-06__fallen-feather loading-06__fallen-feather--third">
            <use href="#loading06-fallen-feather" transform="scale(0.46) rotate(-12)" />
          </g>
        </g>
        <g transform="translate(84 96)">
          <g class="loading-06__fallen-feather loading-06__fallen-feather--second">
            <use href="#loading06-fallen-feather" transform="scale(0.34) rotate(22)" />
          </g>
        </g>
      </g>

      <g fill="#e0a05a">
        <circle class="loading-06__ember" cx="104" cy="206" r="1.8" style="animation-delay: -0.8s" />
        <circle class="loading-06__ember" cx="148" cy="198" r="1.3" style="animation-delay: -2.6s" />
        <circle class="loading-06__ember" cx="252" cy="208" r="1.6" style="animation-delay: -1.4s" />
        <circle class="loading-06__ember" cx="300" cy="196" r="1.2" style="animation-delay: -4.2s" />
        <circle class="loading-06__ember" cx="196" cy="212" r="2" style="animation-delay: -3.4s" />
      </g>
    </svg>

    <div class="loading-06__focus">
      <span class="loading-06__orb">
        <img src="/favicon.svg" class="loading-06__logo" alt="Logo" draggable="false" />
      </span>
      <div class="loading-06__title">{{ appTitle }}</div>
      <div class="loading-06__scan"><span class="loading-06__scan-ink"></span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.loading-06 {
  // 天使（浅色）：象牙白 + 淡金圣光
  --scene-bg: linear-gradient(168deg, #fffefb 0%, #f7f3e9 52%, #e9eef5 100%);
  --orb-bg: radial-gradient(circle at 50% 42%, #ffffff 0%, #fbf5e6 56%, #ece3cd 100%);
  --orb-border: rgb(196 168 108 / 32%);
  --orb-glow: rgb(232 205 148 / 52%);
  --title-color: #4a4335;
  --title-shadow: 0 1px 0 rgb(255 255 255 / 92%);
  --scan-line: rgb(74 67 53 / 16%);
  --scan-ink: #b3924f;
  --show-angel: block;
  --show-fallen: none;
  --realm-ease: cubic-bezier(0.16, 1, 0.3, 1);

  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  border-radius: 8px;
  background: var(--scene-bg);
  isolation: isolate;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
    opacity: 0.045;
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  &__art {
    position: absolute;
    inset: 0;
    z-index: 1;
    width: 100%;
    height: 100%;
    pointer-events: none;

    &--angel {
      display: var(--show-angel);
    }

    &--fallen {
      display: var(--show-fallen);
    }
  }

  // ── 天使动效 ──
  &__backlight {
    transform-box: fill-box;
    transform-origin: center;
    animation: backlight-breathe 8.5s ease-in-out infinite alternate;
  }

  &__beam {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: beam-sway 9s ease-in-out infinite alternate;
  }

  &__wing {
    transform-box: fill-box;
    transform-origin: 100% 100%;
    animation: wing-breathe 6.6s ease-in-out infinite alternate;

    &--right {
      transform-origin: 0% 100%;
      animation-duration: 7.4s;
      animation-direction: alternate-reverse;
    }
  }

  &__halo {
    transform-box: fill-box;
    transform-origin: center;
    animation: halo-turn 26s linear infinite;

    &--broken {
      animation: halo-crack 5.2s ease-in-out infinite alternate;
    }
  }

  &__drift {
    animation: cloud-drift 40s linear infinite;
  }

  &__feather {
    transform-box: fill-box;
    transform-origin: center;
    animation: feather-fall 9s linear infinite;

    &--second {
      animation-duration: 12s;
      animation-delay: -4s;
    }

    &--third {
      animation-duration: 7.5s;
      animation-delay: -6.5s;
    }
  }

  &__mote {
    transform-box: fill-box;
    transform-origin: center;
    animation: mote-rise 7.5s ease-out infinite;
  }

  // ── 堕天使动效 ──
  &__mist {
    animation: mist-drift 13s ease-in-out infinite alternate;

    &--slow {
      animation-duration: 18s;
      animation-direction: alternate-reverse;
    }
  }

  &__chain {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: chain-sway 4.6s ease-in-out infinite alternate;

    &--right {
      animation-duration: 5.6s;
      animation-direction: alternate-reverse;
    }
  }

  &__fallen-feather {
    transform-box: fill-box;
    transform-origin: center;
    animation: fallen-feather-drop 5.5s linear infinite;

    &--second {
      animation-duration: 7.6s;
      animation-delay: -2.6s;
    }

    &--third {
      animation-duration: 4.6s;
      animation-delay: -4.2s;
    }
  }

  &__ember {
    transform-box: fill-box;
    transform-origin: center;
    animation: ember-rise 6s ease-out infinite;
  }

  // ── 中央信息 ──
  &__focus {
    position: relative;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__orb {
    position: relative;
    width: 100px;
    height: 100px;
    display: grid;
    place-items: center;
    border: 1px solid var(--orb-border);
    border-radius: 50%;
    background: var(--orb-bg);
    box-shadow: 0 0 26px var(--orb-glow);
    animation: orb-in 820ms var(--realm-ease) both, orb-pulse 6.4s ease-in-out 820ms infinite;
  }

  &__logo {
    width: 54px;
    height: 54px;
    object-fit: contain;
    animation: logo-in 640ms var(--realm-ease) 220ms both, logo-breathe 5.2s ease-in-out 900ms infinite;
  }

  &__title {
    margin-top: 22px;
    color: var(--title-color);
    font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 2px;
    white-space: nowrap;
    text-shadow: var(--title-shadow);
    animation: fade-in 720ms var(--realm-ease) 360ms both;
  }

  &__scan {
    position: relative;
    width: 104px;
    height: 2px;
    margin-top: 12px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--scan-line);
    animation: fade-in 720ms var(--realm-ease) 480ms both;
  }

  &__scan-ink {
    position: absolute;
    top: 0;
    left: 0;
    width: 42%;
    height: 100%;
    background: linear-gradient(90deg, transparent, var(--scan-ink) 70%, transparent);
    animation: scan-run 2.4s ease-in-out 600ms infinite alternate;
  }
}

html.dark .loading-06 {
  // 堕天使（深色）：灰紫底 + 血色余光
  --scene-bg: linear-gradient(168deg, #0a0810 0%, #140d16 52%, #060409 100%);
  --orb-bg: radial-gradient(circle at 50% 42%, #b9b2bd 0%, #7d7382 56%, #3d3543 100%);
  --orb-border: rgb(154 132 158 / 26%);
  --orb-glow: rgb(140 90 110 / 34%);
  --title-color: #d5cfd6;
  --title-shadow: 0 1px 2px rgb(0 0 0 / 88%);
  --scan-line: rgb(213 207 214 / 14%);
  --scan-ink: #8e3540;
  --show-angel: none;
  --show-fallen: block;

  .loading-06__logo {
    filter: drop-shadow(0 0 10px rgb(170 130 150 / 34%));
  }
}

@keyframes orb-in {
  from {
    opacity: 0;
    transform: scale(0.86);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes orb-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 22px var(--orb-glow);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 0 34px var(--orb-glow);
  }
}

@keyframes logo-in {
  from {
    opacity: 0;
    transform: scale(0.84);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes logo-breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.04);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backlight-breathe {
  from {
    opacity: 0.7;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1.04);
  }
}

@keyframes beam-sway {
  from {
    opacity: 0.55;
    transform: skewX(-1.2deg) translateX(-3px);
  }
  to {
    opacity: 0.95;
    transform: skewX(1.2deg) translateX(3px);
  }
}

@keyframes wing-breathe {
  from {
    transform: rotate(-1.6deg) scaleY(0.985);
  }
  to {
    transform: rotate(1.8deg) scaleY(1.02);
  }
}

@keyframes halo-turn {
  to {
    transform: rotate(360deg);
  }
}

@keyframes halo-crack {
  0%,
  100% {
    opacity: 0.55;
  }
  46% {
    opacity: 0.9;
  }
  52% {
    opacity: 0.4;
  }
  58% {
    opacity: 0.85;
  }
}

@keyframes cloud-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-200px);
  }
}

@keyframes feather-fall {
  0% {
    opacity: 0;
    transform: translate(0, -8px) rotate(0deg);
  }
  16% {
    opacity: 0.9;
  }
  72% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translate(22px, 96px) rotate(196deg);
  }
}

@keyframes mote-rise {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  30% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(-30px);
  }
}

@keyframes mist-drift {
  from {
    transform: translateX(0);
    opacity: 0.65;
  }
  to {
    transform: translateX(-16px);
    opacity: 1;
  }
}

@keyframes chain-sway {
  from {
    transform: rotate(-3.6deg);
  }
  to {
    transform: rotate(3.6deg);
  }
}

@keyframes fallen-feather-drop {
  0% {
    opacity: 0;
    transform: translate(0, -6px) rotate(0deg) scale(1);
  }
  14% {
    opacity: 0.9;
  }
  78% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translate(-18px, 104px) rotate(-164deg) scale(0.9);
  }
}

@keyframes ember-rise {
  0% {
    opacity: 0;
    transform: translateY(6px) scale(0.6);
  }
  28% {
    opacity: 0.95;
  }
  100% {
    opacity: 0;
    transform: translateY(-46px) scale(1.05);
  }
}

@keyframes scan-run {
  from {
    transform: translateX(-8%);
  }
  to {
    transform: translateX(160%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loading-06,
  .loading-06 *,
  .loading-06 *::before,
  .loading-06 *::after {
    animation: none !important;
  }
}
</style>
