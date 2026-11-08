<script lang="ts">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { supabase } from '#lib/supabase/client.ts';

  let mobileMenuOpen = $state(false);

  const navItems = [
    { label: 'Products', href: '/admin/products', icon: 'box' },
    { label: 'Categories', href: '/admin/categories', icon: 'layers' }
  ];

  function isActive(href: string) {
    if (href === '/admin') return page.url.pathname === href;
    return page.url.pathname.startsWith(href);
  }

  let { data, children }: LayoutProps = $props();

  async function handleLogout() {
		const { error } = await supabase.auth.signOut();

		if (error) {
			console.error('Logout failed:', error.message);
			return;
		}

		await goto('/auth/login');
	}
</script>

<svelte:head>
  <title>Garmin Pakuwon Mall Surabaya Admin</title>
  <meta name="description" content="Manage your Garmin Pakuwon Mall Surabaya product catalog." />
</svelte:head>

<div class="min-h-screen bg-[#f6f5f2] text-[#20201e] lg:flex">
  {#if mobileMenuOpen}
    <button class="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Close navigation" onclick={() => (mobileMenuOpen = false)}></button>
  {/if}

  <aside class={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-black/[0.06] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
    <a href="/admin/products" class="logo flex h-[76px] items-center gap-3 border-b border-black/[0.06] px-7">
			<span class="logo-icon">G</span>
			<span class="text-sm">Garmin Pakuwon<br> Mall Surabaya<span class="logo-accent">.</span></span>
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
        <div class="min-w-0 flex-1"><p class="truncate text-xs font-semibold">{data.profile.full_name}</p><p class="mt-0.5 text-[10px] text-[#89877f]">{data.profile.role.split(' ')
	        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
	        .join(' ')}</p></div>
      </div>
      <button 
        onclick={handleLogout} 
        class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs text-[#77756e] transition hover:bg-[#f5f4f1] hover:text-[#20201e]">
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>
          Sign out
      </button>
    </div>
  </aside>

  <div class="min-w-0 flex-1">
    <main class="mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-10">
      {@render children()}
    </main>
    <footer class="px-4 pb-6 text-center text-[10px] text-[#a09e97] sm:px-7 lg:px-10">© 2026 Garmin Pakuwon Mall Surabaya Admin · Crafted for a calmer workflow</footer>
  </div>
</div>

<style>
  .logo {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 21px;
		font-weight: 750;
		white-space: nowrap;
	}

	.logo-icon {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 10px;
		background: #252525;
		color: white;
		font-size: 18px;
	}

	.logo-accent {
		color: #bd895f;
	}
</style>