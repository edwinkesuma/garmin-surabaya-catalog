import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSlug } from '#lib/utils/slug.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const { data, error } = await locals.supabase
  		.from('category_list')
  		.select('*')
  		.order('created_at', { ascending: false });

  if (error) {
    console.error('Load categories failed:', error.message);

    return {
      categories: [],
      error: 'Gagal memuat categories.'
    };
  }

  console.log(data);
  return {
    categories: data ?? [],
    error: null
  };
};


export const actions: Actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '').trim();

		if (!name) {
			return fail(400, {
				error: 'Nama kategori wajib diisi.',
				name
			});
		}

		if (name.length > 100) {
			return fail(400, {
				error: 'Nama kategori maksimal 100 karakter.',
				name
			});
		}

		const slug = createSlug(name);

		if (!slug) {
			return fail(400, {
				error: 'Nama kategori tidak menghasilkan slug yang valid.',
				name
			});
		}

		const { error } = await locals.supabase
			.from('categories')
			.insert({
				name,
				slug
			});

		if (error) {
			console.error('Create category error:', error);

			if (error.code === '23505') {
				return fail(409, {
					error: 'Kategori dengan slug tersebut sudah ada.',
					name
				});
			}

			return fail(500, {
				error: 'Gagal membuat kategori. Silakan coba lagi.',
				name
			});
		}

		return {
			success: true
		};
	},

	update: async ({ request, locals }) => {
    	if (!locals.user) {
      		return fail(401, {
        		message: 'Silakan login terlebih dahulu.'
      		});
    	}

    	const formData = await request.formData();
    	const id = formData.get('id');
    	const name = String(formData.get('name') ?? '').trim();

    	if (!name || name.length > 100) {
      		return fail(400, {
        		message: 'ID atau nama category tidak valid.'
      		});
    	}

    	const { data, error } = await locals.supabase
      		.from('categories')
      		.update({ name })
      		.eq('id', id)
      		.select('id')
      		.maybeSingle();

    	if (error) {
      		console.error('Update category failed:', error.message);

      		return fail(500, {
        		message: 'Gagal memperbarui category.'
      		});
    	}

    	if (!data) {
      		return fail(404, {
        		message: 'Category tidak ditemukan atau tidak dapat diubah.'
      		});
    	}

    	return {
      		success: true,
      		message: 'Category berhasil diperbarui.'
    	};
  	},
	
	delete: async ({ request, locals }) => {
    	if (!locals.user) {
        	return fail(401, {
            	message: 'Silakan login terlebih dahulu.'
        	});
    	}

    	// Pastikan pengguna adalah admin.
    	if (locals.profile?.role !== 'admin') {
        	return fail(403, {
            	message: 'Kamu tidak memiliki akses untuk menghapus kategori.'
        	});
    	}

    	const formData = await request.formData();
    	const rawId = formData.get('id');

    	// Periksa apakah kategori masih digunakan oleh produk.
    	const { count, error: countError } = await locals.supabase
        	.from('products')
        	.select('id', { count: 'exact', head: true })
        	.eq('category_id', rawId);

    	if (countError) {
        	console.error(
            	'Check category products failed:',
            	countError.message
        	);

        	return fail(500, {
            	message: 'Gagal memeriksa produk dalam kategori.'
        	});
    	}

    	if ((count ?? 0) > 0) {
        	return fail(400, {
            	message: `Kategori ini masih digunakan oleh ${count} produk. Pindahkan produk ke kategori lain sebelum menghapusnya.`
        	});
    	}

    	// Hapus kategori jika tidak memiliki produk.
    	const { data, error } = await locals.supabase
        	.from('categories')
        	.delete()
        	.eq('id', rawId)
        	.select('id')
        	.maybeSingle();

    	if (error) {
        	console.error(
            	'Delete category failed:',
            	error.message
        	);

        	return fail(500, {
            	message: 'Gagal menghapus kategori.'
        	});
    	}

    	if (!data) {
        	return fail(404, {
            	message: 'Kategori tidak ditemukan atau tidak dapat dihapus.'
        	});
    	}

    	return {
        	success: true,
        	message: 'Kategori berhasil dihapus.'
    	};
	}
};