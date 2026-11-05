
<script lang="ts">
	import type { PageData } from './$types';
	import { Search } from '@lucide/svelte';


	let { data }: { data: PageData } = $props();

	const formatPrice = (price: number | null) => {
		if (price === null) return 'Hubungi kami';

		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(price);
	};

	function pageUrl(page: number) {
		const params = new URLSearchParams();

		if (data.filters.search) {
			params.set('search', data.filters.search);
		}

		if (data.filters.category) {
			params.set('category', data.filters.category);
		}

		if (data.filters.sort !== 'newest') {
			params.set('sort', data.filters.sort);
		}

		params.set('page', String(page));

		return `?${params.toString()}`;
	}

	let visiblePages = $derived.by(() => {
		const current = data.pagination.currentPage;
		const total = data.pagination.totalPages;

		const start = Math.max(1, current - 2);
		const end = Math.min(total, current + 2);

		return Array.from(
			{ length: Math.max(0, end - start + 1) },
			(_, i) => start + i
		);
	});
</script>

<svelte:head>
	<title>Garmin Surabaya - Product Catalog</title>
	<meta
		name="description"
		content="Explore our Garmin Pakuwon Mall Surabaya product collection."
	/>
</svelte:head>

<div class="page">
	<!-- Header -->
	<header class="header">
		<div class="header-inner">
			<a href="/" class="logo">
				<span class="logo-icon">G</span>
				<span class="text-base">Garmin Pakuwon<br> Mall Surabaya<span class="logo-accent">.</span></span>
			</a>

			<form method="GET" class="search-form">
				<input
					type="text"
					name="search"
					placeholder="Cari produk Garmin Pakuwon Mall Surabaya..."
					value={data.filters.search}
				/>

				{#if data.filters.category}
					<input
						type="hidden"
						name="category"
						value={data.filters.category}
					/>
				{/if}

				<input
					type="hidden"
					name="sort"
					value={data.filters.sort}
				/>

				<button 
					type="submit" 
					aria-label="Search"
					class="flex items-center justify-center"
				>
					<svg
						width="19"
						height="19"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					>
						<circle cx="11" cy="11" r="8" />
						<path d="m21 21-4.35-4.35" />
					</svg>
				</button>
			</form>

			<div class="header-actions">
				<a href="#products" class="nav-link">Products</a>
				<a href="#categories" class="nav-link">Categories</a>
			</div>
		</div>

		<!-- Category navigation -->
		<nav
    		class="category-nav"
    		id="categories"
    		data-sveltekit-preload-data="hover"
		>
    		<a
        		href="/"
        		class:active={!data.filters.category}
    		>
        		All Products
    		</a>

    		{#each data.categories as category}
        	<a
            	href="?category={category.id}&page=1"
            	class:active={data.filters.category === category.id}
        	>
            	{category.name}
        	</a>
    		{/each}
		</nav>
	</header>

	<!-- Hero -->
	<section class="hero">
		<div class="hero-content">
			<span class="eyebrow">Garmin Pakuwon Mall Surabaya Collection</span>

			<h1>
				Explore your
				<br />
				next adventure.
			</h1>

			<p>
				Discover Garmin Pakuwon Mall Surabaya products designed to help you
				track your performance, explore further, and
				live healthier.
			</p>

			<a href="#products" class="hero-button">
				Explore Collection
				<span>→</span>
			</a>
		</div>

		<div class="hero-image">
			<img
				src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=85"
				alt="Premium smartwatch"
			/>
		</div>
	</section>

	<!-- Products -->
	<section class="catalog" id="products">
		<div class="catalog-top">
			<div>
				<span class="eyebrow">OUR COLLECTION</span>
				<h2>Discover our products</h2>

				<p class="result-count">
					{#if data.pagination.totalProducts > 0}
						Showing {data.pagination.from}–{data.pagination.to}
						of {data.pagination.totalProducts} products
					{:else}
						No products found
					{/if}
				</p>
			</div>

			<form method="GET" class="sort-form">
				<input
					type="hidden"
					name="search"
					value={data.filters.search}
				/>

				<input
					type="hidden"
					name="category"
					value={data.filters.category}
				/>

				<label for="sort">Sort by</label>

				<select
					id="sort"
					name="sort"
					value={data.filters.sort}
					onchange={(event) =>
						(event.currentTarget.form as HTMLFormElement).requestSubmit()}
				>
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
					<option value="name_asc">Name: A-Z</option>
					<option value="name_desc">Name: Z-A</option>
				</select>
			</form>
		</div>

		{#if data.error}
			<div class="empty-state">
				<p>{data.error}</p>
			</div>
		{:else if data.products.length === 0}
			<div class="empty-state">
				<div class="empty-icon">⌕</div>
				<h3>No products found</h3>
				<p>
					Try another search keyword or select a different category.
				</p>

				<a href="/" class="reset-link">Clear filters</a>
			</div>
		{:else}
			<div class="product-grid">
				{#each data.products as product (product.id)}
					<article class="product-card">
						<a
							href="/products/{product.slug}"
							class="product-image"
						>
							{#if product.image}
								<img
									src={product.image}
									alt={product.name}
									loading="lazy"
								/>
							{:else}
								<div class="image-placeholder">
									<span>No image</span>
								</div>
							{/if}
						</a>

						<div class="product-info">
							<div class="product-category">
								{product.category?.name ?? 'Uncategorized'}
							</div>

							<h3>
								<a href="/products/{product.slug}">
									{product.name}
								</a>
							</h3>

							<div class="product-bottom">
								<span class="price">
									{formatPrice(product.price)}
								</span>

								<a
									href="/products/{product.slug}"
									class="view-button"
									aria-label="View {product.name}"
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.7"
									>
										<path d="M5 12h14M12 5l7 7-7 7" />
									</svg>
								</a>
							</div>
						</div>
					</article>
				{/each}
			</div>

			<!-- Pagination -->
			{#if data.pagination.totalPages > 1}
				<nav class="pagination" aria-label="Product pagination">
					<a
						href={pageUrl(data.pagination.currentPage - 1)}
						class="page-arrow"
						class:disabled={data.pagination.currentPage === 1}
						aria-label="Previous page"
						aria-disabled={data.pagination.currentPage === 1}
					>
						←
					</a>

					{#if visiblePages[0] > 1}
						<a href={pageUrl(1)} class="page-number">1</a>

						{#if visiblePages[0] > 2}
							<span class="page-dots">...</span>
						{/if}
					{/if}

					{#each visiblePages as page}
						<a
							href={pageUrl(page)}
							class="page-number"
							class:current={page === data.pagination.currentPage}
							aria-current={page === data.pagination.currentPage
								? 'page'
								: undefined}
						>
							{page}
						</a>
					{/each}

					{#if visiblePages.at(-1)! < data.pagination.totalPages}
						{#if visiblePages.at(-1)! < data.pagination.totalPages - 1}
							<span class="page-dots">...</span>
						{/if}

						<a
							href={pageUrl(data.pagination.totalPages)}
							class="page-number"
						>
							{data.pagination.totalPages}
						</a>
					{/if}

					<a
						href={pageUrl(data.pagination.currentPage + 1)}
						class="page-arrow"
						class:disabled={
							data.pagination.currentPage === data.pagination.totalPages
						}
						aria-label="Next page"
						aria-disabled={
							data.pagination.currentPage === data.pagination.totalPages
						}
					>
						→
					</a>
				</nav>
			{/if}
		{/if}
	</section>

	<footer class="footer">
		<a href="/" class="logo">
			<span class="logo-icon">G</span>
			<span>Garmin Pakuwon Mall Surabaya<span class="logo-accent">.</span></span>
		</a>

		<p>Explore more. Live better.</p>
		<span>© {new Date().getFullYear()} Garmin Pakuwon Mall Surabaya</span>
	</footer>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(html) {
		scroll-behavior: smooth;
	}

	:global(body) {
		margin: 0;
		background: #f7f5f2;
		color: #252525;
		font-family:
			Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI',
			sans-serif;
	}

	:global(a) {
		color: inherit;
		text-decoration: none;
	}

	.page {
		max-width: 1600px;
		margin: 0 auto;
		padding: 28px 5%;
	}

	.header {
		background: #fff;
		border: 1px solid #ece9e5;
		border-radius: 24px;
		padding: 0 28px;
	}

	.header-inner {
		display: flex;
		align-items: center;
		gap: 40px;
		min-height: 82px;
	}

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

	.search-form {
		display: flex;
		flex: 1;
		height: 46px;
		max-width: 620px;
		border: 1px solid #e9e6e2;
		border-radius: 30px;
		overflow: hidden;
	}

	.search-form input {
		flex: 1;
		min-width: 0;
		border: none;
		outline: none;
		padding: 0 20px;
		background: transparent;
		font: inherit;
	}

	.search-form button {
		width: 44px;
		height: 44px;
		margin: 0;
		border: none;
		border-radius: 50%;
		background: #252525;
		color: white;
		cursor: pointer;
	}

	.header-actions {
		display: flex;
		gap: 24px;
		margin-left: auto;
	}

	.nav-link {
		font-size: 13px;
		color: #666;
	}

	.nav-link:hover {
		color: #bd895f;
	}

	.category-nav {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px 0 20px;
		border-top: 1px solid #f0eeeb;
		overflow-x: auto;
	}

	.category-nav a {
		flex-shrink: 0;
		padding: 11px 22px;
		border: 1px solid #eae7e3;
		border-radius: 30px;
		font-size: 12px;
		transition: .2s;
	}

	.category-nav a:hover,
	.category-nav a.active {
		background: #252525;
		color: white;
		border-color: #252525;
	}

	.hero {
		display: grid;
		grid-template-columns: .85fr 1.15fr;
		align-items: center;
		gap: 40px;
		margin: 32px 0;
	}

	.hero-content {
		padding: 30px 20px 30px 24px;
	}

	.eyebrow {
		color: #bd895f;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 2px;
	}

	.hero h1 {
		margin: 20px 0;
		font-family: Georgia, serif;
		font-size: clamp(42px, 5vw, 68px);
		font-weight: 500;
		line-height: 1.08;
		letter-spacing: -2px;
	}

	.hero-content p {
		max-width: 430px;
		color: #777;
		font-size: 15px;
		line-height: 1.8;
	}

	.hero-button {
		display: inline-flex;
		align-items: center;
		gap: 24px;
		margin-top: 20px;
		padding: 14px 22px;
		border-radius: 30px;
		background: #252525;
		color: white;
		font-size: 13px;
	}

	.hero-button:hover {
		background: #bd895f;
	}

	.hero-image {
		height: 340px;
		overflow: hidden;
		border-radius: 18px;
		background: #e7dfd6;
	}

	.hero-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.catalog {
		padding: 35px;
		border: 1px solid #ece9e5;
		border-radius: 22px;
		background: white;
	}

	.catalog-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 28px;
		padding-bottom: 22px;
		border-bottom: 1px solid #efedea;
	}

	.catalog-top h2 {
		margin: 8px 0 6px;
		font-family: Georgia, serif;
		font-size: 30px;
		font-weight: 500;
	}

	.result-count {
		margin: 0;
		color: #888;
		font-size: 12px;
	}

	.sort-form {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 15px;
		border: 1px solid #eae7e3;
		border-radius: 30px;
	}

	.sort-form label {
		color: #777;
		font-size: 12px;
	}

	.sort-form select {
		max-width: 150px;
		border: none;
		outline: none;
		background: transparent;
		font-size: 12px;
		cursor: pointer;
	}

	.product-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 18px;
	}

	.product-card {
		min-width: 0;
		overflow: hidden;
		border: 1px solid #ece9e5;
		border-radius: 12px;
		transition: transform .2s, box-shadow .2s;
	}

	.product-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 30px #0000000d;
	}

	.product-image {
		display: block;
		aspect-ratio: 1 / 1;
		overflow: hidden;
		background: #f0ece7;
	}

	.product-image img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform .4s;
	}

	.product-card:hover .product-image img {
		transform: scale(1.04);
	}

	.image-placeholder {
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		color: #aaa;
		font-size: 12px;
	}

	.product-info {
		padding: 15px;
	}

	.product-category {
		margin-bottom: 7px;
		color: #bd895f;
		font-size: 10px;
		font-weight: 650;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.product-info h3 {
		margin: 0;
		font-size: 14px;
		font-weight: 600;
	}

	.product-info h3 a:hover {
		color: #bd895f;
	}

	.product-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		margin-top: 18px;
	}

	.price {
		font-size: 14px;
		font-weight: 650;
	}

	.view-button {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		flex-shrink: 0;
		border: 1px solid #e9e6e2;
		border-radius: 50%;
	}

	.view-button:hover {
		background: #252525;
		color: white;
	}

	.empty-state {
		padding: 80px 20px;
		text-align: center;
	}

	.empty-icon {
		font-size: 42px;
		color: #bd895f;
	}

	.empty-state h3 {
		font-family: Georgia, serif;
		font-size: 26px;
		font-weight: 500;
	}

	.empty-state p {
		color: #888;
		font-size: 13px;
	}

	.reset-link {
		display: inline-block;
		margin-top: 15px;
		color: #bd895f;
		font-size: 13px;
		text-decoration: underline;
	}

	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 40px;
	}

	.page-number,
	.page-arrow {
		display: grid;
		place-items: center;
		width: 38px;
		height: 38px;
		border: 1px solid #eae7e3;
		border-radius: 50%;
		font-size: 12px;
		transition: .2s;
	}

	.page-number:hover,
	.page-arrow:not(.disabled):hover {
		background: #252525;
		color: white;
	}

	.page-number.current {
		background: #252525;
		color: white;
		border-color: #252525;
	}

	.page-arrow.disabled {
		opacity: .35;
		pointer-events: none;
	}

	.page-dots {
		color: #999;
	}

	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 35px 10px 10px;
		color: #888;
		font-size: 12px;
	}

	.footer .logo {
		color: #252525;
		font-size: 17px;
	}

	@media (max-width: 1000px) {
		.page {
			padding: 20px 3%;
		}

		.header-inner {
			gap: 20px;
		}

		.product-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.hero h1 {
			font-size: 48px;
		}
	}

	@media (max-width: 700px) {
		.page {
			padding: 12px;
		}

		.header {
			padding: 15px;
			border-radius: 18px;
		}

		.header-inner {
			flex-wrap: wrap;
			gap: 15px;
		}

		.logo {
			font-size: 19px;
		}

		.search-form {
			order: 3;
			flex-basis: 100%;
			max-width: none;
		}

		.header-actions {
			gap: 15px;
		}

		.category-nav {
			margin-top: 12px;
			padding-bottom: 5px;
		}

		.category-nav a {
			padding: 9px 15px;
		}

		.hero {
			grid-template-columns: 1fr;
			gap: 15px;
			margin: 20px 0;
		}

		.hero-content {
			padding: 20px 10px;
		}

		.hero h1 {
			font-size: 46px;
		}

		.hero-image {
			height: 220px;
		}

		.catalog {
			padding: 18px 12px;
		}

		.catalog-top {
			align-items: flex-start;
			flex-direction: column;
		}

		.catalog-top h2 {
			font-size: 25px;
		}

		.product-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}

		.product-info {
			padding: 11px;
		}

		.product-info h3 {
			font-size: 12px;
		}

		.price {
			font-size: 12px;
		}

		.product-bottom {
			margin-top: 12px;
		}

		.view-button {
			width: 32px;
			height: 32px;
		}

		.pagination {
			gap: 5px;
		}

		.page-number,
		.page-arrow {
			width: 33px;
			height: 33px;
		}

		.footer {
			flex-wrap: wrap;
			font-size: 11px;
		}
	}

	@media (max-width: 380px) {
		.product-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
