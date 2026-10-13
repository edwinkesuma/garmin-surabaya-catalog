<script>
	import { Webhook, Search } from '@lucide/svelte';
</script>

<nav class="fixed top-0 right-0 left-0 mx-10 my-5 flex items-center rounded-lg bg-surface p-5">
	<!-- left side of navbar -->
	<div class="flex items-center justify-center">
		<Webhook size={25} class="mr-2" />
		<h1 class="text-xl font-bold">G A R M I N</h1>
	</div>
	<!-- right side of navbar -->
	<div class="ml-10 w-3xl">
		<div
			class="flex items-center gap-2 rounded-full border border-surface-muted bg-background pl-5"
		>
			<input type="text" placeholder="Search" class="w-full bg-transparent outline-none" />

			<div class="rounded-full bg-primary p-2">
				<Search size={20} class="text-surface" />
			</div>
		</div>
	</div>
</nav>
