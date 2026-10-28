<script lang="ts">
	import type { PageProps } from "./$types";
	import { enhance } from '$app/forms';

  let search = $state('');
  let sortBy = $state('name');

  let {  data,form }: PageProps = $props();

  let filteredCategories = $derived(data.categories.filter((c) => `${c.name} ${c.slug} ${c.id}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sortBy === 'products' ? b.product_count - a.product_count : a.name.localeCompare(b.name)));
  let productTotal = $derived(data.categories.reduce((total, category) => total + category.product_count, 0));


  let isCreateModalOpen = $state(false);
  let isSubmitting = $state(false);
</script>

<svelte:head><title>Categories · Nestify Admin</title></svelte:head>

<div class="space-y-7">
  <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div><div class="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#96938b]"><span>Catalog</span><span>/</span><span class="text-[#4b4943]">Categories</span></div><h1 class="font-serif text-[34px] leading-tight tracking-[-0.04em] sm:text-[40px]">Categories</h1><p class="mt-2 text-sm text-[#85837c]">Organize products into clear, easy-to-browse collections.</p></div>
    <button onclick={() => isCreateModalOpen = true } class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#222220] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#3a3935] active:scale-[0.98]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>Add category</button>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Total categories</span><span class="rounded-lg bg-[#f4f1eb] p-2 text-[#8d6e4f]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3.5" y="4" width="7" height="7" rx="1.5"/><rect x="13.5" y="4" width="7" height="7" rx="1.5"/><rect x="3.5" y="14" width="7" height="6" rx="1.5"/><rect x="13.5" y="14" width="7" height="6" rx="1.5"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{data.categories.length.toString().padStart(2, '0')}</p><p class="mt-1 text-[11px] text-[#a09e97]">Unique product groups</p></div>
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Products categorized</span><span class="rounded-lg bg-[#eaf3ed] p-2 text-[#44785b]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m5 12 4 4L19 6"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{productTotal.toString().padStart(2, '0')}</p><p class="mt-1 text-[11px] text-[#a09e97]">Products across all categories</p></div>
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Largest category</span><span class="rounded-lg bg-[#f4f1eb] p-2 text-[#8d6e4f]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 19V5m0 14h16M8 15v-4m4 4V7m4 8V9"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{[...data.categories].sort((a, b) => b.product_count - a.product_count)[0]?.name ?? '—'}</p><p class="mt-1 text-[11px] text-[#a09e97]">Most products assigned</p></div>
  </div>

  <section class="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
    <div class="flex flex-col gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 class="text-sm font-semibold">All categories <span class="ml-1.5 rounded-md bg-[#f3f2ef] px-2 py-1 text-[10px] font-medium text-[#77756e]">{filteredCategories.length}</span></h2><p class="mt-1 text-[11px] text-[#99978f]">Manage category names and product groupings.</p></div><div class="flex flex-col gap-2 sm:flex-row"><label class="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-black/[0.08] px-3 sm:w-64"><svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-[#99978f]" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input bind:value={search} placeholder="Search categories..." class="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-[#aaa89f]" /></label><select bind:value={sortBy} aria-label="Sort categories" class="h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#55534e] outline-none focus:border-[#b68b65]"><option value="name">Name A–Z</option><option value="products">Most products</option></select></div></div>

    <div class="hidden overflow-x-auto md:block"><table class="w-full border-collapse text-left"><thead><tr class="bg-[#faf9f7] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#929088]"><th class="px-5 py-3.5">Category</th><th class="px-4 py-3.5">Slug</th><th class="px-4 py-3.5">Products</th><th class="px-4 py-3.5">Created</th><th class="px-5 py-3.5 text-right">Actions</th></tr></thead><tbody>{#each filteredCategories as category (category.id)}<tr class="border-t border-black/[0.055] transition hover:bg-[#fdfcfb]"><td class="px-5 py-4"><div class="flex items-center gap-3"><span class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e9e3da] bg-[#f7f3ed] text-[#8b745d]"><svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4.4 7.8 7.6 4.4 7.6-4.4M12 12.2V21"/></svg></span><div><p class="text-xs font-semibold">{category.name}</p><p class="mt-1 text-[10px] text-[#99978f]">{category.description}</p></div></div></td><td class="px-4 py-4"><code class="rounded-md bg-[#f7f6f3] px-2 py-1 text-[10px] text-[#77756e]">/{category.slug}</code></td><td class="px-4 py-4"><span class="inline-flex min-w-8 items-center justify-center rounded-lg bg-[#f3f0eb] px-2.5 py-1.5 text-[10px] font-semibold text-[#71614f]">{category.product_count}</span><span class="ml-2 text-[10px] text-[#99978f]">{category.product_count === 1 ? 'product' : 'products'}</span></td><td class="px-4 py-4 text-[11px] text-[#77756e]">{new Date(category.created_at).toLocaleDateString('en-US', {
  		month: 'short',
  		day: '2-digit',
  		year: 'numeric',
  		timeZone: 'UTC',
	})}</td><td class="px-5 py-4"><div class="flex justify-end gap-1.5"><button aria-label={`Edit ${category.name}`} onclick={() => alert(`Connect edit action for ${category.name}.`)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-[#68665f] transition hover:border-black/20 hover:bg-[#f6f5f2]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg></button><button aria-label={`Delete ${category.name}`} onclick={() => removeCategory(category.id)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-[#8a7770] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg></button></div></td></tr>{:else}<tr><td colspan="5" class="px-5 py-14 text-center"><p class="text-sm font-medium">No categories found</p><p class="mt-1 text-xs text-[#99978f]">Try another search term.</p></td></tr>{/each}</tbody></table></div>

    <div class="divide-y divide-black/[0.06] md:hidden">{#each filteredCategories as category (category.id)}<article class="flex items-center gap-3 p-4"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e9e3da] bg-[#f7f3ed] text-[#8b745d]"><svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4.4 7.8 7.6 4.4 7.6-4.4M12 12.2V21"/></svg></span><div class="min-w-0 flex-1"><div class="flex items-center justify-between gap-2"><p class="truncate text-xs font-semibold">{category.name}</p><span class="shrink-0 rounded-lg bg-[#f3f0eb] px-2 py-1 text-[10px] font-medium text-[#71614f]">{category.product_count} {category.product_count === 1 ? 'product' : 'products'}</span></div><p class="mt-1 truncate text-[10px] text-[#99978f]">/{category.slug} · Created {category.created_at}</p><p class="mt-1 truncate text-[10px] text-[#77756e]">{category.description}</p></div><div class="flex shrink-0 gap-1"><button aria-label={`Edit ${category.name}`} onclick={() => alert(`Connect edit action for ${category.name}.`)} class="rounded-lg border border-black/10 p-2 text-[#68665f]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg></button><button aria-label={`Delete ${category.name}`} onclick={() => removeCategory(category.id)} class="rounded-lg border border-black/10 p-2 text-[#8a7770]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg></button></div></article>{:else}<div class="p-10 text-center text-xs text-[#99978f]">No categories found.</div>{/each}</div>
    <div class="flex flex-col gap-2 border-t border-black/[0.06] bg-[#fdfcfb] px-5 py-3.5 text-[10px] text-[#99978f] sm:flex-row sm:items-center sm:justify-between"><span>Showing <strong class="font-semibold text-[#5e5c56]">{filteredCategories.length}</strong> of {data.categories.length} categories</span><span>Categories are text-based · No image required</span></div>
  </section>
</div>

<!-- Create Category Modal -->
{#if isCreateModalOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
	>
		<!-- Modal Content -->
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="create-category-title"
			class="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
		>
			<!-- Modal Header -->
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2
						id="create-category-title"
						class="text-lg font-semibold text-neutral-900"
					>
						Create Category
					</h2>

					<p class="mt-1 text-sm text-neutral-500">
						Add a new category to your catalog.
					</p>
				</div>

				<button
					type="button"
					onclick={() => {
						isCreateModalOpen = false;
					}}
					aria-label="Close modal"
					class="rounded-lg p-1 text-xl leading-none text-neutral-400
						transition hover:bg-neutral-100 hover:text-neutral-900"
				>
					&times;
				</button>
			</div>

			<!-- Form -->
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					isSubmitting = true;

					return async ({ result, update }) => {
						isSubmitting = false;

						if (result.type === 'success') {
							isCreateModalOpen = false;
						}

						await update();
					};
				}}
				class="mt-6 space-y-5"
			>
				<div>
					<label
						for="category-name"
						class="mb-2 block text-sm font-medium text-neutral-700"
					>
						Category Name
					</label>

					<input
						id="category-name"
						name="name"
						type="text"
						required
						maxlength="100"
						placeholder="e.g. Smartwatch"
						class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3
							text-sm text-neutral-900 outline-none transition
							placeholder:text-neutral-400
							focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10"
					/>

					{#if form?.error}
    					<p class="mt-2 text-sm text-red-600" role="alert">
        					{form.error}
    					</p>
					{:else if form?.success}
    					<p class="mt-2 text-sm text-green-600" role="status">
        					Berhasil menyimpan data.
    					</p>
					{/if}
				</div>

				<!-- Modal Footer -->
				<div class="flex justify-end gap-3 border-t border-neutral-100 pt-4">
					<button
						type="button"
						onclick={() => {
							isCreateModalOpen = false;
						}}
						class="rounded-xl border border-neutral-200 px-4 py-2.5
							text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						class="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium
							text-white transition hover:bg-neutral-700
							disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? 'Creating...' : 'Create Category'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}