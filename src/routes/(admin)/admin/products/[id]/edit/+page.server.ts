import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSlug } from '#lib/utils/slug.ts';

const BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 500 * 1024;
const MAX_IMAGES_PER_VARIANT = 2;
const MAX_VARIANTS = 30;
const MAX_SUB_VARIANTS = 100;

type ExistingImageInput = {
	id: string;
	sort_order: number;
};

type NewImageInput = {
	index: number;
	sort_order: number;
};

type ImageInput = ExistingImageInput | NewImageInput;

type SubVariantInput = {
	id?: string;
	name: string;
	price: number;
	is_active: boolean;
	sort_order: number;
	images: ImageInput[];
};

type VariantGroupInput = {
	id?: string;
	name: string;
	sort_order: number;
	subVariants: SubVariantInput[];
};

type ProductPayload = {
	product_id: string;
	name: string;
	category_id: string;
	status: 'published' | 'draft';
	variants: VariantGroupInput[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}

function isValidImageInput(value: unknown): value is ImageInput {
	if (!isRecord(value)) return false;

	const validSortOrder =
		Number.isInteger(value.sort_order) &&
		Number(value.sort_order) >= 0;

	if (!validSortOrder) return false;

	const hasId = typeof value.id === 'string' && value.id.length > 0;
	const hasIndex =
		Number.isInteger(value.index) && Number(value.index) >= 0;

	// An image must refer to either an existing DB row or a newly uploaded file.
	return hasId !== hasIndex;
}

function isValidPayload(value: unknown): value is ProductPayload {
	if (!isRecord(value)) return false;

	if (
		!isNonEmptyString(value.product_id) ||
		!isNonEmptyString(value.name) ||
		value.name.length > 200 ||
		!isNonEmptyString(value.category_id) ||
		!['published', 'draft'].includes(String(value.status)) ||
		!Array.isArray(value.variants) ||
		value.variants.length < 1 ||
		value.variants.length > MAX_VARIANTS
	) {
		return false;
	}

	let totalSubVariants = 0;
	const submittedGroupIds = new Set<string>();
	const submittedSubVariantIds = new Set<string>();
	const submittedImageIds = new Set<string>();
	const submittedImageIndexes = new Set<number>();

	for (const group of value.variants) {
		if (
			!isRecord(group) ||
			(group.id !== undefined && !isNonEmptyString(group.id)) ||
			!isNonEmptyString(group.name) ||
			group.name.length > 100 ||
			!Number.isInteger(group.sort_order) ||
			!Array.isArray(group.subVariants) ||
			group.subVariants.length < 1
		) {
			return false;
		}

		if (typeof group.id === 'string') {
			if (submittedGroupIds.has(group.id)) return false;
			submittedGroupIds.add(group.id);
		}

		for (const sub of group.subVariants) {
			totalSubVariants++;

			if (
				!isRecord(sub) ||
				(sub.id !== undefined && !isNonEmptyString(sub.id)) ||
				!isNonEmptyString(sub.name) ||
				sub.name.length > 100 ||
				typeof sub.price !== 'number' ||
				!Number.isFinite(sub.price) ||
				sub.price < 0 ||
				typeof sub.is_active !== 'boolean' ||
				!Number.isInteger(sub.sort_order) ||
				!Array.isArray(sub.images) ||
				sub.images.length > MAX_IMAGES_PER_VARIANT
			) {
				return false;
			}

			if (typeof sub.id === 'string') {
				if (submittedSubVariantIds.has(sub.id)) return false;
				submittedSubVariantIds.add(sub.id);
			}

			for (const image of sub.images) {
				if (!isValidImageInput(image)) return false;

				if ('id' in image) {
					if (submittedImageIds.has(image.id)) return false;
					submittedImageIds.add(image.id);
				} else {
					if (submittedImageIndexes.has(image.index)) return false;
					submittedImageIndexes.add(image.index);
				}
			}
		}
	}

	return totalSubVariants >= 1 && totalSubVariants <= MAX_SUB_VARIANTS;
}

function getStoragePathFromPublicUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		const marker = `/storage/v1/object/public/${BUCKET}/`;
		const markerIndex = parsed.pathname.indexOf(marker);

		if (markerIndex === -1) return null;

		return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
	} catch {
		return null;
	}
}

