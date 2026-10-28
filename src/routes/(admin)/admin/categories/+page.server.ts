import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { createSlug } from '#lib/utils/slug.ts';

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
	}
};