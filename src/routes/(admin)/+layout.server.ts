import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({
  locals: { supabase }
}) => {
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  // Belum login atau sesi tidak valid
  if (authError || !user) {
    redirect(303, '/auth/login');
  }

  // Ambil role pengguna dari database
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

    console.log(`profile: ${profile?.role}`);
  // Profil tidak ditemukan atau gagal diperiksa
  if (error || !profile) {
    redirect(303, '/');
  }

  // Sudah login, tetapi bukan admin
  if (profile.role !== 'admin') {
    redirect(303, '/');
  }

  return {
    user,
    profile
  };
};