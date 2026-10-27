<template>
  <div class="pricing">
    <div class="pricing-header">
      <h2 class="pricing-header__title">{{ VITE_APP_TITLE }}</h2>
      <p class="pricing-header__subtitle">前端进阶全栈的最佳选择</p>
      <p class="pricing-header__description">本项目基于 MIT 协议开源免费，当前页面为定价模板，仅作演示用途</p>
    </div>

    <div class="pricing-cards">
      <div v-for="(plan, index) in plans" :key="index" class="pricing-card" :class="{ 'pricing-card--highlight': selectedIndex === index }" @click="handleSelect(index)">
        <div class="pricing-card__content">
          <div class="pricing-card__header">
            <h3 class="pricing-card__title">{{ plan.title }}</h3>
            <p class="pricing-card__description">{{ plan.description }}</p>
          </div>

          <div class="pricing-card__price">
            <span class="pricing-card__currency">¥</span>
            <span class="pricing-card__amount">{{ plan.price }}</span>
            <span class="pricing-card__period">/一次性付款</span>
          </div>

          <ul class="pricing-card__features">
            <li v-for="(feature, fIndex) in plan.features" :key="fIndex" class="pricing-card__feature" :class="{ 'pricing-card__feature--disabled': !feature.available }">
              <span class="pricing-card__icon">
                <SvgIcon v-if="feature.available" name="Check" />
                <SvgIcon v-else name="Close" />
              </span>
              <span class="pricing-card__text">{{ feature.text }}</span>
            </li>
          </ul>
        </div>

        <button class="pricing-card__button">立即购买</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const VITE_APP_TITLE = import.meta.env.VITE_APP_TITLE

interface Feature {
  text: string
  available: boolean
}

interface Plan {
  type: string
  title: string
  description: string
  price: number
  features: Feature[]
}

const plans: Plan[] = [
  {
    type: 'starter',
    title: '新手入门版',
    description: '适合前端初学者，从零学习 Vue 3 + TypeScript，掌握基础企业级后台开发技能。包含完整源码和详细技术文档，快速上手使用。',
    price: 349,
    features: [
      { text: '完整前端源码', available: true },
      { text: '详细技术文档', available: true },
      { text: '后端源码', available: false },
      { text: '单个项目使用', available: true },
      { text: '一年技术支持', available: true },
      { text: '一年免费更新', available: true },
    ],
  },
  {
    type: 'professional',
    title: '职业进阶版',
    description: '适合有一定基础的前端开发者，学习完整的前后端交互，掌握 NestJS + MySQL + Redis 全栈开发。包含完整源码和详细技术文档，快速上手使用。',
    price: 629,
    features: [
      { text: '完整前端源码', available: true },
      { text: '详细技术文档', available: true },
      { text: '后端源码', available: true },
      { text: '无限项目使用', available: true },
      { text: '一年技术支持', available: true },
      { text: '一年免费更新', available: true },
    ],
  },
  {
    type: 'enterprise',
    title: '企业授权版',
    description: '适合企业团队，提供完整的前后端源码，支持深度定制和商业应用。包含完整源码和详细技术文档，快速上手使用。',
    price: 2099,
    features: [
      { text: '完整前端源码', available: true },
      { text: '详细技术文档', available: true },
      { text: '后端源码', available: true },
      { text: '单个商业项目使用', available: true },
      { text: '一年技术支持', available: true },
      { text: '一年免费更新', available: true },
    ],
  },
  {
    type: 'ultimate',
    title: '无限授权版',
    description: '适合多个商业项目，提供完整的前后端源码，支持深度定制和无限制商业应用。包含完整源码和详细技术文档，快速上手使用。',
    price: 3499,
    features: [
      { text: '完整前端源码', available: true },
      { text: '详细技术文档', available: true },
      { text: '后端源码', available: true },
      { text: '无限商业项目使用', available: true },
      { text: '一年技术支持', available: true },
      { text: '一年免费更新', available: true },
    ],
  },
]

const selectedIndex = ref<number>(0)

function handleSelect(index: number) {
  selectedIndex.value = index
}
</script>

<style lang="scss" scoped>
.pricing {
  height: 100%;
  padding: 16px;
}

.pricing-header {
  text-align: center;
  margin-bottom: 32px;

  &__title {
    font-size: 32px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 12px;
  }

  &__subtitle {
    font-size: 18px;
    color: var(--el-text-color-regular);
    margin: 0 0 24px;
  }

  &__description {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    margin: 0;
  }
}

.pricing-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 20px;
}

.pricing-card {
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 32px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 2px solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  &--highlight {
    border-color: var(--el-color-primary);
    background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);
  }

  &__content {
    flex: 1;
  }

  &__header {
    min-height: 90px;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 8px;
  }

  &__description {
    font-size: 13px;
    color: var(--el-text-color-regular);
    margin: 0;
    line-height: 1.6;
  }

  &__price {
    min-height: 80px;
    margin-bottom: 24px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--el-border-color);
    display: flex;
    align-items: flex-end;
  }

  &__currency {
    font-size: 24px;
    font-weight: 500;
    color: var(--el-color-primary);
    margin-right: 4px;
  }

  &__amount {
    font-size: 48px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__period {
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    margin-left: 8px;
  }

  &__features {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  &__feature {
    display: flex;
    align-items: center;
    padding: 10px 0;
    font-size: 14px;
    color: var(--el-text-color-regular);

    &--disabled {
      opacity: 0.5;

      .pricing-card__icon {
        color: var(--el-color-danger);
      }
    }
  }

  &__icon {
    width: 16px;
    height: 16px;
    margin-right: 10px;
    color: var(--el-color-success);
    flex-shrink: 0;
  }

  &__text {
    line-height: 1.5;
  }

  &__button {
    width: 100%;
    padding: 12px 24px;
    background: var(--el-color-primary);
    color: var(--el-color-white);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    margin-top: 24px;

    &:hover {
      background: var(--el-color-primary-light-3);
    }

    &:active {
      transform: scale(0.98);
    }
  }
}
</style>
