<script lang="ts">
	import { page } from '$app/state';

	let { data } = $props();

	// Ganti dengan nomor WhatsApp client.
	// Gunakan format internasional tanpa tanda +, spasi, atau strip.
	const WHATSAPP_NUMBER = '6285122316343';

	let selectedGroupId = $state(
		data.product.variant_groups[0]?.id ?? ''
	);

	let selectedVariantId = $state(
		data.product.variant_groups[0]?.product_variants[0]?.id ?? ''
	);

	let activeImage = $state('');
	// let showWhatsappFallback = $state(false);

	const product = $derived(data.product);

	const selectedGroup = $derived(
		product.variant_groups.find(
			(group) => group.id === selectedGroupId
		)
	);

	const selectedVariant = $derived(
		selectedGroup?.product_variants.find(
			(variant) => variant.id === selectedVariantId
		)
	);

	const galleryImages = $derived(
		selectedVariant?.variant_images ?? []
	);

	const mainImage = $derived(
		activeImage || galleryImages[0]?.image_url || ''
	);

	const formatPrice = (price: number) =>
		new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			maximumFractionDigits: 0
		}).format(price);

	const whatsappMessage = $derived(
		[
			'Halo, saya tertarik dengan produk berikut:',
			'',
			`Produk: ${product.name}`,
			`Variant: ${selectedGroup?.name ?? '-'}`,
			`Sub Variant: ${selectedVariant?.name ?? '-'}`,
			`Harga: ${selectedVariant ? formatPrice(selectedVariant.price) : '-'}`,
			'',
			'Apakah produk ini tersedia?'
		].join('\n')
	);

	const whatsappUrl = $derived(
		`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`
	);

	const formattedWhatsappNumber = $derived(
		WHATSAPP_NUMBER.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '+$1 $2-$3-$4')
	);

	function selectGroup(group: (typeof product.variant_groups)[number]) {
		selectedGroupId = group.id;
		selectedVariantId = group.product_variants[0]?.id ?? '';
		activeImage = '';
	}

	function selectVariant(
		variant: NonNullable<typeof selectedGroup>['product_variants'][number]
	) {
		selectedVariantId = variant.id;
		activeImage = '';
	}

	function openWhatsApp() {

		// Arahkan tab saat ini ke WhatsApp.
		window.location.href = whatsappUrl;
	}
</script>

<svelte:head>
	<title>{product.name} | Garmin Catalog</title>
	<meta
		name="description"
		content={`Lihat detail, pilihan variant, dan harga ${product.name}.`}
	/>
</svelte:head>

