import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
	const { data: product, error: queryError } = await supabase
		.from('products')
		.select(`
			id,
			name,
			slug,
			categories (
				name
			),
			variant_groups (
				id,
				name,
				sort_order,
				product_variants (
					id,
					name,
					price,
					is_active,
					sort_order,
					variant_images (
						id,
						image_url,
						sort_order
					)
				)
			)
		`)
		.eq('slug', params.slug)
		.eq('status', 'published')
		.maybeSingle();

	if (queryError) {
		console.error('Error loading product:', queryError);
		error(500, 'Terjadi kesalahan saat memuat produk.');
	}

	if (!product) {
		error(404, 'Produk tidak ditemukan.');
	}

	const variantGroups = (product.variant_groups ?? [])
		.map((group) => ({
			...group,
			product_variants: (group.product_variants ?? [])
				.filter((variant) => variant.is_active)
				.map((variant) => ({
					...variant,
					variant_images: [...(variant.variant_images ?? [])].sort(
						(a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
					)
				}))
				.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
		}))
		.filter((group) => group.product_variants.length > 0)
		.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

	return {
		product: {
			...product,
			variant_groups: variantGroups
		}
	};
};