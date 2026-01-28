<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/order', label: '訂購', icon: 'receipt' },
  { to: '/orders', label: '我的訂單', icon: 'bag' },
  { to: '/stats', label: '統計', icon: 'chart' },
  { to: '/admin', label: '管理', icon: 'gear' }
]

const activePath = computed(() => route.path)

function iconPath(name) {
  switch (name) {
    case 'receipt':
      return 'M7 2h10a2 2 0 0 1 2 2v18l-3-2-3 2-3-2-3 2-3-2V4a2 2 0 0 1 2-2Zm2 6h8M9 12h8M9 16h6'
    case 'bag':
      return 'M7 7h10l1.2 14H5.8L7 7Zm2.2 0a3.8 3.8 0 0 1 7.6 0'
    case 'chart':
      return 'M6 20V10m6 10V4m6 16v-8'
    case 'gear':
      return 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.5-3.5-1.7.6.1 1.8-1.8 1-1.2-1.4-1.8.5-.6 1.7H10l-.6-1.7-1.8-.5-1.2 1.4-1.8-1 .1-1.8-1.7-.6V10l1.7-.6-.1-1.8 1.8-1 1.2 1.4 1.8-.5L10 6h4l.6 1.7 1.8.5 1.2-1.4 1.8 1-.1 1.8 1.7.6v2Z'
    default:
      return 'M12 12h0'
  }
}
</script>

<template>
  <div class="min-h-dvh bg-paper text-ink">
    <div class="mx-auto min-h-dvh max-w-[980px] px-4 pb-28 pt-7 sm:px-6">
      <header class="relative mb-6">
        <div class="menu-plate">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold tracking-[0.35em] text-cocoa/70">OFFICE ORDER</p>
              <h1 class="mt-2 font-display text-3xl leading-[1.06] text-cocoa sm:text-4xl">
                Warm Menu System
              </h1>
              <p class="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink/80">
                一個簡潔、耐看的辦公室訂餐入口。先把骨架與風格立好，之後再接 GAS API。
              </p>
            </div>
            <div class="hidden sm:block">
              <div class="seal">
                <span class="seal__ring"></span>
                <span class="seal__text">TODAY</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-between">
          <div class="text-xs text-ink/65">
            <span class="font-semibold text-ink/80">目前頁面：</span>
            <span class="font-semibold text-cocoa">{{ route.meta?.title ?? '—' }}</span>
          </div>
          <div class="hidden sm:flex items-center gap-2">
            <span class="h-[1px] w-10 bg-cocoa/20"></span>
            <span class="text-xs tracking-[0.25em] text-ink/50">HASH ROUTER</span>
          </div>
        </div>
      </header>

      <main class="relative">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="activePath" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <nav class="nav-dock" aria-label="底部導覽列">
      <div class="nav-dock__inner">
        <RouterLink
          v-for="t in tabs"
          :key="t.to"
          :to="t.to"
          class="nav-item"
          :class="{ 'is-active': activePath === t.to }"
        >
          <svg viewBox="0 0 24 24" class="nav-icon" aria-hidden="true">
            <path
              :d="iconPath(t.icon)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span class="nav-label">{{ t.label }}</span>
        </RouterLink>

        <div class="nav-cta" aria-hidden="true">
          <span class="nav-cta__chip">CTA</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.menu-plate {
  position: relative;
  border-radius: 18px;
  background:
    radial-gradient(1200px 280px at 18% 0%, hsl(var(--saffron) / 0.14), transparent 55%),
    radial-gradient(900px 340px at 85% 8%, hsl(var(--clay) / 0.18), transparent 62%),
    linear-gradient(180deg, hsl(var(--paper) / 0.92), hsl(var(--paper) / 0.76));
  box-shadow: var(--shadow-paper);
  border: 1px solid hsl(var(--cocoa) / 0.12);
  padding: 22px 18px;
  overflow: hidden;
}

.menu-plate::before {
  content: '';
  position: absolute;
  inset: -30px;
  background:
    repeating-linear-gradient(
      135deg,
      hsl(var(--cocoa) / 0.045) 0px,
      hsl(var(--cocoa) / 0.045) 1px,
      transparent 1px,
      transparent 10px
    );
  transform: rotate(-1.5deg);
  pointer-events: none;
}

.seal {
  position: relative;
  width: 74px;
  height: 74px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 30%, hsl(var(--saffron) / 0.95), hsl(var(--clay) / 0.86));
  box-shadow: 0 18px 40px -28px hsl(var(--cocoa) / 0.55);
  border: 1px solid hsl(var(--cocoa) / 0.18);
}

.seal__ring {
  position: absolute;
  inset: 7px;
  border-radius: 999px;
  border: 1px dashed hsl(var(--cocoa) / 0.35);
}

.seal__text {
  font-family: 'Playfair Display SC', serif;
  letter-spacing: 0.22em;
  font-size: 12px;
  color: hsl(var(--cocoa) / 0.9);
}

.nav-dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 14px 18px;
  background: linear-gradient(180deg, transparent, hsl(var(--paper) / 0.86) 40%, hsl(var(--paper) / 0.92));
  backdrop-filter: blur(10px);
}

.nav-dock__inner {
  position: relative;
  margin: 0 auto;
  max-width: 980px;
  border-radius: 22px;
  border: 1px solid hsl(var(--cocoa) / 0.16);
  background:
    radial-gradient(460px 110px at 50% 0%, hsl(var(--saffron) / 0.18), transparent 60%),
    linear-gradient(180deg, hsl(var(--paper) / 0.88), hsl(var(--paper) / 0.8));
  box-shadow: 0 22px 60px -36px hsl(var(--cocoa) / 0.55);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px;
  overflow: hidden;
}

.nav-dock__inner::before {
  content: '';
  position: absolute;
  inset: -20px;
  background:
    repeating-linear-gradient(
      90deg,
      transparent 0px,
      transparent 14px,
      hsl(var(--cocoa) / 0.04) 14px,
      hsl(var(--cocoa) / 0.04) 15px
    );
  pointer-events: none;
}

.nav-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  border-radius: 16px;
  color: hsl(var(--ink) / 0.72);
  text-decoration: none;
  transition: transform 160ms ease, background-color 160ms ease, color 160ms ease;
}

.nav-item:hover {
  transform: translateY(-1px);
  background: hsl(var(--saffron) / 0.12);
  color: hsl(var(--cocoa) / 0.85);
}

.nav-item.is-active {
  background: hsl(var(--saffron) / 0.22);
  color: hsl(var(--cocoa) / 0.92);
}

.nav-icon {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 11px;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.nav-cta {
  position: absolute;
  right: 10px;
  top: 10px;
  width: 62px;
  height: 62px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, hsl(var(--saffron) / 0.95), hsl(var(--clay) / 0.85));
  box-shadow: 0 18px 46px -30px hsl(var(--cocoa) / 0.7);
  border: 1px solid hsl(var(--cocoa) / 0.16);
  opacity: 0.8;
  transform: translate(8px, -18px);
  pointer-events: none;
}

.nav-cta__chip {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: 'Playfair Display SC', serif;
  letter-spacing: 0.24em;
  font-size: 11px;
  color: hsl(var(--cocoa) / 0.85);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .nav-item {
    transition: none;
  }
  .nav-item:hover {
    transform: none;
  }
}

@media (min-width: 640px) {
  .menu-plate {
    padding: 26px 24px;
  }
}
</style>
