<script lang="ts">
  import { page } from '$app/state';

  let mobileMenuOpen = $state(false);

  const navItems = [
    { label: 'Products', href: '/admin/products', icon: 'box' },
    { label: 'Categories', href: '/admin/categories', icon: 'layers' }
  ];

  function isActive(href: string) {
    if (href === '/admin') return page.url.pathname === href;
    return page.url.pathname.startsWith(href);
  }

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <title>Nestify Admin</title>
  <meta name="description" content="Manage your Nestify product catalog." />
</svelte:head>

<div class="min-h-screen bg-[#f6f5f2] text-[#20201e] lg:flex">
  {#if mobileMenuOpen}
    <button class="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close navigation" onclick={() => (mobileMenuOpen = false)}></button>
  {/if}

  <aside class={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-black/[0.06] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <a href="/admin/products" class="flex h-[76px] items-center gap-3 border-b border-black/[0.06] px-7">
      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#20201e] text-white">
        <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/><path d="M8 8h.01M16 8h.01"/></svg>
      </span>
      <span class="text-[17px] font-semibold tracking-tight">Nestify<span class="text-[#b68b65]">.</span></span>
    </a>

    <div class="px-4 pt-7">
      <p class="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b9993]">Workspace</p>
      <nav class="space-y-1">
        {#each navItems as item}
          <a href={item.href} onclick={() => (mobileMenuOpen = false)} class={`group flex items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-medium transition ${isActive(item.href) ? 'bg-[#242422] text-white shadow-sm' : 'text-[#686761] hover:bg-[#f5f4f1] hover:text-[#20201e]'}`}>
            {#if item.icon === 'grid'}
              <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>
            {:else if item.icon === 'box'}
              <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21M8 5.1l8.5 4.6"/></svg>
            {:else}
              <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4" width="7" height="7" rx="1.5"/><rect x="13.5" y="4" width="7" height="7" rx="1.5"/><rect x="3.5" y="14" width="7" height="6" rx="1.5"/><rect x="13.5" y="14" width="7" height="6" rx="1.5"/></svg>
            {/if}
            {item.label}
            {#if isActive(item.href)}<span class="ml-auto h-1.5 w-1.5 rounded-full bg-[#d7b594]"></span>{/if}
          </a>
        {/each}
      </nav>
    </div>

    <div class="mt-auto border-t border-black/[0.06] p-4">
      <div class="mb-3 flex items-center gap-3 rounded-xl bg-[#f8f7f4] p-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8d9c9] text-xs font-semibold text-[#6f5038]">EK</div>
        <div class="min-w-0 flex-1"><p class="truncate text-xs font-semibold">Edwin Kesuma</p><p class="mt-0.5 text-[10px] text-[#89877f]">Administrator</p></div>
        <svg viewBox="0 0 24 24" class="h-4 w-4 text-[#89877f]" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 10 5 5 5-5"/></svg>
      </div>
      <a href="/logout" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#77756e] transition hover:bg-[#f5f4f1] hover:text-[#20201e]">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
        Sign out
      </a>
    </div>
  </aside>

  <div class="min-w-0 flex-1">
    <main class="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
      {@render children()}
    </main>
    <footer class="px-4 pb-6 text-center text-[10px] text-[#a09e97] sm:px-7 lg:px-10">© 2026 Nestify Admin · Crafted for a calmer workflow</footer>
  </div>
</div>
