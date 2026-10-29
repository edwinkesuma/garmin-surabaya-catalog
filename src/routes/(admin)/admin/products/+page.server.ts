
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ locals, url }) => {
  const { supabase, user } = locals;

  if (!user) {
    throw error(401, 'Silakan login terlebih dahulu.');
  }

  // Ambil filter dari URL.
  const search = (url.searchParams.get('q') ?? '').trim();
  const categoryId = url.searchParams.get('category') ?? '';
  const statusFilter = url.searchParams.get('status') ?? '';

  const allowedStatuses = ['published', 'draft'];
  const status = allowedStatuses.includes(statusFilter)
    ? statusFilter
    : '';

  const requestedPage = Math.max(
    1,
    Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1
  );

  // Ambil kategori dan statistik keseluruhan.
  const [categoriesResult, totalResult, publishedResult] =
    await Promise.all([
      supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true }),

      supabase
        .from('products')
        .select('id', { count: 'exact', head: true }),

      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
    ]);

  if (categoriesResult.error) {
    console.error('Fetch categories error:', categoriesResult.error);
    throw error(500, 'Gagal mengambil data kategori.');
  }

  if (totalResult.error) {
    console.error('Count products error:', totalResult.error);
    throw error(500, 'Gagal menghitung produk.');
  }

  if (publishedResult.error) {
    console.error('Count published products error:', publishedResult.error);
    throw error(500, 'Gagal menghitung produk Published.');
  }

  // Buat query produk dengan filter yang aktif.
  const buildProductsQuery = () => {
    let query = supabase
      .from('products')
      .select(`
        id,
        category_id,
        name,
        slug,
        status,
        created_at,
        updated_at,
        category:categories (
          id,
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
            sort_order,
            is_active
          )
        )
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    return query.order('created_at', { ascending: false });
  };

  // Query halaman yang diminta.
  let page = requestedPage;
  let from = (page - 1) * PAGE_SIZE;
  let to = from + PAGE_SIZE - 1;

  let productsResult = await buildProductsQuery().range(from, to);

  if (productsResult.error) {
    console.error('Fetch products error:', productsResult.error);
    throw error(500, 'Gagal mengambil data produk.');
  }

  const filteredCount = productsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  // Jika URL meminta halaman yang sudah tidak ada, gunakan halaman terakhir.
  if (page > totalPages) {
    page = totalPages;
    from = (page - 1) * PAGE_SIZE;
    to = from + PAGE_SIZE - 1;

    productsResult = await buildProductsQuery().range(from, to);

    if (productsResult.error) {
      console.error('Fetch products error:', productsResult.error);
      throw error(500, 'Gagal mengambil data produk.');
    }
  }

  const rawProducts = productsResult.data ?? [];

  // Kumpulkan ID seluruh sub-variant pada halaman ini.
  const variantIds = [
    ...new Set(
      rawProducts.flatMap((product) =>
        (product.variant_groups ?? []).flatMap((group) =>
          (group.product_variants ?? []).map((variant) => variant.id)
        )
      )
    )
  ];

  // Ambil gambar dari tabel variant_images secara terpisah.
  const imagesByVariant = new Map<
    string,
    { image_url: string; sort_order: number }[]
  >();

  if (variantIds.length > 0) {
    const { data: images, error: imagesError } = await supabase
      .from('variant_images')
      .select('variant_id, image_url, sort_order')
      .in('variant_id', variantIds)
      .order('sort_order', { ascending: true });

    if (imagesError) {
      console.error('Fetch variant images error:', imagesError);
      throw error(500, 'Gagal mengambil gambar produk.');
    }

    for (const image of images ?? []) {
      if (!image.image_url?.trim()) continue;

      const currentImages = imagesByVariant.get(image.variant_id) ?? [];

      currentImages.push({
        image_url: image.image_url,
        sort_order: image.sort_order
      });

      imagesByVariant.set(image.variant_id, currentImages);
    }
  }

  // Bentuk data yang digunakan halaman.
  const products = rawProducts.map((product) => {
    const variantGroups = [...(product.variant_groups ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );

    const variants = variantGroups.flatMap((group) =>
      [...(group.product_variants ?? [])].sort(
        (a, b) => a.sort_order - b.sort_order
      )
    );

    const firstActiveVariant = variants.find(
      (variant) => variant.is_active
    );

    let firstImage: string | null = null;

    // Cari gambar pertama yang tersedia dari seluruh sub-variant.
    for (const variant of variants) {
      const variantImages = imagesByVariant.get(variant.id) ?? [];
      const image = variantImages.find(
        (item) => item.image_url.trim().length > 0
      );

      if (image) {
        firstImage = image.image_url;
        break;
      }
    }

    const category = Array.isArray(product.category)
      ? product.category[0]
      : product.category;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      categoryId: product.category_id,
      category: category?.name ?? 'Uncategorized',
      price: firstActiveVariant?.price ?? 0,
      image: firstImage,
      description: firstActiveVariant?.name ?? 'No variant available',
      status:
        product.status?.toLowerCase() === 'published'
          ? 'Published'
          : 'Draft'
    };
  });

  return {
    products,
    categories: categoriesResult.data ?? [],
    pagination: {
      page,
      pageSize: PAGE_SIZE,
      totalCount: filteredCount,
      totalPages,
      from: filteredCount === 0 ? 0 : from + 1,
      to: Math.min(to + 1, filteredCount)
    },
    stats: {
      totalProducts: totalResult.count ?? 0,
      publishedProducts: publishedResult.count ?? 0
    },
    filters: {
      search,
      category: categoryId,
      status
    }
  };
};
