<template>
  <div class="loading-05" role="status" aria-live="polite" aria-label="页面加载中">
    <!-- 天庭：南天门 · 云海 · 瑶池 · 仙鹤 · 蟠桃 -->
    <svg class="loading-05__art loading-05__art--heaven" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="loading05-heaven-sky" cx="50%" cy="38%" r="62%">
          <stop offset="0%" stop-color="#fffdf7" />
          <stop offset="44%" stop-color="#fdf2d7" />
          <stop offset="100%" stop-color="#f7e7c8" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="loading05-heaven-roof" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f4dfaa" />
          <stop offset="46%" stop-color="#d5af68" />
          <stop offset="100%" stop-color="#a9823e" />
        </linearGradient>
        <linearGradient id="loading05-heaven-pillar" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#96341f" />
          <stop offset="42%" stop-color="#c9502f" />
          <stop offset="100%" stop-color="#822c1c" />
        </linearGradient>
        <linearGradient id="loading05-heaven-pool" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f9ecd0" stop-opacity="0.2" />
          <stop offset="58%" stop-color="#e8d1a2" stop-opacity="0.6" />
          <stop offset="100%" stop-color="#d2ae6f" stop-opacity="0.92" />
        </linearGradient>
        <radialGradient id="loading05-heaven-lamp">
          <stop offset="0%" stop-color="#ffe9b8" stop-opacity="0.92" />
          <stop offset="100%" stop-color="#ffcd76" stop-opacity="0" />
        </radialGradient>

        <!-- 屋顶基本形：以脊心为原点，便于牌楼与远景宫阙复用 -->
        <path
          id="loading05-heaven-roof-shape"
          d="M-22 0 L22 0 L74 26 C82 28 88 25 92 19 C92 26 87 31 79 34 L-79 34 C-87 31 -92 26 -92 19 C-88 25 -82 28 -74 26 Z"
        />

        <g id="loading05-heaven-cloud-puff">
          <path d="M8 0 A13 13 0 0 1 17 -19 A16 16 0 0 1 48 -26 A13 13 0 0 1 68 -15 A10 10 0 0 1 64 0 Z" />
        </g>
        <g id="loading05-heaven-cloud-bank">
          <use href="#loading05-heaven-cloud-puff" x="-18" y="0" />
          <use href="#loading05-heaven-cloud-puff" x="22" y="4" />
          <use href="#loading05-heaven-cloud-puff" x="62" y="-3" />
          <use href="#loading05-heaven-cloud-puff" x="102" y="2" />
          <use href="#loading05-heaven-cloud-puff" x="142" y="-1" />
        </g>

        <g id="loading05-heaven-crane">
          <path d="M2 4 C-12 -12 -32 -19 -52 -16 C-34 -4 -16 6 2 10 Z" fill="#fdfaf2" />
          <path d="M0 8 C-12 22 -30 32 -50 37 C-32 28 -16 18 0 12 Z" fill="#f3ece0" />
          <path d="M-52 -16 C-48 -14 -44 -12 -40 -9 C-45 -12 -49 -14 -52 -16 Z" fill="#b9a883" />
          <path d="M-50 37 C-45 35 -42 33 -38 30 C-42 33 -47 35 -50 37 Z" fill="#b9a883" />
          <ellipse cx="4" cy="8" rx="11" ry="5.5" fill="#ffffff" />
          <path d="M12 5 C18 -2 21 -10 25 -17" fill="none" stroke="#ffffff" stroke-width="3.4" stroke-linecap="round" />
          <circle cx="26" cy="-18" r="2.8" fill="#ffffff" />
          <circle cx="26.6" cy="-20.6" r="1.6" fill="#c0392b" />
          <path d="M28.5 -19 L36 -21 L28.5 -16.5 Z" fill="#c9a227" />
          <path d="M-4 12 L-12 26" stroke="#b9a883" stroke-width="1.6" stroke-linecap="round" />
          <path d="M1 13 L-5 28" stroke="#b9a883" stroke-width="1.6" stroke-linecap="round" />
        </g>

        <g id="loading05-heaven-koi">
          <path d="M-10 0 C-5 -4.2 4 -4.2 8 0 C4 4.2 -5 4.2 -10 0 Z" fill="#e5924c" />
          <path d="M-6 -1.6 C-2 -3 2 -3 5 -1.4" fill="none" stroke="#f7c79b" stroke-width="0.9" opacity="0.8" />
          <g class="loading-05__koi-tail">
            <path d="M8 0 L15.5 -5.4 L14 0 L15.5 5.4 Z" fill="#f2b072" />
          </g>
          <circle cx="-6" cy="-0.9" r="0.8" fill="#7d3a1a" />
        </g>

        <g id="loading05-heaven-lotus">
          <circle cx="0" cy="24" r="15" fill="url(#loading05-heaven-lamp)" />
          <path d="M-8 0 C-10 -5 -6 -9 -3 -6.6 C-1 -9.6 3 -9.6 5 -6.6 C9 -9 10.5 -4.6 7.4 0 Z" fill="#f8e3b6" />
          <ellipse cx="0" cy="-0.6" rx="8.4" ry="1.6" fill="#e6c78d" opacity="0.85" />
          <path class="loading-05__flame" d="M0 -2.4 C-1.1 -5.4 0 -7.4 0.2 -8.4 C1.2 -6.6 1.4 -4.4 0 -2.4 Z" fill="#ffdf9b" />
        </g>

        <clipPath id="loading05-heaven-pool-clip">
          <rect x="0" y="192" width="400" height="44" />
        </clipPath>
      </defs>

      <!-- 天光霞色 -->
      <ellipse class="loading-05__skyglow" cx="200" cy="112" rx="192" ry="124" fill="url(#loading05-heaven-sky)" />

      <!-- 仙气丝带 -->
      <g class="loading-05__aura" fill="none" stroke="#e7d3aa" stroke-linecap="round">
        <path d="M-20 246 C52 214 104 178 168 170" stroke-width="3" opacity="0.5" />
        <path d="M6 262 C78 228 128 192 196 184" stroke-width="2" opacity="0.38" />
        <path d="M36 272 C108 240 158 206 228 198" stroke-width="1.4" opacity="0.26" />
      </g>

      <!-- 远景宫阙 · 左 -->
      <g class="loading-05__palace" fill="#e6cd9a" opacity="0.34">
        <use href="#loading05-heaven-roof-shape" transform="translate(60 124) scale(0.4)" />
        <circle cx="60" cy="122" r="1.6" fill="#d8b878" />
        <rect x="38" y="137" width="4" height="19" />
        <rect x="78" y="137" width="4" height="19" />
        <rect x="32" y="156" width="56" height="3" />
      </g>

      <!-- 远景宫阙 · 右 -->
      <g class="loading-05__palace loading-05__palace--right" fill="#e6cd9a" opacity="0.3">
        <use href="#loading05-heaven-roof-shape" transform="translate(340 130) scale(-0.34 0.34)" />
        <circle cx="340" cy="128" r="1.4" fill="#d8b878" />
        <rect x="322" y="141" width="3.4" height="17" />
        <rect x="356" y="141" width="3.4" height="17" />
        <rect x="317" y="158" width="48" height="2.6" />
      </g>

      <!-- 云海 · 远 -->
      <g class="loading-05__drift" fill="#f2e3c6">
        <use href="#loading05-heaven-cloud-bank" x="-14" y="152" opacity="0.5" />
        <use href="#loading05-heaven-cloud-bank" x="186" y="152" opacity="0.5" />
        <use href="#loading05-heaven-cloud-bank" x="386" y="152" opacity="0.5" />
      </g>

      <!-- 南天门牌楼 -->
      <g class="loading-05__gate">
        <use href="#loading05-heaven-roof-shape" x="200" y="34" fill="url(#loading05-heaven-roof)" />
        <g stroke="#b98f47" stroke-width="0.8" opacity="0.45">
          <path d="M186 36 L142 64" />
          <path d="M194 36 L170 64" />
          <path d="M206 36 L230 64" />
          <path d="M214 36 L258 64" />
        </g>

        <!-- 斗拱 -->
        <rect x="118" y="68" width="164" height="7" fill="#e3c68b" />
        <g stroke="#bf9550" stroke-width="0.8" opacity="0.7">
          <path d="M132 68 L132 75" />
          <path d="M152 68 L152 75" />
          <path d="M172 68 L172 75" />
          <path d="M192 68 L192 75" />
          <path d="M208 68 L208 75" />
          <path d="M228 68 L228 75" />
          <path d="M248 68 L248 75" />
          <path d="M268 68 L268 75" />
        </g>

        <!-- 匾额 -->
        <rect x="176" y="76" width="48" height="16" rx="1" fill="#6d2317" stroke="#e0bd7b" stroke-width="0.9" />
        <rect x="179.5" y="79.5" width="41" height="9" fill="none" stroke="#e0bd7b" stroke-width="0.5" opacity="0.5" />

        <!-- 额枋 -->
        <rect x="144" y="92" width="112" height="7" fill="#cf9a51" />
        <g stroke="#a8763a" stroke-width="0.6" opacity="0.6">
          <path d="M160 92 L160 99" />
          <path d="M200 92 L200 99" />
          <path d="M240 92 L240 99" />
        </g>

        <!-- 盘龙柱 -->
        <rect x="148" y="99" width="13" height="93" fill="url(#loading05-heaven-pillar)" />
        <rect x="239" y="99" width="13" height="93" fill="url(#loading05-heaven-pillar)" />
        <g class="loading-05__dragon" fill="none" stroke="#f0d69c" stroke-width="2.1" stroke-linecap="round" opacity="0.92">
          <path d="M155 112 C168 118 142 126 155 134 C168 142 142 150 155 158 C168 166 142 174 155 182" />
          <path d="M245 112 C232 118 258 126 245 134 C232 142 258 150 245 158 C232 166 258 174 245 182" />
        </g>
        <g fill="#f7e2b6">
          <path d="M155 112 C159 107 166 108 168 112 C164 111 159 112 156 115 Z" />
          <path d="M245 112 C241 107 234 108 232 112 C236 111 241 112 244 115 Z" />
        </g>

        <!-- 柱础 -->
        <rect x="143" y="186" width="23" height="6" rx="1" fill="#c9a469" />
        <rect x="234" y="186" width="23" height="6" rx="1" fill="#c9a469" />

        <!-- 宫灯长明 -->
        <g transform="translate(108 53)">
          <g class="loading-05__lantern">
            <path d="M0 0 L0 6" stroke="#c9a469" stroke-width="1" />
            <circle cx="0" cy="24" r="16" fill="url(#loading05-heaven-lamp)" class="loading-05__lantern-glow" />
            <rect x="-5" y="6" width="10" height="2" fill="#c9a469" />
            <ellipse cx="0" cy="16" rx="7" ry="8.5" fill="#d94f36" />
            <path d="M-6.4 12 L6.4 12 M-6.4 20 L6.4 20" stroke="#f6d9a1" stroke-width="0.8" opacity="0.9" />
            <rect x="-5" y="24" width="10" height="2" fill="#c9a469" />
            <path d="M0 26 L0 33" stroke="#d94f36" stroke-width="1.2" />
          </g>
        </g>
        <g transform="translate(292 53)">
          <g class="loading-05__lantern loading-05__lantern--right">
            <path d="M0 0 L0 6" stroke="#c9a469" stroke-width="1" />
            <circle cx="0" cy="24" r="16" fill="url(#loading05-heaven-lamp)" class="loading-05__lantern-glow" />
            <rect x="-5" y="6" width="10" height="2" fill="#c9a469" />
            <ellipse cx="0" cy="16" rx="7" ry="8.5" fill="#d94f36" />
            <path d="M-6.4 12 L6.4 12 M-6.4 20 L6.4 20" stroke="#f6d9a1" stroke-width="0.8" opacity="0.9" />
            <rect x="-5" y="24" width="10" height="2" fill="#c9a469" />
            <path d="M0 26 L0 33" stroke="#d94f36" stroke-width="1.2" />
          </g>
        </g>
      </g>

      <!-- 瑶池 -->
      <g clip-path="url(#loading05-heaven-pool-clip)">
        <rect x="0" y="192" width="400" height="44" fill="url(#loading05-heaven-pool)" />
        <path d="M0 192 L400 192" stroke="#fdf3dc" stroke-width="1" opacity="0.7" />
        <g stroke="#f8e7c2" fill="none" stroke-width="0.9" opacity="0.65">
          <path d="M-10 202 C40 199 80 205 130 202 C180 199 220 205 270 202 C320 199 360 205 410 202" />
          <path d="M-10 216 C50 213 90 219 140 216 C190 213 230 219 280 216 C330 213 370 219 410 216" />
          <path d="M-10 228 C60 225 100 231 150 228 C200 225 240 231 290 228 C340 225 380 231 410 228" />
        </g>

        <ellipse class="loading-05__ripple" cx="152" cy="206" rx="11" ry="2.2" fill="none" stroke="#fdf3dc" stroke-width="0.9" />
        <ellipse class="loading-05__ripple loading-05__ripple--late" cx="256" cy="216" rx="9" ry="1.9" fill="none" stroke="#fdf3dc" stroke-width="0.9" />

        <g class="loading-05__koi">
          <g transform="translate(0 208) scale(-1 1)">
            <use href="#loading05-heaven-koi" />
          </g>
        </g>
        <g class="loading-05__koi loading-05__koi--back">
          <use href="#loading05-heaven-koi" x="0" y="218" />
        </g>

        <g transform="translate(64 204)">
          <g class="loading-05__lotus">
            <use href="#loading05-heaven-lotus" />
          </g>
        </g>
        <g transform="translate(300 212) scale(0.85)">
          <g class="loading-05__lotus loading-05__lotus--late">
            <use href="#loading05-heaven-lotus" />
          </g>
        </g>
      </g>

      <!-- 云海 · 近 -->
      <g class="loading-05__drift loading-05__drift--near" fill="#fffaf0">
        <use href="#loading05-heaven-cloud-bank" x="-14" y="186" opacity="0.7" />
        <use href="#loading05-heaven-cloud-bank" x="186" y="186" opacity="0.7" />
        <use href="#loading05-heaven-cloud-bank" x="386" y="186" opacity="0.7" />
      </g>

      <!-- 仙鹤 -->
      <g transform="translate(300 74)">
        <g class="loading-05__crane">
          <g transform="scale(0.86)">
            <use href="#loading05-heaven-crane" />
          </g>
        </g>
      </g>
      <g transform="translate(332 40)">
        <g class="loading-05__crane loading-05__crane--far">
          <g transform="scale(0.5)">
            <use href="#loading05-heaven-crane" />
          </g>
        </g>
      </g>

      <!-- 蟠桃枝 -->
      <g transform="translate(0 42)">
        <g class="loading-05__branch">
          <g fill="none" stroke="#8a5f34" stroke-linecap="round">
            <path d="M0 0 C26 6 48 18 66 34" stroke-width="3.2" />
            <path d="M26 8 C32 2 40 -2 48 -4" stroke-width="1.8" />
            <path d="M48 22 C56 18 62 12 66 6" stroke-width="1.6" />
          </g>
          <g>
            <ellipse cx="34" cy="2" rx="5" ry="5.6" fill="#f3b4b2" />
            <path d="M34 -3.6 C35.4 -1 35.4 3 34 5.6" stroke="#d98b8c" stroke-width="0.6" fill="none" />
            <path d="M36 -4 C40 -7 44 -6 45 -3 C42 -1 38 -1 36 -4 Z" fill="#8fae74" />
          </g>
          <g transform="translate(58 20) scale(0.82)">
            <ellipse cx="0" cy="0" rx="5" ry="5.6" fill="#efaa9f" />
            <path d="M2 -4 C6 -7 10 -6 11 -3 C8 -1 4 -1 2 -4 Z" fill="#86a56c" />
          </g>
          <g transform="translate(22 12) scale(0.66)">
            <ellipse cx="0" cy="0" rx="5" ry="5.6" fill="#f6c2bb" />
          </g>
        </g>
      </g>

      <!-- 仙尘 -->
      <g fill="#c9a469">
        <circle class="loading-05__mote" cx="120" cy="150" r="1.3" style="animation-delay: -0.4s" />
        <circle class="loading-05__mote" cx="268" cy="166" r="1" style="animation-delay: -2.2s" />
        <circle class="loading-05__mote" cx="196" cy="184" r="1.6" style="animation-delay: -3.4s" />
        <circle class="loading-05__mote" cx="86" cy="128" r="1" style="animation-delay: -4.6s" />
        <circle class="loading-05__mote" cx="316" cy="140" r="1.2" style="animation-delay: -1.6s" />
        <circle class="loading-05__mote" cx="240" cy="196" r="1.1" style="animation-delay: -5.4s" />
      </g>
    </svg>

    <!-- 地府：鬼门关 · 忘川 · 奈何桥 · 三生石 · 彼岸花 -->
    <svg class="loading-05__art loading-05__art--hell" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="loading05-hell-moon">
          <stop offset="0%" stop-color="#c2454c" />
          <stop offset="58%" stop-color="#8d222c" />
          <stop offset="100%" stop-color="#4d1119" />
        </radialGradient>
        <radialGradient id="loading05-hell-moon-halo">
          <stop offset="0%" stop-color="#a6323b" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#6d1a22" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="loading05-hell-stele-glow">
          <stop offset="0%" stop-color="#b03a3f" stop-opacity="0.42" />
          <stop offset="100%" stop-color="#7a2228" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="loading05-hell-soul-lamp">
          <stop offset="0%" stop-color="#bfe6e2" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#5c9fa0" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="loading05-hell-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#3b1119" />
          <stop offset="55%" stop-color="#5b2119" />
          <stop offset="100%" stop-color="#341016" />
        </linearGradient>

        <path
          id="loading05-hell-roof-shape"
          d="M-22 0 L22 0 L74 26 C82 28 88 25 92 19 C92 26 87 31 79 34 L-79 34 C-87 31 -92 26 -92 19 C-88 25 -82 28 -74 26 Z"
        />

        <g id="loading05-hell-petal">
          <path d="M0 0 C-5 -14 -9 -28 -3 -40 C0 -46 5 -45 6 -38 C11 -25 5 -11 0 0 Z" />
        </g>
        <g id="loading05-hell-stamen">
          <path d="M0 0 C-4 -22 1 -44 9 -58" fill="none" stroke-width="1.2" />
          <circle cx="9" cy="-58" r="1.8" stroke="none" />
        </g>

        <g id="loading05-hell-flower">
          <path class="loading-05__stem" d="M0 0 C3 26 -1 50 4 74" fill="none" stroke="#6d2a33" stroke-width="2" />
          <g fill="#a8323f" stroke="#c14a56" stroke-width="0.6">
            <use href="#loading05-hell-petal" transform="rotate(-78)" />
            <use href="#loading05-hell-petal" transform="rotate(-50)" />
            <use href="#loading05-hell-petal" transform="rotate(-22)" />
            <use href="#loading05-hell-petal" transform="rotate(6)" />
            <use href="#loading05-hell-petal" transform="rotate(34)" />
            <use href="#loading05-hell-petal" transform="rotate(62)" />
          </g>
          <g class="loading-05__stamens" fill="#c14a56" stroke="#c14a56">
            <use href="#loading05-hell-stamen" transform="rotate(-68)" />
            <use href="#loading05-hell-stamen" transform="rotate(-36)" />
            <use href="#loading05-hell-stamen" transform="rotate(-4)" />
            <use href="#loading05-hell-stamen" transform="rotate(28)" />
            <use href="#loading05-hell-stamen" transform="rotate(60)" />
          </g>
        </g>
      </defs>

      <!-- 幽冥雾气 -->
      <g class="loading-05__fog" fill="none" stroke-linecap="round">
        <path d="M-20 154 C56 140 118 152 188 138" stroke="#2b2734" stroke-width="14" opacity="0.45" />
        <path d="M206 166 C272 152 330 162 424 146" stroke="#241f2a" stroke-width="11" opacity="0.4" />
        <path d="M-10 182 C70 168 130 178 200 164" stroke="#302532" stroke-width="8" opacity="0.3" />
      </g>

      <!-- 血月 -->
      <g transform="translate(322 66)">
        <circle class="loading-05__moon-halo" cx="0" cy="0" r="34" fill="url(#loading05-hell-moon-halo)" />
        <circle cx="0" cy="0" r="17" fill="url(#loading05-hell-moon)" />
        <path d="M-11 -6 C-6 -9 2 -8 7 -4" fill="none" stroke="#4a1119" stroke-width="1.4" opacity="0.5" />
        <path d="M-6 6 C0 9 8 8 12 3" fill="none" stroke="#4a1119" stroke-width="1.1" opacity="0.4" />
        <path class="loading-05__moon-veil" d="M-46 6 C-30 2 -16 8 0 5 C16 2 30 8 46 4" fill="none" stroke="#1c1822" stroke-width="3" opacity="0.7" />
      </g>

      <!-- 枯树 -->
      <g transform="translate(34 190)">
        <g class="loading-05__tree" fill="none" stroke="#241b20" stroke-linecap="round">
          <path d="M0 0 C-2 -22 2 -44 -2 -66" stroke-width="5" />
          <path d="M-1 -40 C-14 -50 -20 -60 -22 -74" stroke-width="2.6" />
          <path d="M-2 -52 C10 -60 16 -70 18 -84" stroke-width="2.2" />
          <path d="M-3 -30 C-16 -34 -24 -40 -30 -50" stroke-width="1.8" />
          <path d="M6 -64 C12 -74 13 -82 11 -90" stroke-width="1.4" />
        </g>
      </g>

      <!-- 三生石 -->
      <g transform="translate(304 156)">
        <ellipse class="loading-05__stele-glow" cx="14" cy="12" rx="24" ry="26" fill="url(#loading05-hell-stele-glow)" />
        <path d="M0 32 L0 6 C0 -4 7 -10 14 -10 C21 -10 28 -4 28 6 L28 32 Z" fill="#232030" stroke="#453741" stroke-width="0.9" />
        <g stroke="#5f4a4d" stroke-width="1.2" opacity="0.75">
          <path d="M7 2 L21 2" />
          <path d="M7 9 L21 9" />
          <path d="M7 16 L17 16" />
        </g>
      </g>

      <!-- 鬼门关 -->
      <g class="loading-05__gate">
        <use href="#loading05-hell-roof-shape" x="200" y="34" fill="#1b1824" stroke="#432f36" stroke-width="0.9" />
        <g stroke="#2f2733" stroke-width="0.8" opacity="0.9">
          <path d="M186 36 L142 64" />
          <path d="M194 36 L170 64" />
          <path d="M206 36 L230 64" />
          <path d="M214 36 L258 64" />
        </g>

        <rect x="118" y="68" width="164" height="7" fill="#221d2a" stroke="#3b2c36" stroke-width="0.6" />
        <rect x="176" y="76" width="48" height="16" rx="1" fill="#0c0a10" stroke="#6a2a31" stroke-width="0.9" />
        <rect x="179.5" y="79.5" width="41" height="9" fill="none" stroke="#6a2a31" stroke-width="0.5" opacity="0.6" />

        <rect x="144" y="92" width="112" height="7" fill="#241e2c" />
        <rect x="148" y="99" width="13" height="93" fill="#171420" />
        <rect x="239" y="99" width="13" height="93" fill="#171420" />
        <rect x="158" y="99" width="1.6" height="93" fill="#522229" opacity="0.8" />
        <rect x="240" y="99" width="1.6" height="93" fill="#522229" opacity="0.8" />
        <rect x="143" y="186" width="23" height="6" rx="1" fill="#2a2433" />
        <rect x="234" y="186" width="23" height="6" rx="1" fill="#2a2433" />

        <!-- 铁链 -->
        <g transform="translate(108 50)">
          <g class="loading-05__chain">
            <path d="M0 0 C-1 8 1 16 0 24" fill="none" stroke="#3a343c" stroke-width="2.4" stroke-dasharray="3 2.6" />
            <path d="M0 26 C0 30 0 33 0 36" fill="none" stroke="#2c272f" stroke-width="1.4" />
          </g>
        </g>
        <g transform="translate(292 50)">
          <g class="loading-05__chain loading-05__chain--right">
            <path d="M0 0 C1 8 -1 16 0 24" fill="none" stroke="#3a343c" stroke-width="2.4" stroke-dasharray="3 2.6" />
            <path d="M0 26 C0 30 0 33 0 36" fill="none" stroke="#2c272f" stroke-width="1.4" />
          </g>
        </g>

        <!-- 引魂灯 -->
        <g transform="translate(122 62)">
          <g class="loading-05__soul-lamp">
            <path d="M0 0 L0 5" stroke="#3b3a44" stroke-width="1" />
            <circle cx="0" cy="18" r="13" fill="url(#loading05-hell-soul-lamp)" />
            <ellipse cx="0" cy="13" rx="5.4" ry="6.6" fill="#9fb7bd" />
            <path d="M-4.6 10 L4.6 10 M-4.6 16 L4.6 16" stroke="#dff2f0" stroke-width="0.7" opacity="0.8" />
            <path d="M0 20 L0 25" stroke="#7e939a" stroke-width="1" />
          </g>
        </g>
        <g transform="translate(278 62)">
          <g class="loading-05__soul-lamp loading-05__soul-lamp--right">
            <path d="M0 0 L0 5" stroke="#3b3a44" stroke-width="1" />
            <circle cx="0" cy="18" r="13" fill="url(#loading05-hell-soul-lamp)" />
            <ellipse cx="0" cy="13" rx="5.4" ry="6.6" fill="#9fb7bd" />
            <path d="M-4.6 10 L4.6 10 M-4.6 16 L4.6 16" stroke="#dff2f0" stroke-width="0.7" opacity="0.8" />
            <path d="M0 20 L0 25" stroke="#7e939a" stroke-width="1" />
          </g>
        </g>
      </g>

      <!-- 忘川河 -->
      <rect x="0" y="192" width="400" height="46" fill="url(#loading05-hell-river)" />
      <ellipse class="loading-05__moon-shadow" cx="322" cy="206" rx="7" ry="16" fill="#8d222c" opacity="0.22" />
      <g fill="none" stroke="#8b3a1e" stroke-width="0.9" opacity="0.5">
        <g class="loading-05__wave">
          <path d="M0 200 q12.5 -4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M200 200 q12.5 -4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M400 200 q12.5 -4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
        </g>
        <g class="loading-05__wave loading-05__wave--slow">
          <path d="M0 214 q12.5 4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M200 214 q12.5 4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M400 214 q12.5 4 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
        </g>
        <g class="loading-05__wave loading-05__wave--fast" opacity="0.4">
          <path d="M0 226 q12.5 -3 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M200 226 q12.5 -3 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
          <path d="M400 226 q12.5 -3 25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0 t25 0" />
        </g>
      </g>

      <!-- 奈何桥 -->
      <g class="loading-05__bridge">
        <path d="M30 216 C100 186 300 186 370 216 L370 226 C300 200 100 200 30 226 Z" fill="#14121b" />
        <path d="M30 216 C100 186 300 186 370 216" fill="none" stroke="#1e1a26" stroke-width="3" />
        <path d="M30 210 C100 180 300 180 370 210" fill="none" stroke="#1e1a26" stroke-width="5" stroke-dasharray="2 9" />
        <path d="M60 208 C110 190 290 190 340 208" fill="none" stroke="#2a2230" stroke-width="1" opacity="0.8" />
      </g>

      <!-- 彼岸花 -->
      <g transform="translate(54 178)">
        <g class="loading-05__flower">
          <use href="#loading05-hell-flower" />
        </g>
      </g>
      <g transform="translate(28 186) scale(0.7)">
        <g class="loading-05__flower loading-05__flower--late">
          <use href="#loading05-hell-flower" />
        </g>
      </g>
      <g transform="translate(344 182) scale(0.86)">
        <g class="loading-05__flower loading-05__flower--right">
          <use href="#loading05-hell-flower" transform="scale(-1 1)" />
        </g>
      </g>

      <!-- 落瓣 -->
      <g fill="#a8323f">
        <g transform="translate(62 168)">
          <path class="loading-05__petal loading-05__petal--a" d="M0 0 C-2 -4 -3 -8 -1 -11 C0 -12 2 -12 2 -10 C4 -7 2 -3 0 0 Z" />
        </g>
        <g transform="translate(36 158) scale(0.8)">
          <path class="loading-05__petal loading-05__petal--b" d="M0 0 C-2 -4 -3 -8 -1 -11 C0 -12 2 -12 2 -10 C4 -7 2 -3 0 0 Z" />
        </g>
        <g transform="translate(352 172)">
          <path class="loading-05__petal loading-05__petal--c" d="M0 0 C-2 -4 -3 -8 -1 -11 C0 -12 2 -12 2 -10 C4 -7 2 -3 0 0 Z" />
        </g>
      </g>

      <!-- 鬼火 -->
      <g fill="#7fd6c4">
        <circle class="loading-05__wisp" cx="88" cy="204" r="2.2" style="animation-delay: -0.6s" />
        <circle class="loading-05__wisp" cx="140" cy="198" r="1.6" style="animation-delay: -2.8s" />
        <circle class="loading-05__wisp" cx="242" cy="212" r="1.9" style="animation-delay: -1.4s" />
        <circle class="loading-05__wisp" cx="286" cy="202" r="1.5" style="animation-delay: -4.2s" />
        <circle class="loading-05__wisp" cx="196" cy="206" r="2.4" style="animation-delay: -3.5s" />
        <circle class="loading-05__wisp" cx="356" cy="196" r="1.7" style="animation-delay: -5.2s" />
      </g>

      <!-- 鬼雾 · 前 -->
      <g class="loading-05__fog loading-05__fog--near" fill="none" stroke="#2a2534" stroke-linecap="round" opacity="0.5">
        <path d="M-20 236 C60 222 120 234 200 220" stroke-width="9" />
        <path d="M220 240 C290 226 340 236 424 220" stroke-width="7" />
      </g>
    </svg>

    <div class="loading-05__focus">
      <span class="loading-05__orb">
        <img src="/favicon.svg" class="loading-05__logo" alt="Logo" draggable="false" />
      </span>
      <div class="loading-05__title">{{ appTitle }}</div>
      <div class="loading-05__scan"><span class="loading-05__scan-ink"></span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
