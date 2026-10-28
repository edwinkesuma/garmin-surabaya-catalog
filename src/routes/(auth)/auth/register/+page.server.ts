
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();

    const fullName = String(
      formData.get('full_name') ?? ''
    ).trim();

    const email = String(
      formData.get('email') ?? ''
    ).trim();

    const password = String(
      formData.get('password') ?? ''
    );

    if (!fullName || !email || !password) {
      return fail(400, {
        message: 'Semua field wajib diisi.'
      });
    }

    if (password.length < 8) {
      return fail(400, {
        message: 'Password minimal 8 karakter.'
      });
    }

    const { data, error } =
      await locals.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

    if (error) {
      return fail(400, {
        message: 'Registrasi gagal. Silakan periksa data kamu.'
      });
    }

    // Jika email confirmation aktif, user mungkin
    // perlu memverifikasi email sebelum bisa login.
    if (data.user && !data.session) {
      return {
        message: 'Silakan periksa email untuk verifikasi akun.'
      };
    }

    throw redirect(303, '/auth/login');
  }
};
