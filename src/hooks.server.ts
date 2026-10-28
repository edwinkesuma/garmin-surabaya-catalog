import { createSupabaseServerClient } from '#lib/supabase/server.ts';
import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
    event.locals.supabase = createSupabaseServerClient(
        event.cookies
    );

    const { data, error } =
        await event.locals.supabase.auth.getClaims();

    event.locals.user = error ? null : data?.claims ?? null;
    event.locals.profile = null;

    const userId = event.locals.user?.sub;

    if (userId) {
        const { data: profile, error: profileError } =
            await event.locals.supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

        if (profileError) {
            console.error('Fetch profile failed:', profileError.message);
        }

        event.locals.profile = profile;
    }

    return resolve(event);
};