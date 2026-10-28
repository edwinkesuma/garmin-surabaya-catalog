import { createSupabaseServerClient } from '#lib/supabase/server.ts';
import type { Handle } from '@sveltejs/kit/hooks';   

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase =
    createSupabaseServerClient(event.cookies);

  const { data, error } =
    await event.locals.supabase.auth.getClaims();

  event.locals.user = error ? null : data?.claims ?? null;

  return resolve(event);
};