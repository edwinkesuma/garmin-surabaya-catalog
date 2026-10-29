<script lang="ts">
	import { goto } from "$app/navigation";

  let search = $state('');
  let categoryFilter = $state('All categories');

  const categories = ['Sofa', 'Table', 'Chair', 'Bed', 'Lamp', 'Speaker'];
  let products = $state([
    { id: 'PRD-001', name: 'Lume Sofa', description: '3 Seater · Linen fabric', category: 'Sofa', price: 1299, stock: 12, status: 'Published', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-002', name: 'Oakwood Coffee Table', description: 'Solid oak · 90 cm', category: 'Table', price: 349, stock: 25, status: 'Published', image: 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-003', name: 'Arlo Lounge Chair', description: 'Bouclé fabric · Natural oak', category: 'Chair', price: 599, stock: 8, status: 'Published', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-004', name: 'Vera Floor Lamp', description: 'Metal · 150 cm', category: 'Lamp', price: 249, stock: 15, status: 'Published', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-005', name: 'Rena Bed', description: 'Wood · Queen size', category: 'Bed', price: 899, stock: 5, status: 'Draft', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-006', name: 'Aira Speaker', description: 'Bluetooth · Matte black', category: 'Speaker', price: 129, stock: 30, status: 'Published', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=160&q=80' },
    { id: 'PRD-007', name: 'Milo Side Table', description: 'Solid ash · 45 cm', category: 'Table', price: 189, stock: 0, status: 'Draft', image: 'https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=160&q=80' }
  ]);

  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  let filteredProducts = $derived(products.filter((p) => (categoryFilter === 'All categories' || p.category === categoryFilter) && `${p.name} ${p.description} ${p.id}`.toLowerCase().includes(search.toLowerCase())));
  let publishedCount = $derived(products.filter((p) => p.status === 'Published').length);
  let lowStockCount = $derived(products.filter((p) => p.stock < 6).length);

  function removeProduct(id: string) {
    if (confirm('Delete this product from the demo list?')) products = products.filter((p) => p.id !== id);
  }
</script>

<svelte:head><title>Products · GARMIN PAKUWON Admin</title></svelte:head>