function getImageExtension(file: File): string {
	if (file.type === 'image/png') return 'png';
	if (file.type === 'image/webp') return 'webp';
	return 'jpg';
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		redirect(303, '/login');
	}

	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single();

	if (profileError || profile?.role !== 'admin') {
		error(403, 'Admin access required.');
	}

	const { data: product, error: productError } = await locals.supabase
		.from('products')
		.select(`
			id,
			name,
			category_id,
			status,
			variant_groups (
				id,
				name,
				sort_order,
				product_variants (
					id,
					name,
					price,
					sort_order,
					is_active
				)
			)
		`)
		.eq('id', params.id)
		.single();

	if (productError || !product) {
		error(404, 'Product not found');
	}

	const { data: categories, error: categoryError } = await locals.supabase
		.from('categories')
		.select('id, name')
		.order('name');

	if (categoryError) {
		console.error('Fetch categories failed:', categoryError);
		error(500, 'Failed to load categories');
	}

	const variantIds = product.variant_groups.flatMap((group) =>
		group.product_variants.map((variant) => variant.id)
	);

	let images: {
		id: string;
		variant_id: string;
		image_url: string;
		sort_order: number;
	}[] = [];

	if (variantIds.length > 0) {
		const { data, error: imageError } = await locals.supabase
			.from('variant_images')
			.select('id, variant_id, image_url, sort_order')
			.in('variant_id', variantIds)
			.order('sort_order');

		if (imageError) {
			console.error('Fetch product images failed:', imageError);
			error(500, 'Failed to load product images');
		}

		images = data ?? [];
	}

	const variants = product.variant_groups
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((group) => ({
			id: group.id,
			name: group.name,
			subVariants: group.product_variants
				.sort((a, b) => a.sort_order - b.sort_order)
				.map((variant) => ({
					id: variant.id,
					name: variant.name,
					price: variant.price,
					is_active: variant.is_active,
					images: images
						.filter((image) => image.variant_id === variant.id)
						.map((image) => ({
							id: image.id,
							imageUrl: image.image_url,
							sortOrder: image.sort_order
						}))
				}))
		}));

	return {
		product: {
			id: product.id,
			name: product.name,
			categoryId: product.category_id,
			status: product.status,
			variants
		},
		categories: categories ?? []
	};
};

