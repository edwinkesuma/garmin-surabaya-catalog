
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();

    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      return fail(400, {
        message: 'Email dan password wajib diisi.'
      });
    }

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
console.log(`error code: ${error.code},
    error message: ${error.message},
    error name: ${error.name}
    `);

      return fail(400, {
        message: 'Login gagal. Periksa email dan passwordmu.'
      });
    }

    throw redirect(303, '/');
  }
};