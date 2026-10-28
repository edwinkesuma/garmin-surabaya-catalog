<script lang="ts">
	import { Webhook } from '@lucide/svelte';

	let showPassword = $state(false);
	let email = $state("");
	let password = $state("");

  let { form } = $props();
</script>

<svelte:head>
	<title>
		Log in - GARMIN PAKUWON
	</title>
	<meta name="description" content="Sign in GARMIN PAKUWON account." />
</svelte:head>

<main class="min-h-screen bg-[#f5f2ed] px-4 py-6 text-[#202326] sm:px-8 lg:px-12 lg:py-10">
	<div class="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_250px] lg:items-start xl:gap-12">
		<section class="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_55px_rgba(48,38,28,0.10)]">
			<div class="grid min-h-155 md:grid-cols-2">
				<!-- Photo + brand panel -->
				<aside class="relative hidden min-h-full overflow-hidden md:block">
				 	<img 
				 		src="/images/watch.png" 
				 		alt=""
						class="absolute inset-0 h-full w-full object-cover"/>

					<div class="absolute inset-0 bg-linear-to-b from-[#e7ded2]/50 via-transparent to-[#4a3525]/10"></div>
					
					<a href="/" class="absolute left-7 top-7 inline-flex items-center gap-2 font-semibold tracking-tight">
						<Webhook size={25}/>
            			GARMIN PAKUWON
					</a>

					<div class="absolute left-7 right-7 top-[22%] max-w-sm">
            			<h1 class="font-serif text-3xl font-medium leading-[1.12] tracking-tight lg:text-[2.55rem]">
              				Better spaces, for a calmer you.
            			</h1>
            			<p class="mt-4 max-w-xs text-sm leading-6 text-[#5e6265]">
              				Discover furniture that brings comfort, style, and harmony to your home.
            			</p>
          			</div>
				</aside>

				<div class="flex flex-col p-6 sm:p-10 lg:px-12 lg:py-8">
          <div class="flex items-center justify-between md:justify-end">
            <a href="/" class="inline-flex items-center gap-2 font-semibold md:hidden">
              <svg viewBox="0 0 24 24" class="h-6 w-6 fill-current" aria-hidden="true">
                <path d="M3 10.2 12 3l9 7.2v10.3h-6.1v-6.4H9.1v6.4H3V10.2Z" />
              </svg>
              Nestify
            </a>
            <p class="text-xs text-[#777d82]">
              Don't have an account?
              <a
                href="/auth/register"
                type="button"
                class="ml-1 font-medium text-[#a75f2c] hover:text-[#78421e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a75f2c]"
              >
                Register
              </a>
            </p>
          </div>

          <div class="mx-auto my-auto w-full max-w-md py-10 md:py-14">
            <h2 class="font-serif text-3xl font-medium tracking-tight">
              Welcome back
            </h2>
            <p class="mt-1 text-sm text-[#777d82]">
              Sign in to your Nestify account
            </p>

            <form class="mt-8 space-y-5" method="POST">
              <div>
                <label for="email" class="mb-2 block text-xs font-medium">Email address</label>
                <div class="flex h-11 items-center gap-3 rounded-lg border border-[#dedfdf] px-3 transition focus-within:border-[#9b765b] focus-within:ring-2 focus-within:ring-[#9b765b]/15">
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-[#555c61]" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                    <path d="m4.5 7 7.5 6 7.5-6" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    bind:value={email}
                    required
                    class="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9da0]"
                  />
                </div>
              </div>

              <div>
                <label for="password" class="mb-2 block text-xs font-medium">Password</label>
                <div class="flex h-11 items-center gap-3 rounded-lg border border-[#dedfdf] px-3 transition focus-within:border-[#9b765b] focus-within:ring-2 focus-within:ring-[#9b765b]/15">
                  <svg viewBox="0 0 24 24" class="h-4 w-4 shrink-0 text-[#555c61]" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="1.8" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autocomplete='current-password'
                    placeholder="Enter your password"
                    bind:value={password}
                    required
                    minlength="8"
                    class="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9a9da0]"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    class="shrink-0 text-[#555c61] hover:text-black"
                    onclick={() => (showPassword = !showPassword)}
                  >
                    {#if showPassword}
                      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                        <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                        <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 5 8.5 7s-1.2 3.1-2.5 4.3M6.2 6.2C3.8 7.7 2.5 10.2 2.5 12c0 2 3.5 7 9.5 7 1 0 1.9-.2 2.7-.5" />
                      </svg>
                    {:else}
                      <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>

              {#if form?.message}
                <p
                  role="alert"
                  class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {form.message}
                </p>
              {/if}

              <button
                type="submit"
                class="flex h-12 w-full items-center justify-center rounded-lg bg-[#202326] px-4 text-sm font-semibold text-white transition hover:bg-[#373a3d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a75f2c] active:scale-[0.99]"
              >
                Log in
              </button>

              <!-- {#if mode === 'register'}
                <p class="text-center text-xs leading-5 text-[#85898d]">
                  By continuing, you agree to our
                  <a href="/terms" class="text-[#a75f2c] hover:underline">Terms of Service</a>
                  and
                  <a href="/privacy" class="text-[#a75f2c] hover:underline">Privacy Policy</a>.
                </p>
              {/if} -->
            </form>

            <!-- <div class="mt-7 flex items-center gap-3 text-xs text-[#777d82]">
              <span class="h-px flex-1 bg-[#e4e3e1]"></span>
              <span>or</span>
              <span class="h-px flex-1 bg-[#e4e3e1]"></span>
            </div> -->
          </div>
        </div>
			</div>
		</section>
	</div>
</main>