export const actions: Actions = {
	update: async ({ request, locals, params }) => {
		const {
			data: { user },
			error: authError
		} = await locals.supabase.auth.getUser();

		if (authError || !user) {
			return fail(401, { message: 'Please sign in first.' });
		}

		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();

		if (profileError || profile?.role !== 'admin') {
			return fail(403, { message: 'Admin access required.' });
		}

		const formData = await request.formData();
		const rawPayload = formData.get('payload');

		if (typeof rawPayload !== 'string') {
			return fail(400, { message: 'Product data is missing.' });
		}

		let payload: unknown;

		try {
			payload = JSON.parse(rawPayload);
		} catch {
			return fail(400, { message: 'Invalid product data.' });
		}

		if (!isValidPayload(payload)) {
			return fail(400, {
				message: 'Invalid product, variant, price, or image data.'
			});
		}

		if (payload.product_id !== params.id) {
			return fail(400, { message: 'Product ID does not match this page.' });
		}

		const { data: currentProduct, error: currentProductError } =
			await locals.supabase
				.from('products')
				.select('id, name, slug')
				.eq('id', params.id)
				.single();

		if (currentProductError || !currentProduct) {
			return fail(404, { message: 'Product not found.' });
		}

		const { data: category, error: categoryError } = await locals.supabase
			.from('categories')
			.select('id')
			.eq('id', payload.category_id)
			.maybeSingle();

		if (categoryError || !category) {
			return fail(400, { message: 'Selected category does not exist.' });
		}

		// Fetch the current relational rows. These sets are also used to ensure
		// the submitted IDs really belong to this product.
		const { data: currentGroups, error: groupsError } = await locals.supabase
			.from('variant_groups')
			.select('id')
			.eq('product_id', params.id);

		if (groupsError) {
			console.error('Fetch variant groups failed:', groupsError);
			return fail(500, { message: 'Failed to read existing variants.' });
		}

		const currentGroupIds = new Set((currentGroups ?? []).map((row) => row.id));

		let currentSubVariants: { id: string; group_id: string }[] = [];

		if (currentGroupIds.size > 0) {
			const { data, error: subVariantsError } = await locals.supabase
				.from('product_variants')
				.select('id, group_id')
				.in('group_id', [...currentGroupIds]);

			if (subVariantsError) {
				console.error('Fetch sub-variants failed:', subVariantsError);
				return fail(500, { message: 'Failed to read existing sub-variants.' });
			}

			currentSubVariants = data ?? [];
		}

		const currentSubVariantIds = new Set(
			currentSubVariants.map((row) => row.id)
		);

		let currentImages: { id: string; variant_id: string; image_url: string }[] = [];

		if (currentSubVariantIds.size > 0) {
			const { data, error: currentImagesError } = await locals.supabase
				.from('variant_images')
				.select('id, variant_id, image_url')
				.in('variant_id', [...currentSubVariantIds]);

			if (currentImagesError) {
				console.error('Fetch existing images failed:', currentImagesError);
				return fail(500, { message: 'Failed to read existing images.' });
			}

			currentImages = data ?? [];
		}

		const currentImageById = new Map(
			(currentImages ?? []).map((image) => [image.id, image])
		);

		// Reject IDs that do not belong to this product, and reject an image
		// attached to a different sub-variant.
		for (const group of payload.variants) {
			if (group.id && !currentGroupIds.has(group.id)) {
				return fail(400, { message: 'Invalid variant group reference.' });
			}

			for (const sub of group.subVariants) {
				if (sub.id && !currentSubVariantIds.has(sub.id)) {
					return fail(400, { message: 'Invalid sub-variant reference.' });
				}

				if (sub.id) {
					const existingSub = (currentSubVariants ?? []).find(
						(row) => row.id === sub.id
					);

					if (!existingSub || !group.id || existingSub.group_id !== group.id) {
						return fail(400, { message: 'Sub-variant does not belong to this group.' });
					}
				}

				for (const image of sub.images) {
					if ('id' in image) {
						const existingImage = currentImageById.get(image.id);

						if (!existingImage || !sub.id || existingImage.variant_id !== sub.id) {
							return fail(400, { message: 'Invalid existing image reference.' });
						}
					}
				}
			}
		}

		// Validate and collect all newly uploaded files.
		const imageFiles = new Map<number, File>();

		for (const group of payload.variants) {
			for (const sub of group.subVariants) {
				for (const image of sub.images) {
					if (!('index' in image)) continue;

					const file = formData.get(`image_${image.index}`);

					if (
						!(file instanceof File) ||
						file.size === 0 ||
						!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
						file.size > MAX_IMAGE_SIZE
					) {
						return fail(400, {
							message: `Image ${image.index + 1} is invalid or exceeds 500 KB.`
						});
					}

					imageFiles.set(image.index, file);
				}
			}
		}

		const referencedIndexes = new Set<number>();

		for (const group of payload.variants) {
			for (const sub of group.subVariants) {
				for (const image of sub.images) {
					if ('index' in image) referencedIndexes.add(image.index);
				}
			}
		}

		if (
			referencedIndexes.size !== imageFiles.size ||
			[...referencedIndexes].some((index) => !imageFiles.has(index))
		) {
			return fail(400, { message: 'Image references are invalid.' });
		}

		const uploadedPaths: string[] = [];
		const uploadedImageUrls = new Map<number, string>();

		try {
			// Keep the current slug when the product name has not changed.
			let slug = currentProduct.slug;

			if (payload.name.trim() !== currentProduct.name) {
				const baseSlug = createSlug(payload.name);

				if (!baseSlug) {
					return fail(400, { message: 'Product name cannot form a slug.' });
				}

				const { data: existingProducts, error: slugError } =
					await locals.supabase
						.from('products')
						.select('slug')
						.like('slug', `${baseSlug}%`)
						.neq('id', params.id)
						.limit(1000);

				if (slugError) throw slugError;

				const existingSlugs = new Set(
					(existingProducts ?? []).map((product) => product.slug)
				);

				slug = baseSlug;
				let suffix = 2;

				while (existingSlugs.has(slug)) {
					slug = `${baseSlug}-${suffix++}`;
				}
			}

			// 1. Upload new files first. If an upload or later DB operation fails,
			// the catch block attempts to remove these newly uploaded objects.
			for (const [index, file] of imageFiles) {
				const path = `${params.id}/${crypto.randomUUID()}.${getImageExtension(file)}`;

				const { error: uploadError } = await locals.supabase.storage
					.from(BUCKET)
					.upload(path, file, {
						contentType: file.type,
						upsert: false,
						cacheControl: '31536000'
					});

				if (uploadError) throw uploadError;

				uploadedPaths.push(path);

				const { data: publicUrl } = locals.supabase.storage
					.from(BUCKET)
					.getPublicUrl(path);

				uploadedImageUrls.set(index, publicUrl.publicUrl);
			}

			// 2. Update the product's own fields.
			const { data: updatedProduct, error: updateProductError } =
    await locals.supabase
        .from('products')
        .update({
            name: payload.name.trim(),
            category_id: payload.category_id,
            status: payload.status,
            slug
        })
        .eq('id', params.id)
        .select('id')
        .maybeSingle();

			if (updateProductError) throw updateProductError;

			if (!updatedProduct) {
    throw new Error(
        'Product update failed. Check UPDATE RLS policy on products table.'
    );
			}

			const submittedGroupIds = new Set<string>();
			const submittedSubVariantIds = new Set<string>();
			const submittedImageIds = new Set<string>();

			// 3. Upsert groups, sub-variants, and their images.
			for (const [groupIndex, group] of payload.variants.entries()) {
				let groupId = group.id;

				if (groupId) {
					const { error: updateGroupError } = await locals.supabase
						.from('variant_groups')
						.update({
							name: group.name.trim(),
							sort_order: group.sort_order ?? groupIndex
						})
						.eq('id', groupId)
						.eq('product_id', params.id);

					if (updateGroupError) throw updateGroupError;
				} else {
					const { data: insertedGroup, error: insertGroupError } =
						await locals.supabase
							.from('variant_groups')
							.insert({
								product_id: params.id,
								name: group.name.trim(),
								sort_order: group.sort_order ?? groupIndex
							})
							.select('id')
							.single();

					if (insertGroupError) throw insertGroupError;
					groupId = insertedGroup.id;
				}

				submittedGroupIds.add(groupId);

				for (const [subIndex, sub] of group.subVariants.entries()) {
					let subVariantId = sub.id;

					if (subVariantId) {
						const { error: updateSubError } = await locals.supabase
							.from('product_variants')
							.update({
								name: sub.name.trim(),
								price: sub.price,
								is_active: sub.is_active,
								sort_order: sub.sort_order ?? subIndex
							})
							.eq('id', subVariantId)
							.eq('group_id', groupId);

						if (updateSubError) throw updateSubError;
					} else {
						const { data: insertedSub, error: insertSubError } =
							await locals.supabase
								.from('product_variants')
								.insert({
									group_id: groupId,
									name: sub.name.trim(),
									price: sub.price,
									is_active: sub.is_active,
									sort_order: sub.sort_order ?? subIndex
								})
								.select('id')
								.single();

						if (insertSubError) throw insertSubError;
						subVariantId = insertedSub.id;
					}

					submittedSubVariantIds.add(subVariantId);

					const desiredImages = sub.images.map((image) => {
						if ('id' in image) {
							submittedImageIds.add(image.id);
							return {
								id: image.id,
								variant_id: subVariantId,
								image_url: currentImageById.get(image.id)!.image_url,
								sort_order: image.sort_order + 1
							};
						}

						const imageUrl = uploadedImageUrls.get(image.index);
						if (!imageUrl) {
							throw new Error(`Uploaded image ${image.index} URL is missing.`);
						}

						return {
							variant_id: subVariantId,
							image_url: imageUrl,
							sort_order: image.sort_order + 1
						};
					});

					// Existing image rows retain their IDs; new images are inserted.
					for (const image of desiredImages) {
						if ('id' in image) {
							const { error: updateImageError } = await locals.supabase
								.from('variant_images')
								.update({ sort_order: image.sort_order })
								.eq('id', image.id)
								.eq('variant_id', subVariantId);

							if (updateImageError) throw updateImageError;
						} else {
							const { error: insertImageError } = await locals.supabase
								.from('variant_images')
								.insert({
									variant_id: image.variant_id,
									image_url: image.image_url,
									sort_order: image.sort_order
								});

							if (insertImageError) throw insertImageError;
						}
					}
				}
			}

			// 4. Delete omitted image rows, then their Storage objects.
			const removedImages = (currentImages ?? []).filter(
				(image) => !submittedImageIds.has(image.id)
			);

			if (removedImages.length > 0) {
				const { error: deleteImagesError } = await locals.supabase
					.from('variant_images')
					.delete()
					.in('id', removedImages.map((image) => image.id));

				if (deleteImagesError) throw deleteImagesError;
			}

			// 5. Delete omitted sub-variants and groups.
			const removedSubVariantIds = [...currentSubVariantIds].filter(
				(id) => !submittedSubVariantIds.has(id)
			);

			if (removedSubVariantIds.length > 0) {
				const { error: deleteSubVariantsError } = await locals.supabase
					.from('product_variants')
					.delete()
					.in('id', removedSubVariantIds);

				if (deleteSubVariantsError) throw deleteSubVariantsError;
			}

			const removedGroupIds = [...currentGroupIds].filter(
				(id) => !submittedGroupIds.has(id)
			);

			if (removedGroupIds.length > 0) {
				const { error: deleteGroupsError } = await locals.supabase
					.from('variant_groups')
					.delete()
					.in('id', removedGroupIds);

				if (deleteGroupsError) throw deleteGroupsError;
			}

			// Storage cleanup is performed after DB rows have been reconciled.
			const removedStoragePaths = removedImages
				.map((image) => getStoragePathFromPublicUrl(image.image_url))
				.filter((path): path is string => path !== null);

			if (removedStoragePaths.length > 0) {
				const { error: removeStorageError } = await locals.supabase.storage
					.from(BUCKET)
					.remove(removedStoragePaths);

				if (removeStorageError) {
					// The DB update is already complete. Log this for manual cleanup
					// rather than reporting the whole update as failed.
					console.error('Remove old product images from Storage failed:', removeStorageError);
				}
			}

			return {
				success: true,
				message: 'Product updated successfully.',
				productId: params.id
			};
		} catch (updateError) {
			console.error('Update product failed:', updateError);

			// Best-effort cleanup for files uploaded during this request.
			if (uploadedPaths.length > 0) {
				const { error: storageCleanupError } = await locals.supabase.storage
					.from(BUCKET)
					.remove(uploadedPaths);

				if (storageCleanupError) {
					console.error('Uploaded image cleanup failed:', storageCleanupError);
				}
			}

			return fail(500, {
				message:
					'Failed to update product. Some database changes may already have been applied; check server logs before retrying.'
			});
		}
	}
};