<div class="space-y-7">
  <div class="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div><div class="mb-2 flex items-center gap-2 text-[11px] font-medium text-[#96938b]"><span>Catalog</span><span>/</span><span class="text-[#4b4943]">Products</span></div><h1 class="font-serif text-[34px] leading-tight tracking-[-0.04em] sm:text-[40px]">Products</h1><p class="mt-2 text-sm text-[#85837c]">Manage your inventory and keep your catalog in shape.</p></div>
    <button 
      onclick={() => goto("/admin/products/create")} 
      class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#222220] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#3a3935] active:scale-[0.98]"
    >
      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Add product
    </button>
  </div>

  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Total products</span><span class="rounded-lg bg-[#f4f1eb] p-2 text-[#8d6e4f]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m12 3 8.5 4.5v9L12 21l-8.5-4.5v-9z"/><path d="m3.8 7.7 8.2 4.5 8.2-4.5M12 12.2V21"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{products.length.toString().padStart(2, '0')}</p><p class="mt-1 text-[11px] text-[#a09e97]">Across {categories.length} categories</p></div>
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Published</span><span class="rounded-lg bg-[#eaf3ed] p-2 text-[#44785b]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m5 12 4 4L19 6"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{publishedCount.toString().padStart(2, '0')}</p><p class="mt-1 text-[11px] text-[#a09e97]">Visible in your storefront</p></div>
    <div class="rounded-2xl border border-black/[0.06] bg-white p-5"><div class="flex items-center justify-between"><span class="text-xs text-[#85837c]">Low stock</span><span class="rounded-lg bg-[#fbf0e4] p-2 text-[#a46f37]"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 3 22 20H2z"/><path d="M12 9v4m0 3h.01"/></svg></span></div><p class="mt-3 text-2xl font-semibold tracking-tight">{lowStockCount.toString().padStart(2, '0')}</p><p class="mt-1 text-[11px] text-[#a09e97]">Products with 5 or fewer items</p></div>
  </div>

  <section class="overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
    <div class="flex flex-col gap-3 border-b border-black/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div><h2 class="text-sm font-semibold">All products <span class="ml-1.5 rounded-md bg-[#f3f2ef] px-2 py-1 text-[10px] font-medium text-[#77756e]">{filteredProducts.length}</span></h2><p class="mt-1 text-[11px] text-[#99978f]">A complete view of your product listings.</p></div>
      <div class="flex flex-col gap-2 xs:flex-row sm:flex-row">
        <label class="flex h-10 min-w-0 items-center gap-2 rounded-xl border border-black/[0.08] px-3 sm:w-56"><svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-[#99978f]" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input bind:value={search} placeholder="Search products..." class="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-[#aaa89f]" /></label>
        <select bind:value={categoryFilter} aria-label="Filter by category" class="h-10 rounded-xl border border-black/[0.08] bg-white px-3 text-xs text-[#55534e] outline-none focus:border-[#b68b65]"><option>All categories</option>{#each categories as category}<option>{category}</option>{/each}</select>
      </div>
    </div>

    <div class="hidden overflow-x-auto md:block">
      <table class="w-full border-collapse text-left"><thead><tr class="bg-[#faf9f7] text-[10px] font-semibold uppercase tracking-[0.1em] text-[#929088]"><th class="px-5 py-3.5">Product</th><th class="px-4 py-3.5">Category</th><th class="px-4 py-3.5">Price</th><th class="px-4 py-3.5">Stock</th><th class="px-4 py-3.5">Status</th><th class="px-5 py-3.5 text-right">Actions</th></tr></thead>
      <tbody>{#each filteredProducts as product (product.id)}<tr class="border-t border-black/[0.055] transition hover:bg-[#fdfcfb]"><td class="px-5 py-3"><div class="flex items-center gap-3"><img src={product.image} alt={product.name} class="h-[54px] w-[62px] rounded-xl border border-black/[0.05] bg-[#f3f0eb] object-cover"/><div><p class="text-xs font-semibold text-[#282825]">{product.name}</p><p class="mt-1 text-[11px] text-[#99978f]">{product.description}</p><p class="mt-1 text-[9px] tracking-wide text-[#b0aea7]">{product.id}</p></div></div></td><td class="px-4 py-3"><span class="rounded-lg bg-[#f3f0eb] px-2.5 py-1.5 text-[10px] font-medium text-[#71614f]">{product.category}</span></td><td class="px-4 py-3 text-xs font-semibold">{money(product.price)}</td><td class="px-4 py-3"><span class={`text-xs font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 6 ? 'text-[#ad773e]' : 'text-[#4b4943]'}`}>{product.stock} <span class="font-normal text-[#a6a39b]">units</span></span></td><td class="px-4 py-3"><span class={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${product.status === 'Published' ? 'bg-[#eaf3ed] text-[#47785c]' : 'bg-[#f3f0eb] text-[#81796c]'}`}><span class={`h-1.5 w-1.5 rounded-full ${product.status === 'Published' ? 'bg-[#5d9a74]' : 'bg-[#aaa092]'}`}></span>{product.status}</span></td><td class="px-5 py-3"><div class="flex justify-end gap-1.5"><button aria-label={`Edit ${product.name}`} onclick={() => alert(`Connect edit action for ${product.name}.`)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-[#68665f] transition hover:border-black/20 hover:bg-[#f6f5f2]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg></button><button aria-label={`Delete ${product.name}`} onclick={() => removeProduct(product.id)} class="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.08] text-[#8a7770] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg></button></div></td></tr>{:else}<tr><td colspan="6" class="px-5 py-14 text-center"><p class="text-sm font-medium">No products found</p><p class="mt-1 text-xs text-[#99978f]">Try a different search or category.</p></td></tr>{/each}</tbody></table>
    </div>

    <div class="divide-y divide-black/[0.06] md:hidden">{#each filteredProducts as product (product.id)}<article class="flex gap-3 p-4"><img src={product.image} alt={product.name} class="h-[76px] w-[82px] shrink-0 rounded-xl border border-black/[0.05] bg-[#f3f0eb] object-cover"/><div class="min-w-0 flex-1"><div class="flex items-start justify-between gap-2"><div class="min-w-0"><p class="truncate text-xs font-semibold">{product.name}</p><p class="mt-1 truncate text-[10px] text-[#99978f]">{product.description}</p></div><span class={`shrink-0 rounded-full px-2 py-1 text-[9px] ${product.status === 'Published' ? 'bg-[#eaf3ed] text-[#47785c]' : 'bg-[#f3f0eb] text-[#81796c]'}`}>{product.status}</span></div><div class="mt-2.5 flex items-center justify-between"><div><p class="text-xs font-semibold">{money(product.price)}</p><p class="mt-1 text-[10px] text-[#99978f]">{product.category} · {product.stock} in stock</p></div><div class="flex gap-1"><button aria-label={`Edit ${product.name}`} onclick={() => alert(`Connect edit action for ${product.name}.`)} class="rounded-lg border border-black/10 p-2 text-[#68665f]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m14 5 5 5M4 20l4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10z"/></svg></button><button aria-label={`Delete ${product.name}`} onclick={() => removeProduct(product.id)} class="rounded-lg border border-black/10 p-2 text-[#8a7770]"><svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M10 11v6m4-6v6M5.5 7l1 14h11l1-14M9 7V4h6v3"/></svg></button></div></div></div></article>{:else}<div class="p-10 text-center text-xs text-[#99978f]">No products found.</div>{/each}</div>
    <div class="flex flex-col gap-2 border-t border-black/[0.06] bg-[#fdfcfb] px-5 py-3.5 text-[10px] text-[#99978f] sm:flex-row sm:items-center sm:justify-between"><span>Showing <strong class="font-semibold text-[#5e5c56]">{filteredProducts.length}</strong> of {products.length} products</span><span>Inventory overview · Updated just now</span></div>
  </section>
</div>