<div class="product-page">
	<a href="/" class="back-link">
		<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M19 12H5m7 7-7-7 7-7"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
		<span>Back</span>
	</a>

	<div class="product-layout">
		<!-- Product gallery -->
		<section class="gallery">
			<div class="thumbnail-list">
				{#each galleryImages as image (image.id)}
					<button
						type="button"
						class="thumbnail"
						class:thumbnail-active={mainImage === image.image_url}
						onclick={() => (activeImage = image.image_url)}
						aria-label="Lihat gambar produk"
					>
						<img src={image.image_url} alt={product.name} />
					</button>
				{/each}
			</div>

			<div class="main-image">
				{#if mainImage}
					<img src={mainImage} alt={product.name} />
				{:else}
					<div class="image-placeholder">
						No image available
					</div>
				{/if}
			</div>
		</section>

		<!-- Product information -->
		<section class="product-info">
			<div class="product-heading">
				<h1>{product.name}</h1>

				<p class="product-subtitle">
					{product.categories?.name ?? ''}
				</p>

				{#if selectedVariant}
					<p class="product-price">
						{formatPrice(selectedVariant.price)}
					</p>
				{/if}
			</div>

			<div class="section-divider"></div>

			{#if product.variant_groups.length > 0}
				<!-- Variant groups -->
				<section class="variant-section">
					<div class="section-label">
						<h2>Variant</h2>
						<span
							class="info-icon"
							title="Pilih jenis variant produk"
						>
							?
						</span>
					</div>

					<div class="group-options">
						{#each product.variant_groups as group (group.id)}
							<button
								type="button"
								class="group-button"
								class:group-active={selectedGroupId === group.id}
								onclick={() => selectGroup(group)}
							>
								{group.name}
							</button>
						{/each}
					</div>
				</section>

				<!-- Selected group's subvariants -->
				{#if selectedGroup}
					<section class="subvariant-section">
						<h2>Sub Variant ({selectedGroup.name})</h2>

						<div class="subvariant-grid">
							{#each selectedGroup.product_variants as variant (variant.id)}
								<button
									type="button"
									class="subvariant-card"
									class:subvariant-active={selectedVariantId === variant.id}
									onclick={() => selectVariant(variant)}
								>
									<div class="subvariant-image">
										{#if variant.variant_images[0]?.image_url}
											<img
												src={variant.variant_images[0].image_url}
												alt={variant.name}
											/>
										{:else}
											<div class="image-placeholder">—</div>
										{/if}
									</div>

									<div class="subvariant-content">
										<span class="subvariant-name">
											{variant.name}
										</span>

										<span class="subvariant-price">
											{formatPrice(variant.price)}
										</span>
									</div>

									{#if selectedVariantId === variant.id}
										<span class="selected-check">
											<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
												<path
													d="m5 10 3.2 3.2L15 6.5"
													stroke="white"
													stroke-width="2"
													stroke-linecap="round"
													stroke-linejoin="round"
												/>
											</svg>
										</span>
									{/if}
								</button>
							{/each}
						</div>
					</section>
				{/if}
			{:else}
				<p class="no-variant">
					Belum ada variant untuk produk ini.
				</p>
			{/if}

			<!-- WhatsApp -->
			<div class="purchase-section">
				{#if selectedVariant}
					<button
						type="button"
						class="whatsapp-button"
						onclick={openWhatsApp}
					>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path
								d="M20 11.5a8.4 8.4 0 0 1-12.4 7.4L4 20l1.2-3.4A8.5 8.5 0 1 1 20 11.5Z"
								stroke="currentColor"
								stroke-width="1.7"
								stroke-linejoin="round"
							/>
							<path
								d="M8.5 8.2c.3-.5.6-.5.9-.5h.4c.2 0 .3.1.4.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.2.2-.2.3 0 .6.4.7 1 1.3 1.7 1.7.2.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .3-.2 1-.7 1.4-.5.4-1.1.6-1.8.4-1-.2-2.2-.8-3.4-1.9-1.1-1-1.8-2.3-2-3.2-.2-.7 0-1.4.6-1.9Z"
								fill="currentColor"
							/>
						</svg>

						Chat via WhatsApp
					</button>
				{/if}

				<div class="availability-note">
					<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle
							cx="12"
							cy="12"
							r="9"
							stroke="currentColor"
							stroke-width="1.6"
						/>
						<path
							d="M12 11v5m0-8h.01"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
						/>
					</svg>

					<span>
						Klik tombol di atas untuk menanyakan ketersediaan produk.
					</span>
				</div>

					<div class="whatsapp-fallback">
						<p>WhatsApp tidak terbuka? Hubungi kami melalui nomor:</p>
						<a
							href={`https://wa.me/${WHATSAPP_NUMBER}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							{formattedWhatsappNumber}
						</a>
					</div>

			</div>
		</section>
	</div>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		background: #f7f5f2;
		color: #242424;
		font-family: Arial, Helvetica, sans-serif;
	}

	.product-page {
		width: min(1120px, calc(100% - 48px));
		margin: 48px auto;
		padding: 28px;
		border: 1px solid #eae7e2;
		border-radius: 18px;
		background: #fffdfa;
	}

	/* Back button */

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 24px;
		color: #242424;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
	}

	.back-link svg {
		width: 18px;
		height: 18px;
	}

	/* Main layout */

	.product-layout {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
		gap: 42px;
		align-items: start;
	}

	/* Gallery */

	.gallery {
		display: grid;
		grid-template-columns: 64px minmax(0, 1fr);
		gap: 14px;
		align-items: start;
	}

	.thumbnail-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.thumbnail {
		width: 64px;
		height: 76px;
		padding: 5px;
		overflow: hidden;
		border: 1px solid #e9e6e1;
		border-radius: 10px;
		background: #f5f3f0;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.thumbnail:hover,
	.thumbnail-active {
		border-color: #242424;
	}

	.thumbnail img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.main-image {
		display: flex;
		width: 100%;
		aspect-ratio: 1 / 1;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 14px;
		background: #f3f1ee;
	}

	.main-image img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.image-placeholder {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
		color: #999;
		font-size: 12px;
	}

	/* Product information */

	.product-info {
		min-width: 0;
	}

	.product-heading h1 {
		margin: -8px 0 8px;
		font-family: Georgia, 'Times New Roman', serif;
		font-size: clamp(30px, 3.1vw, 42px);
		font-weight: 500;
		line-height: 1.12;
		letter-spacing: -1.4px;
	}

	.product-subtitle {
		margin: 0;
		color: #777985;
		font-size: 15px;
		line-height: 1.5;
	}

	.product-price {
		margin: 16px 0 20px;
		font-size: 27px;
		font-weight: 700;
		letter-spacing: -0.8px;
	}

	.section-divider {
		height: 1px;
		margin: 20px 0;
		background: #eae7e2;
	}

	/* Variant groups */

	.section-label {
		display: flex;
		align-items: center;
		gap: 9px;
		margin-bottom: 12px;
	}

	.section-label h2,
	.subvariant-section h2 {
		margin: 0;
		font-size: 14px;
		font-weight: 700;
	}

	.info-icon {
		display: grid;
		width: 16px;
		height: 16px;
		place-items: center;
		border-radius: 50%;
		background: #292929;
		color: white;
		font-size: 11px;
		font-weight: 700;
		cursor: help;
	}

	.group-options {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.group-button {
		min-width: 110px;
		padding: 10px 20px;
		border: 1px solid #e7e3de;
		border-radius: 999px;
		background: transparent;
		color: #242424;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.group-button:hover {
		border-color: #242424;
	}

	.group-button.group-active {
		border-color: #242424;
		background: #242424;
		color: white;
	}

	/* Subvariants */

	.subvariant-section {
		margin-top: 24px;
	}

	.subvariant-section h2 {
		margin-bottom: 12px;
	}

	.subvariant-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.subvariant-card {
		position: relative;
		display: flex;
		min-width: 0;
		min-height: 68px;
		align-items: center;
		gap: 10px;
		padding: 9px 12px;
		border: 1px solid #e9e5df;
		border-radius: 12px;
		background: #fffdfa;
		color: #242424;
		text-align: left;
		cursor: pointer;
		transition: border-color 0.2s, background 0.2s;
	}

	.subvariant-card:hover {
		border-color: #999;
	}

	.subvariant-card.subvariant-active {
		border-color: #242424;
		background: #fdfcf9;
	}

	.subvariant-image {
		flex: 0 0 44px;
		width: 44px;
		height: 44px;
		overflow: hidden;
		border-radius: 8px;
		background: #f4f2ef;
	}

	.subvariant-image img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.subvariant-content {
		display: flex;
		min-width: 0;
		flex-direction: column;
		gap: 5px;
	}

	.subvariant-name {
		overflow: hidden;
		font-size: 13px;
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.subvariant-price {
		color: #666;
		font-size: 11px;
		white-space: nowrap;
	}

	.selected-check {
		position: absolute;
		top: 6px;
		right: 6px;
		display: grid;
		width: 16px;
		height: 16px;
		place-items: center;
		border-radius: 50%;
		background: #242424;
	}

	.selected-check svg {
		width: 11px;
		height: 11px;
	}

	/* WhatsApp */

	.purchase-section {
		margin-top: 26px;
	}

	.whatsapp-button {
		display: flex;
		width: 100%;
		min-height: 48px;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 0;
		border-radius: 12px;
		background: #242424;
		color: white;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.whatsapp-button:hover {
		background: #444;
	}

	.whatsapp-button svg {
		width: 21px;
		height: 21px;
	}

	.availability-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin-top: 9px;
		padding: 12px;
		border-radius: 10px;
		background: #f5f3f0;
		color: #777;
		font-size: 11px;
		line-height: 1.5;
		text-align: center;
	}

	.availability-note svg {
		flex: 0 0 16px;
		width: 16px;
		height: 16px;
	}

	.whatsapp-fallback {
		margin-top: 12px;
		padding: 14px;
		border: 1px solid #e9e5df;
		border-radius: 10px;
		background: #fffdfa;
		text-align: center;
	}

	.whatsapp-fallback p {
		margin: 0 0 7px;
		color: #777;
		font-size: 12px;
	}

	.whatsapp-fallback a {
		color: #242424;
		font-size: 15px;
		font-weight: 700;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.no-variant {
		color: #777;
		font-size: 13px;
	}

	/* Responsive */

	@media (max-width: 760px) {
		.product-page {
			width: 100%;
			margin: 0;
			padding: 20px 16px 32px;
			border: 0;
			border-radius: 0;
		}

		.back-link {
			margin-bottom: 16px;
		}

		.product-layout {
			grid-template-columns: 1fr;
			gap: 24px;
		}

		.gallery {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		.main-image {
			order: 1;
			aspect-ratio: 1 / 1;
			max-height: 420px;
		}

		.thumbnail-list {
			order: 2;
			width: 100%;
			flex-direction: row;
			overflow-x: auto;
			padding-bottom: 3px;
		}

		.thumbnail {
			flex: 0 0 64px;
			height: 64px;
		}

		.product-heading h1 {
			margin-top: 0;
			font-size: 32px;
		}

		.product-price {
			font-size: 25px;
		}

		.product-info {
			width: 100%;
		}

		.subvariant-grid {
			gap: 8px;
		}

		.subvariant-card {
			gap: 7px;
			padding: 8px;
		}

		.subvariant-image {
			flex-basis: 38px;
			width: 38px;
			height: 38px;
		}

		.subvariant-name {
			font-size: 12px;
		}

		.subvariant-price {
			font-size: 10px;
		}
	}

	@media (max-width: 360px) {
		.subvariant-grid {
			grid-template-columns: 1fr;
		}
	}
</style>