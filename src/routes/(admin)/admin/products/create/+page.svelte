
<script lang="ts">
	import { goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { onDestroy } from 'svelte';
	import imageCompression from 'browser-image-compression';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	type SubVariantImage = {
		file: File;
		previewUrl: string;
	};

	type SubVariant = {
		id: number;
		name: string;
		price: number | string;
		is_active: boolean;
		images: SubVariantImage[];
	};

	type Variant = {
		id: number;
		name: string;
		subVariants: SubVariant[];
	};

	const MAX_IMAGES = 2;
	const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
	const MAX_COMPRESSED_SIZE = 500 * 1024;

	let productName = $state('');
	let categoryId = $state('');
	let productStatus = $state<'published' | 'draft'>('draft');
	let submitting = $state(false);
	let compressing = $state(false);

	let nextVariantId = 3;
	let nextSubVariantId = 5;

    const formatRupiah = (value: number | string | undefined) => {
        if (value === '' || value === undefined || value === null) {
            return '';
        }

        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return '';
        }

        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(amount);
    };

	let variants = $state<Variant[]>([
		{
			id: 1,
			name: 'AMOLED',
			subVariants: [
				{
					id: 1,
					name: 'White',
					price: '1099',
					is_active: true,
					images: []
				},
				{
					id: 2,
					name: 'Orange',
					price: '1099',
					is_active: true,
					images: []
				}
			]
		},
		{
			id: 2,
			name: 'Solar',
			subVariants: [
				{
					id: 3,
					name: 'Slate',
					price: '1199',
					is_active: true,
					images: []
				},
				{
					id: 4,
					name: 'Carbon Gray',
					price: '1199',
					is_active: true,
					images: []
				}
			]
		}
	]);

	function addVariant() {
		variants.push({
			id: nextVariantId++,
			name: '',
			subVariants: [
				{
					id: nextSubVariantId++,
					name: '',
					price: '',
					is_active: true,
					images: []
				}
			]
		});
	}

	function removeVariant(variantId: number) {
		const variant = variants.find((item) => item.id === variantId);

		if (variant) {
			for (const subVariant of variant.subVariants) {
				for (const image of subVariant.images) {
					URL.revokeObjectURL(image.previewUrl);
				}
			}
		}

		variants = variants.filter((item) => item.id !== variantId);
	}

	function addSubVariant(variantId: number) {
		const variant = variants.find((item) => item.id === variantId);

		if (!variant) return;

		variant.subVariants.push({
			id: nextSubVariantId++,
			name: '',
			price: '',
			is_active: true,
			images: []
		});
	}

	function removeSubVariant(variantId: number, subVariantId: number) {
		const variant = variants.find((item) => item.id === variantId);

		if (!variant) return;

		const subVariant = variant.subVariants.find(
			(item) => item.id === subVariantId
		);

		if (subVariant) {
			for (const image of subVariant.images) {
				URL.revokeObjectURL(image.previewUrl);
			}
		}

		variant.subVariants = variant.subVariants.filter(
			(item) => item.id !== subVariantId
		);
	}

	async function handleImageChange(
		variantId: number,
		subVariantId: number,
		event: Event
	) {
		const input = event.currentTarget as HTMLInputElement;
		const selectedFiles = Array.from(input.files ?? []);

		// Reset so the same file can be selected again later.
		input.value = '';

		const subVariant = variants
			.find((variant) => variant.id === variantId)
			?.subVariants.find((item) => item.id === subVariantId);

		if (!subVariant || selectedFiles.length === 0) return;

		const remaining = MAX_IMAGES - subVariant.images.length;

		if (remaining <= 0) {
			alert('Each sub-variant can have a maximum of 2 images.');
			return;
		}

		// Only accept as many files as the remaining slots.
		const filesToProcess = selectedFiles.slice(0, remaining);

		if (selectedFiles.length > remaining) {
			alert(`Only ${remaining} more image(s) can be added.`);
		}

		compressing = true;

		try {
			for (const file of filesToProcess) {
				// Check original file size before compression.
				if (file.size > MAX_ORIGINAL_SIZE) {
					alert(`${file.name} exceeds the 10 MB original size limit.`);
					continue;
				}

				if (
					!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
				) {
					alert(`${file.name} must be a JPG, PNG, or WEBP image.`);
					continue;
				}

				if (subVariant.images.length >= MAX_IMAGES) break;

				const compressedFile = await imageCompression(file, {
					maxSizeMB: 0.5,
					maxWidthOrHeight: 1600,
					useWebWorker: true,
					preserveExif: false
				});

				// The compressed file must meet the hard size limit.
				if (compressedFile.size > MAX_COMPRESSED_SIZE) {
					alert(
						`${file.name} could not be compressed below 500 KB. Please choose a smaller or simpler image.`
					);
					continue;
				}

				// The sub-variant may have changed while compression was running.
				const currentSubVariant = variants
					.find((variant) => variant.id === variantId)
					?.subVariants.find((item) => item.id === subVariantId);

				if (!currentSubVariant) {
					continue;
				}

				if (currentSubVariant.images.length >= MAX_IMAGES) {
					alert('Each sub-variant can have a maximum of 2 images.');
					break;
				}

				currentSubVariant.images.push({
					file: compressedFile,
					previewUrl: URL.createObjectURL(compressedFile)
				});
			}
		} catch (error) {
			console.error('Image compression failed:', error);
			alert('Failed to process an image. Please try another file.');
		} finally {
			compressing = false;
		}
	}

	function removeImage(
		variantId: number,
		subVariantId: number,
		imageIndex: number
	) {
		const subVariant = variants
			.find((variant) => variant.id === variantId)
			?.subVariants.find((item) => item.id === subVariantId);

		if (!subVariant) return;

		const [removedImage] = subVariant.images.splice(imageIndex, 1);

		if (removedImage) {
			URL.revokeObjectURL(removedImage.previewUrl);
		}
	}

	function formatPrice(value: string) {
		const number = Number(value);

		if (!value || !Number.isFinite(number)) return '';

		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 2
		}).format(number);
	}

	function cancel() {
		if (submitting) return;

		goto('/admin/products');
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (submitting || compressing) return;

		if (!productName.trim()) {
			alert('Product name is required.');
			return;
		}

		if (!categoryId) {
			alert('Please select a category.');
			return;
		}

		if (variants.length === 0) {
			alert('Please add at least one variant.');
			return;
		}

		if (variants.length > 30) {
			alert('A product can have a maximum of 30 variants.');
			return;
		}

		let totalSubVariants = 0;
		let imageIndex = 0;

		const formData = new FormData();

		try {
			const payload = {
				name: productName.trim(),
				category_id: categoryId,
				status: productStatus,
				variants: variants.map((variant, variantIndex) => {
					if (!variant.name.trim()) {
						throw new Error(
							`Variant ${variantIndex + 1} needs a name.`
						);
					}

					if (variant.subVariants.length === 0) {
						throw new Error(
							`Please add a sub-variant to ${variant.name}.`
						);
					}

					return {
						name: variant.name.trim(),
						sort_order: variantIndex,
						subVariants: variant.subVariants.map(
							(subVariant, subIndex) => {
								totalSubVariants++;

								if (!subVariant.name.trim()) {
									throw new Error(
										`A sub-variant in ${variant.name} needs a name.`
									);
								}

								if (
	                                subVariant.price === '' ||
	                                subVariant.price === null ||
	                                subVariant.price === undefined ||
	                                !Number.isFinite(Number(subVariant.price)) ||
	                                Number(subVariant.price) < 0
                                ) {
	                                throw new Error(
		                                `Enter a valid price for ${subVariant.name}.`
	                                );
                                }

								if (subVariant.images.length > MAX_IMAGES) {
									throw new Error(
										`${subVariant.name} cannot have more than 2 images.`
									);
								}

								const images = subVariant.images.map(
									(image, imageOrder) => {
										if (image.file.size > MAX_COMPRESSED_SIZE) {
											throw new Error(
												`${image.file.name} exceeds 500 KB.`
											);
										}

										const index = imageIndex++;

										formData.append(
											`image_${index}`,
											image.file,
											image.file.name
										);

										return {
											index,
											sort_order: imageOrder
										};
									}
								);

								return {
									name: subVariant.name.trim(),
									price: Number(subVariant.price),
									is_active: subVariant.is_active,
									sort_order: subIndex,
									images
								};
							}
						)
					};
				})
			};

			if (totalSubVariants > 100) {
				throw new Error(
					'A product can have a maximum of 100 sub-variants.'
				);
			}

			formData.set('payload', JSON.stringify(payload));

			submitting = true;

			const response = await fetch('?/create', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());

			if (result.type === 'success') {
				if ('data' in result && result.data?.success === true) {
					alert('Product created successfully.');
					await goto('/admin/products');
					return;
				}

				alert('The server did not confirm product creation.');
				return;
			}

			const message =
				result.type === 'failure' &&
				'data' in result &&
				'message' in result.data &&
				typeof result.data.message === 'string'
					? result.data.message
					: 'Failed to create product.';

			alert(message);
		} catch (error) {
			console.error('Submit product failed:', error);

			alert(
				error instanceof Error
					? error.message
					: 'An unexpected error occurred.'
			);
		} finally {
			submitting = false;
		}
	}

	onDestroy(() => {
		for (const variant of variants) {
			for (const subVariant of variant.subVariants) {
				for (const image of subVariant.images) {
					URL.revokeObjectURL(image.previewUrl);
				}
			}
		}
	});