const appTitle = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.loading-05 {
  // 天庭（浅色）：暖金晨光
  --scene-bg: linear-gradient(168deg, #fffdf7 0%, #fbf0d8 52%, #f3e3c1 100%);
  --orb-bg: radial-gradient(circle at 50% 44%, #fffefa 0%, #fdf1d6 58%, #efdcb2 100%);
  --orb-border: rgb(190 158 96 / 34%);
  --orb-glow: rgb(236 205 143 / 55%);
  --title-color: #4c3a1c;
  --title-shadow: 0 1px 0 rgb(255 253 247 / 90%);
  --scan-line: rgb(76 58 28 / 18%);
  --scan-ink: #b08a3e;
  --show-heaven: block;
  --show-hell: none;
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
    opacity: 0.05;
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

    &--heaven {
      display: var(--show-heaven);
    }

    &--hell {
      display: var(--show-hell);
    }
  }

  // ── 天庭动效 ──
  &__skyglow {
    transform-box: fill-box;
    transform-origin: center;
    animation: heaven-glow 9s ease-in-out infinite alternate;
  }

  &__aura {
    animation: aura-drift 10s ease-in-out infinite alternate;
  }

  &__drift {
    animation: cloud-drift 46s linear infinite;

    &--near {
      animation-duration: 28s;
    }
  }

  &__palace {
    animation: palace-haze 8s ease-in-out infinite alternate;

    &--right {
      animation-duration: 10.5s;
      animation-direction: alternate-reverse;
    }
  }

  &__dragon {
    animation: dragon-glint 4.6s ease-in-out infinite alternate;
  }

  &__lantern {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: lantern-swing 5.6s ease-in-out infinite alternate;

    &--right {
      animation-direction: alternate-reverse;
      animation-duration: 6.4s;
    }
  }

  &__lantern-glow {
    animation: lamp-breathe 3.4s ease-in-out infinite;
  }

  &__lotus {
    transform-box: fill-box;
    transform-origin: center;
    animation: lotus-float 6.5s ease-in-out infinite alternate;

    &--late {
      animation-duration: 8s;
      animation-direction: alternate-reverse;
    }
  }

  &__flame {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: flame-flicker 1.8s ease-in-out infinite;
  }

  &__koi {
    animation: koi-swim 22s linear infinite;

    &--back {
      animation-duration: 30s;
      animation-direction: reverse;
    }
  }

  &__koi-tail {
    transform-box: fill-box;
    transform-origin: 0% 50%;
    animation: koi-tail 0.9s ease-in-out infinite alternate;
  }

  &__ripple {
    transform-box: fill-box;
    transform-origin: center;
    animation: ripple-spread 4.6s ease-out infinite;

    &--late {
      animation-delay: -2.3s;
    }
  }

  &__crane {
    transform-box: fill-box;
    transform-origin: center;
    animation: crane-glide 8s ease-in-out infinite alternate;

    &--far {
      animation-duration: 11s;
      animation-direction: alternate-reverse;
    }
  }

  &__branch {
    transform-box: fill-box;
    transform-origin: 0% 50%;
    animation: branch-sway 6.4s ease-in-out infinite alternate;
  }

  &__mote {
    transform-box: fill-box;
    transform-origin: center;
    animation: mote-rise 7s ease-out infinite;
  }

  // ── 地府动效 ──
  &__moon-halo {
    transform-box: fill-box;
    transform-origin: center;
    animation: halo-pulse 5.6s ease-in-out infinite alternate;
  }

  &__moon-veil {
    animation: veil-drift 9s ease-in-out infinite alternate;
  }

  &__moon-shadow {
    animation: moon-shadow 7s ease-in-out infinite alternate;
  }

  &__fog {
    animation: fog-drift 14s ease-in-out infinite alternate;

    &--near {
      animation-duration: 19s;
      animation-direction: alternate-reverse;
    }
  }

  &__tree {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: tree-sway 7.5s ease-in-out infinite alternate;
  }

  &__stele-glow {
    transform-box: fill-box;
    transform-origin: center;
    animation: stele-glow 4.8s ease-in-out infinite alternate;
  }

  &__chain {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: chain-sway 4.2s ease-in-out infinite alternate;

    &--right {
      animation-direction: alternate-reverse;
      animation-duration: 5.1s;
    }
  }

  &__soul-lamp {
    transform-box: fill-box;
    transform-origin: 50% 0%;
    animation: lantern-swing 7.2s ease-in-out infinite alternate;

    &--right {
      animation-direction: alternate-reverse;
      animation-duration: 6.1s;
    }
  }

  &__wave {
    animation: wave-drift 9s linear infinite;

    &--slow {
      animation-duration: 14s;
    }

    &--fast {
      animation-duration: 5.5s;
      animation-direction: reverse;
    }
  }

  &__bridge {
    animation: bridge-breathe 6.5s ease-in-out infinite alternate;
  }

  &__flower {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: lily-sway 6s ease-in-out infinite alternate;

    &--late {
      animation-duration: 7.4s;
      animation-direction: alternate-reverse;
    }

    &--right {
      animation-duration: 8.2s;
    }
  }

  &__stamens {
    transform-box: fill-box;
    transform-origin: center;
    animation: stamen-tremble 4s ease-in-out infinite alternate;
  }

  &__petal {
    transform-box: fill-box;
    transform-origin: center;
    animation: petal-fall 7.5s linear infinite;

    &--a {
      animation-delay: -1.2s;
    }

    &--b {
      animation-delay: -3.6s;
    }

    &--c {
      animation-delay: -5.8s;
    }
  }

  &__wisp {
    transform-box: fill-box;
    transform-origin: center;
    animation: wisp-rise 6.5s ease-out infinite;
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
    animation: orb-in 820ms var(--realm-ease) both, orb-pulse 6s ease-in-out 820ms infinite;

    &::before {
      content: '';
      position: absolute;
      inset: -12px;
      border: 1px dashed var(--orb-border);
      border-radius: 50%;
      opacity: 0.55;
      animation: orb-ring 42s linear infinite;
      animation-delay: 900ms;
    }
  }

  &__logo {
    width: 54px;
    height: 54px;
    object-fit: contain;
    animation: logo-in 640ms var(--realm-ease) 220ms both, logo-breathe 5s ease-in-out 900ms infinite;
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
    animation: scan-run 2.2s ease-in-out 600ms infinite alternate;
  }
}

html.dark .loading-05 {
  // 地府（深色）：幽冥鬼气
  --scene-bg: linear-gradient(168deg, #0b0910 0%, #120c15 50%, #06050a 100%);
  --orb-bg: radial-gradient(circle at 50% 44%, #b6c6cc 0%, #7d929a 54%, #3f4f58 100%);
  --orb-border: rgb(150 178 190 / 26%);
  --orb-glow: rgb(120 170 180 / 32%);
  --title-color: #d9d0c9;
  --title-shadow: 0 1px 2px rgb(0 0 0 / 88%);
  --scan-line: rgb(217 208 201 / 16%);
  --scan-ink: #8e3540;
  --show-heaven: none;
  --show-hell: block;

  .loading-05__logo {
    filter: drop-shadow(0 0 10px rgb(150 200 210 / 38%));
  }

  .loading-05__orb::before {
    animation-duration: 58s;
    animation-direction: reverse;
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

@keyframes orb-ring {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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

@keyframes heaven-glow {
  from {
    opacity: 0.72;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes aura-drift {
  from {
    transform: translateX(0);
    opacity: 0.85;
  }
  to {
    transform: translateX(12px);
    opacity: 1;
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

@keyframes palace-haze {
  from {
    opacity: 0.22;
  }
  to {
    opacity: 0.42;
  }
}

@keyframes dragon-glint {
  from {
    opacity: 0.6;
  }
  to {
    opacity: 1;
  }
}

@keyframes lantern-swing {
  from {
    transform: rotate(-3.4deg);
  }
  to {
    transform: rotate(3.4deg);
  }
}

@keyframes lamp-breathe {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.95;
  }
}

@keyframes lotus-float {
  from {
    transform: translate(0, 0) rotate(-2deg);
  }
  to {
    transform: translate(14px, -3px) rotate(2deg);
  }
}

@keyframes flame-flicker {
  0%,
  100% {
    opacity: 0.6;
    transform: scaleY(0.92);
  }
  50% {
    opacity: 1;
    transform: scaleY(1.12);
  }
}

@keyframes koi-swim {
  from {
    transform: translateX(-46px);
  }
  to {
    transform: translateX(446px);
  }
}

@keyframes koi-tail {
  from {
    transform: rotate(-9deg);
  }
  to {
    transform: rotate(9deg);
  }
}

@keyframes ripple-spread {
  from {
    opacity: 0.6;
    transform: scale(0.4);
  }
  to {
    opacity: 0;
    transform: scale(2.6);
  }
}

@keyframes crane-glide {
  from {
    transform: translate(0, 0) rotate(-2deg);
  }
  to {
    transform: translate(-10px, -8px) rotate(2deg);
  }
}

@keyframes branch-sway {
  from {
    transform: rotate(-1.6deg);
  }
  to {
    transform: rotate(2.2deg);
  }
}

@keyframes mote-rise {
  0% {
    opacity: 0;
    transform: translateY(6px);
  }
  35% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translateY(-26px);
  }
}

@keyframes halo-pulse {
  from {
    opacity: 0.4;
    transform: scale(0.94);
  }
  to {
    opacity: 0.85;
    transform: scale(1.1);
  }
}

@keyframes veil-drift {
  from {
    transform: translateX(0);
    opacity: 0.5;
  }
  to {
    transform: translateX(10px);
    opacity: 0.8;
  }
}

@keyframes moon-shadow {
  from {
    opacity: 0.14;
    transform: scaleX(0.9);
  }
  to {
    opacity: 0.3;
    transform: scaleX(1.1);
  }
}

@keyframes fog-drift {
  from {
    transform: translateX(0);
    opacity: 0.7;
  }
  to {
    transform: translateX(-18px);
    opacity: 1;
  }
}

@keyframes tree-sway {
  from {
    transform: rotate(-1.2deg);
  }
  to {
    transform: rotate(1.5deg);
  }
}

@keyframes stele-glow {
  from {
    opacity: 0.35;
  }
  to {
    opacity: 0.9;
  }
}

@keyframes chain-sway {
  from {
    transform: rotate(-4.5deg);
  }
  to {
    transform: rotate(4.5deg);
  }
}

@keyframes wave-drift {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-200px);
  }
}

@keyframes bridge-breathe {
  from {
    opacity: 0.92;
  }
  to {
    opacity: 1;
  }
}

@keyframes lily-sway {
  from {
    transform: rotate(-2.5deg);
  }
  to {
    transform: rotate(2.5deg);
  }
}

@keyframes stamen-tremble {
  from {
    transform: rotate(-1.5deg);
  }
  to {
    transform: rotate(1.5deg);
  }
}

@keyframes petal-fall {
  0% {
    opacity: 0;
    transform: translate(0, 0) rotate(0deg);
  }
  20% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translate(18px, 46px) rotate(140deg);
  }
}

@keyframes wisp-rise {
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.7);
  }
  30% {
    opacity: 0.85;
  }
  100% {
    opacity: 0;
    transform: translateY(-52px) scale(1.05);
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
  .loading-05,
  .loading-05 *,
  .loading-05 *::before,
  .loading-05 *::after {
    animation: none !important;
  }
}
</style>
