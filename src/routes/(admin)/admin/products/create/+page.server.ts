
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSlug } from '#lib/utils/slug.ts';

const BUCKET = 'product-images';
const MAX_IMAGE_SIZE = 500 * 1024;
const MAX_IMAGES_PER_VARIANT = 2;
const MAX_VARIANTS = 30;
const MAX_SUB_VARIANTS = 100;

type ImageInput = {
	index: number;
	sort_order: number;
};

type SubVariantInput = {
	name: string;
	price: number;
	is_active: boolean;
	sort_order: number;
	images: ImageInput[];
};

type VariantGroupInput = {
	name: string;
	sort_order: number;
	subVariants: SubVariantInput[];
};

type ProductPayload = {
	name: string;
	category_id: string;
	status: 'published' | 'draft';
	variants: VariantGroupInput[];
};

function isValidPayload(value: unknown): value is ProductPayload {
	if (!value || typeof value !== 'object') return false;

	const data = value as Record<string, unknown>;

	if (
		typeof data.name !== 'string' ||
		!data.name.trim() ||
		data.name.length > 200 ||
		typeof data.category_id !== 'string' ||
		!['published', 'draft'].includes(String(data.status)) ||
		!Array.isArray(data.variants) ||
		data.variants.length < 1 ||
		data.variants.length > MAX_VARIANTS
	) {
		return false;
	}

	let totalSubVariants = 0;

	for (const group of data.variants) {
		if (
			!group ||
			typeof group !== 'object' ||
			typeof group.name !== 'string' ||
			!group.name.trim() ||
			group.name.length > 100 ||
			!Array.isArray(group.subVariants) ||
			group.subVariants.length < 1
		) {
			return false;
		}

		for (const sub of group.subVariants) {
			totalSubVariants++;

			if (
				!sub ||
				typeof sub !== 'object' ||
				typeof sub.name !== 'string' ||
				!sub.name.trim() ||
				sub.name.length > 100 ||
				typeof sub.price !== 'number' ||
				!Number.isFinite(sub.price) ||
				sub.price < 0 ||
				typeof sub.is_active !== 'boolean' ||
				!Array.isArray(sub.images) ||
				sub.images.length > MAX_IMAGES_PER_VARIANT
			) {
				return false;
			}

			for (const image of sub.images) {
				if (
					!Number.isInteger(image.index) ||
					image.index < 0 ||
					!Number.isInteger(image.sort_order) ||
					image.sort_order < 0
				) {
					return false;
				}
			}
		}
	}

	return totalSubVariants <= MAX_SUB_VARIANTS;
}

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories, error } = await locals.supabase
		.from('categories')
		.select('id, name')
		.order('name');

	if (error) {
		console.error('Fetch categories failed:', error);
	}

	return { categories: categories ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { data: authData, error: authError } =
			await locals.supabase.auth.getUser();

		if (authError || !authData.user) {
			return fail(401, { message: 'Please sign in first.' });
		}

		// Ganti pemeriksaan role ini sesuai struktur profiles project-mu.
		const { data: profile, error: profileError } = await locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', authData.user.id)
			.single();

        console.log(`profile error: ${profileError}`);
        console.log(`user role: ${profile?.role}`);

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

		// Pastikan kategori benar-benar ada.
		const { data: category, error: categoryError } =
			await locals.supabase
				.from('categories')
				.select('id')
				.eq('id', payload.category_id)
				.maybeSingle();

		if (categoryError || !category) {
			return fail(400, { message: 'Selected category does not exist.' });
		}

		const imageFiles = new Map<number, File>();

		for (const group of payload.variants) {
			for (const sub of group.subVariants) {
				for (const image of sub.images) {
					if (imageFiles.has(image.index)) {
						continue;
					}

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
					referencedIndexes.add(image.index);
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
		let productId: string | null = null;

		try {
			// Compress images on the client first. This is a server-side
			// size check, not a substitute for client-side compression.
			const baseSlug = createSlug(payload.name);

			if (!baseSlug) {
				return fail(400, { message: 'Product name cannot form a slug.' });
			}

			let slug = baseSlug;

			const { data: existingProducts, error: slugError } =
				await locals.supabase
					.from('products')
					.select('slug')
					.like('slug', `${baseSlug}%`)
					.limit(1000);

			if (slugError) throw slugError;

			const existingSlugs = new Set(
				(existingProducts ?? []).map((product) => product.slug)
			);

			let suffix = 2;

			while (existingSlugs.has(slug)) {
				slug = `${baseSlug}-${suffix++}`;
			}

			// 1. Create product.
			const { data: product, error: productError } =
				await locals.supabase
					.from('products')
					.insert({
						category_id: payload.category_id,
						name: payload.name.trim(),
						slug,
						status: payload.status
					})
					.select('id')
					.single();

			if (productError) throw productError;

			productId = product.id;

			// 2. Upload images to Supabase Storage.
			// Paths are unique per product and sub-variant.
			const uploadedImageUrls = new Map<number, string>();

			for (const [index, file] of imageFiles) {
				const extension =
					file.type === 'image/png'
						? 'png'
						: file.type === 'image/webp'
							? 'webp'
							: 'jpg';

				const path =
					`${productId}/${crypto.randomUUID()}.${extension}`;

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

			// 3. Create variant groups.
			for (const [groupIndex, group] of payload.variants.entries()) {
                
				const { data: groupRow, error: groupError } =
					await locals.supabase
						.from('variant_groups')
						.insert({
							product_id: productId,
							name: group.name.trim(),
							sort_order: group.sort_order ?? groupIndex
						})
						.select('id')
						.single();

				if (groupError) throw groupError;

				// 4. Create sub-variants.
				for (const [subIndex, sub] of group.subVariants.entries()) {
                    
					const { data: variantRow, error: variantError } =
						await locals.supabase
							.from('product_variants')
							.insert({
								group_id: groupRow.id,
								name: sub.name.trim(),
								price: sub.price,
								sort_order: sub.sort_order ?? subIndex,
								is_active: sub.is_active
							})
							.select('id')
							.single();

					if (variantError) throw variantError;

					// 5. Link images to the sub-variant.
					if (sub.images.length > 0) {
						const imageRows = sub.images.map((image, imageIndex) => {
    						const imageUrl = uploadedImageUrls.get(image.index);

    						if (!imageUrl) {
        						throw new Error('Uploaded image URL is missing.');
    						}

    						return {
        						variant_id: variantRow.id,
        						image_url: imageUrl,
        						sort_order: imageIndex + 1
    						};
						});

						const { error: imageError } = await locals.supabase
							.from('variant_images')
							.insert(imageRows);

						if (imageError) throw imageError;
					}
				}
			}

			return {
				success: true,
				message: 'Product created successfully.',
				productId
			};
		} catch (error) {
			console.error('Create product failed:', error);

			// Best-effort cleanup if any step fails.
			if (productId) {
				const { error: deleteError } = await locals.supabase
					.from('products')
					.delete()
					.eq('id', productId);

				if (deleteError) {
					console.error('Product rollback failed:', deleteError);
				}
			}

			if (uploadedPaths.length > 0) {
				const { error: storageError } = await locals.supabase.storage
					.from(BUCKET)
					.remove(uploadedPaths);

				if (storageError) {
					console.error('Storage cleanup failed:', storageError);
				}
			}

			return fail(500, {
				message: 'Failed to create product. Check server logs and database policies.'
			});
		}
	}
};
