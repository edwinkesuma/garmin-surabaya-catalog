
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 12;

export const load: PageServerLoad = async ({ locals, url }) => {
	const pageParam = Number(url.searchParams.get('page') ?? 1);
	const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

	const search = (url.searchParams.get('search') ?? '').trim();
	const category = url.searchParams.get('category') ?? '';
	const sort = url.searchParams.get('sort') ?? 'newest';

	const validSorts = [
		'newest',
		'oldest',
		'name_asc',
		'name_desc'
	];

	const selectedSort = validSorts.includes(sort) ? sort : 'newest';

	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	// Load categories
	const { data: categories, error: categoryError } =
		await locals.supabase
			.from('categories')
			.select('id, name, slug')
			.order('name', { ascending: true });

	if (categoryError) {
		console.error('Load categories failed:', categoryError.message);
	}

	// Build products query
	let query = locals.supabase
		.from('products')
		.select(
			`
				id,
				name,
				slug,
				category_id,
				created_at,
				categories (
					id,
					name,
					slug
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
			`,
			{ count: 'exact' }
		)
		.eq('status', 'published');

	// Search by product name
	if (search) {
		query = query.ilike('name', `%${search}%`);
	}

	// Filter by category
	if (category) {
		query = query.eq('category_id', category);
	}

	// Sorting
	switch (selectedSort) {
		case 'oldest':
			query = query.order('created_at', {
				ascending: true
			});
			break;

		case 'name_asc':
			query = query.order('name', {
				ascending: true
			});
			break;

		case 'name_desc':
			query = query.order('name', {
				ascending: false
			});
			break;

		default:
			query = query.order('created_at', {
				ascending: false
			});
	}

	// Pagination
	const { data: products, count, error } = await query.range(from, to);

	if (error) {
		console.error('Load products failed:', error.message);
	}

	const totalProducts = count ?? 0;
	const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

	return {
		categories: categories ?? [],
		products: (products ?? []).map((product) => {
			const variants = (product.variant_groups ?? [])
				.flatMap((group) => group.product_variants ?? [])
				.filter((variant) => variant.is_active)
				.sort((a, b) => a.price - b.price);

			const images = (product.variant_groups ?? [])
				.flatMap((group) => group.product_variants ?? [])
				.filter((variant) => variant.is_active)
				.sort((a, b) => a.sort_order - b.sort_order)
				.flatMap((variant) =>
					(variant.variant_images ?? [])
						.sort((a, b) => a.sort_order - b.sort_order)
						.map((image) => image.image_url)
				);

			return {
				id: product.id,
				name: product.name,
				slug: product.slug,
				category: product.categories,
				price: variants[0]?.price ?? null,
				image: images[0] ?? null
			};
		}),

		pagination: {
			currentPage: page,
			pageSize: PAGE_SIZE,
			totalProducts,
			totalPages,
			from: totalProducts > 0 ? from + 1 : 0,
			to: Math.min(to + 1, totalProducts)
		},

		filters: {
			search,
			category,
			sort: selectedSort
		},

		error: error ? 'Gagal memuat produk.' : null
	};
};