</script>

<svelte:head>
	<title>Create Product | GARMIN PAKUWON</title>
	<meta
		name="description"
		content="Create a product and manage its variants."
	/>
</svelte:head>

<div class="min-h-screen bg-[#f7f6f3] text-[#252525]">
	<main class="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
		<form onsubmit={handleSubmit}>
			<!-- Page Header -->
			<div class="mb-7">
				<button
					type="button"
					onclick={cancel}
					disabled={submitting}
					class="mb-5 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-black disabled:opacity-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.8"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="m15 18-6-6 6-6" />
						<path d="M9 12h12" />
					</svg>
					Back to Products
				</button>

				<div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">
							Create Product
						</h1>
						<p class="mt-2 text-sm text-gray-500 sm:text-base">
							Add a new product to your store
						</p>
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={cancel}
							disabled={submitting}
							class="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={submitting || compressing}
							class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252525] px-5 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
						>
							{#if submitting}
								<svg
									class="animate-spin"
									width="17"
									height="17"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<circle cx="12" cy="12" r="9" opacity=".25" />
									<path d="M21 12a9 9 0 0 0-9-9" />
								</svg>
								Saving...
							{:else if compressing}
								Processing images...
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="17"
									height="17"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
									<path d="M17 21v-8H7v8" />
									<path d="M7 3v5h8" />
								</svg>
								Save Product
							{/if}
						</button>
					</div>
				</div>
			</div>

			<div class="space-y-6">
				<!-- Basic Information -->
				<section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7">
					<div class="mb-6">
						<h2 class="text-lg font-semibold">Basic Information</h2>
						<p class="mt-1 text-sm text-gray-500">
							Enter the product details and assign a category.
						</p>
					</div>

					<div class="grid grid-cols-1 gap-5 md:grid-cols-2">
						<div class="md:col-span-2">
							<label for="product-name" class="mb-2 block text-sm font-medium">
								Product name <span class="text-red-500">*</span>
							</label>
							<input
								id="product-name"
								type="text"
								bind:value={productName}
								maxlength="200"
								placeholder="e.g. fēnix 8 – 51 mm, AMOLED"
								required
								class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#252525] focus:ring-2 focus:ring-gray-100"
							/>
						</div>
                        
						<div class="md:col-span-2">
							<label for="category" class="mb-2 block text-sm font-medium">
								Category <span class="text-red-500">*</span>
							</label>

							<div class="relative">
								<select
									id="category"
									bind:value={categoryId}
									required
									class="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-[#252525] focus:ring-2 focus:ring-gray-100"
								>
									<option value="" disabled>Select a category</option>
									{#each data.categories as category (category.id)}
										<option value={category.id}>{category.name}</option>
									{/each}
								</select>

								<svg
									class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
									xmlns="http://www.w3.org/2000/svg"
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="m6 9 6 6 6-6" />
								</svg>
							</div>

							{#if data.categories.length === 0}
								<p class="mt-2 text-xs text-amber-600">
									No categories found. Check Supabase access and RLS policies.
								</p>
							{/if}
						</div>

						<div class="md:col-span-2">
							<label for="product-status" class="mb-2 block text-sm font-medium">
								Product status
							</label>

							<select
								id="product-status"
								bind:value={productStatus}
								class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#252525] focus:ring-2 focus:ring-gray-100"
							>
								<option value="draft">Draft</option>
								<option value="published">Published</option>
							</select>

							<p class="mt-2 text-xs text-gray-400">
								Draft products should remain hidden from the public catalog.
							</p>
						</div>
					</div>
				</section>

				<!-- Variants -->
				<section class="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-7">
					<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<h2 class="text-lg font-semibold">Variants</h2>
							<p class="mt-1 text-sm text-gray-500">
								Organize variants, prices, availability, and product images.
							</p>
						</div>

						<button
							type="button"
							onclick={addVariant}
							disabled={variants.length >= 30}
							class="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium transition hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="17"
								height="17"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="1.8"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M12 5v14" />
								<path d="M5 12h14" />
							</svg>
							Add Variant
						</button>
					</div>

					<div class="mb-5 flex items-start gap-3 rounded-xl bg-[#f7f6f3] p-4">
						<svg
							class="mt-0.5 shrink-0 text-gray-500"
							xmlns="http://www.w3.org/2000/svg"
							width="17"
							height="17"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 16v-4" />
							<path d="M12 8h.01" />
						</svg>
						<p class="text-xs leading-5 text-gray-500">
							Each variant can contain multiple sub-variants. Each sub-variant
							has its own price, active status, and up to two images.
							Images are compressed to a maximum of 500 KB each.
						</p>
					</div>

					<div class="space-y-5">
						{#each variants as variant, variantIndex (variant.id)}
							<div class="overflow-hidden rounded-xl border border-gray-200">
								<!-- Variant Header -->
								<div class="flex flex-col gap-3 border-b border-gray-100 bg-[#fcfbf9] p-4 sm:flex-row sm:items-center sm:justify-between">
									<div class="flex min-w-0 flex-1 items-center gap-3">
										<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-500">
											{String(variantIndex + 1).padStart(2, '0')}
										</div>

										<div class="min-w-0 flex-1">
											<label for="variant-{variant.id}" class="mb-1 block text-xs font-medium text-gray-500">
												Variant name
											</label>
											<input
												id="variant-{variant.id}"
												type="text"
												bind:value={variant.name}
												maxlength="100"
												placeholder="e.g. AMOLED"
												required
												class="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium outline-none focus:border-gray-400"
											/>
										</div>
									</div>

									<div class="flex items-center justify-between gap-3 sm:justify-end">
										<span class="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
											{variant.subVariants.length}
											{variant.subVariants.length === 1 ? 'sub-variant' : 'sub-variants'}
										</span>

										<button
											type="button"
											onclick={() => removeVariant(variant.id)}
											aria-label="Remove variant"
											title="Remove variant"
											class="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												width="17"
												height="17"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												stroke-width="1.8"
												stroke-linecap="round"
												stroke-linejoin="round"
											>
												<path d="M3 6h18" />
												<path d="M8 6V4h8v2" />
												<path d="m19 6-1 14H6L5 6" />
												<path d="M10 11v5M14 11v5" />
											</svg>
										</button>
									</div>
								</div>

								<!-- Sub-variants -->
								<div class="space-y-3 p-3 sm:p-4">
									{#each variant.subVariants as subVariant, subIndex (subVariant.id)}
										<div class="rounded-xl border border-gray-100 bg-white p-4 transition hover:border-gray-200">
											<div class="mb-4 flex items-center justify-between">
												<span class="text-xs font-medium uppercase tracking-wider text-gray-400">
													Sub-variant {subIndex + 1}
												</span>

												<button
													type="button"
													onclick={() => removeSubVariant(variant.id, subVariant.id)}
													aria-label="Remove sub-variant"
													class="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
												>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="16"
														height="16"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														stroke-width="1.8"
														stroke-linecap="round"
														stroke-linejoin="round"
													>
														<path d="M3 6h18" />
														<path d="M8 6V4h8v2" />
														<path d="m19 6-1 14H6L5 6" />
													</svg>
												</button>
											</div>

											<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
												<!-- Name -->
												<div>
													<label for="sub-name-{subVariant.id}" class="mb-2 block text-sm font-medium">
														Name
													</label>
													<input
														id="sub-name-{subVariant.id}"
														type="text"
														bind:value={subVariant.name}
														maxlength="100"
														placeholder="e.g. White"
														required
														class="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#252525] focus:ring-2 focus:ring-gray-100"
													/>
												</div>

												<!-- Price -->
                                                <div>
                                                    <label
                                                        for={`sub-price-${subVariant.id}`}
                                                        class="mb-2 block text-sm font-medium text-neutral-700"
                                                    >
                                                        Price (Rp) <span class="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        id={`sub-price-${subVariant.id}`}
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        bind:value={subVariant.price}
                                                        placeholder="Contoh: 12999000"
                                                        required
                                                        class="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
                                                    />
                                                    {#if subVariant.price !== '' && Number.isFinite(Number(subVariant.price)) && Number(subVariant.price) >= 0}
                                                        <p class="mt-2 text-xs text-neutral-500">
                                                        {formatRupiah(subVariant.price)}
                                                        </p>
                                                    {/if}
                                                </div>

												<!-- Active Status -->
												<div class="sm:col-span-2">
													<label for="active-{subVariant.id}" class="flex cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-3">
														<div>
															<p class="text-sm font-medium">Active variant</p>
															<p class="mt-1 text-xs text-gray-500">
																{#if subVariant.is_active}
																	This variant is available in the catalog.
																{:else}
																	This variant is hidden from the catalog.
																{/if}
															</p>
														</div>

														<input
															id="active-{subVariant.id}"
															type="checkbox"
															bind:checked={subVariant.is_active}
															class="peer sr-only"
														/>

														<span class="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition peer-checked:bg-[#252525] peer-focus-visible:ring-2 peer-focus-visible:ring-gray-400 peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform after:content-[''] peer-checked:after:translate-x-5"></span>
													</label>
												</div>
											</div>

											<!-- Image Upload -->
											<div class="mt-5">
												<div class="mb-3 flex items-center justify-between gap-3">
													<label class="text-sm font-medium">
														Product images
													</label>
													<span class="text-xs text-gray-400">
														{subVariant.images.length} / {MAX_IMAGES} images
													</span>
												</div>

												<div class="flex flex-wrap items-start gap-3">
													{#each subVariant.images as imageItem, imageIndex (`${subVariant.id}-${imageIndex}`)}
														<div class="group relative h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
															<img
																src={imageItem.previewUrl}
																alt="{subVariant.name || 'Product'} image {imageIndex + 1}"
																class="h-full w-full object-cover"
															/>

															<button
																type="button"
																onclick={() => removeImage(variant.id, subVariant.id, imageIndex)}
																aria-label="Remove image {imageIndex + 1}"
																title="Remove image"
																class="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-gray-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
															>
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="15"
																	height="15"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="1.8"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																>
																	<path d="M3 6h18" />
																	<path d="M8 6V4h8v2" />
																	<path d="m19 6-1 14H6L5 6" />
																</svg>
															</button>
														</div>
													{/each}

													{#if subVariant.images.length < MAX_IMAGES}
														<label
															for="sub-images-{subVariant.id}"
															class="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition hover:border-gray-500 hover:bg-gray-100 hover:text-gray-700"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="22"
																height="22"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="1.5"
																stroke-linecap="round"
																stroke-linejoin="round"
															>
																<path d="M12 5v14" />
																<path d="M5 12h14" />
															</svg>

															<span class="text-xs font-medium">Add image</span>
															<span class="text-[10px]">
																{MAX_IMAGES - subVariant.images.length} remaining
															</span>
														</label>
													{/if}

													<input
														id="sub-images-{subVariant.id}"
														type="file"
														accept="image/jpeg,image/png,image/webp"
														multiple
														hidden
														disabled={compressing || submitting}
														onchange={(event) => handleImageChange(variant.id, subVariant.id, event)}
													/>
												</div>

												<p class="mt-3 text-xs text-gray-400">
													JPG, PNG or WEBP. Original file maximum 10 MB.
													Compressed file maximum 500 KB per image.
												</p>
											</div>
										</div>
									{/each}

									<button
										type="button"
										onclick={() => addSubVariant(variant.id)}
										disabled={variant.subVariants.length >= 100}
										class="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 transition hover:border-gray-500 hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="17"
											height="17"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
										>
											<path d="M12 5v14" />
											<path d="M5 12h14" />
										</svg>
										Add Sub-variant
									</button>
								</div>
							</div>
						{/each}

						{#if variants.length === 0}
							<div class="rounded-xl border border-dashed border-gray-300 px-5 py-12 text-center">
								<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="23"
										height="23"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="1.5"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<rect x="3" y="3" width="18" height="18" rx="2" />
										<path d="M3 9h18M9 21V9" />
									</svg>
								</div>

								<h3 class="text-sm font-semibold">No variants yet</h3>
								<p class="mt-1 text-sm text-gray-500">
									Add a variant to start configuring your product.
								</p>

								<button
									type="button"
									onclick={addVariant}
									class="mt-4 rounded-xl bg-[#252525] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-black"
								>
									Add your first variant
								</button>
							</div>
						{/if}
					</div>
				</section>

				<!-- Bottom Actions -->
				<div class="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
					<button
						type="button"
						onclick={cancel}
						disabled={submitting}
						class="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium transition hover:bg-gray-50 disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={submitting || compressing}
						class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#252525] px-6 py-3 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
					>
						{#if submitting}
							Saving Product...
						{:else if compressing}
							Compressing Images...
						{:else}
							Save Product
						{/if}
					</button>
				</div>
			</div>
		</form>
	</main>
</div>
