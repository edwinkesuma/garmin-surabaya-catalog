
<script lang="ts">
  import { goto } from '$app/navigation';
  import { deserialize } from '$app/forms';
  import imageCompression from 'browser-image-compression';

  type Category = {
    id: string;
    name: string;
  };

  type SubVariantImage = {
    id: string;
    file: File;
    preview: string;
  };

  type SubVariant = {
    id: number;
    name: string;
    price: number | string;
    is_active: boolean;
    images: SubVariantImage[];
  };

  type VariantGroup = {
    id: number;
    name: string;
    subVariants: SubVariant[];
  };

  let { data } = $props<{ data: { categories: Category[] } }>();

  let productName = $state('');
  let categoryId = $state('');
  let productStatus = $state<'draft' | 'published'>('draft');

  let variantGroups = $state<VariantGroup[]>([
    {
      id: 1,
      name: 'AMOLED',
      subVariants: [
        {
          id: 1,
          name: 'Orange',
          price: '',
          is_active: true,
          images: []
        },
        {
          id: 2,
          name: 'White',
          price: '',
          is_active: true,
          images: []
        }
      ]
    },
    {
      id: 2,
      name: 'Solar',
      subVariants: [
        {
          id: 3,
          name: 'Slate',
          price: '',
          is_active: true,
          images: []
        }
      ]
    }
  ]);

  let isSubmitting = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');

  let nextGroupId = 3;
  let nextSubVariantId = 4;

  const MAX_IMAGES_PER_VARIANT = 2;
  const MAX_ORIGINAL_SIZE = 10 * 1024 * 1024;
  const MAX_COMPRESSED_SIZE = 500 * 1024;

  const formatRupiah = (value: number | string | undefined) => {
    if (value === '' || value === undefined || value === null) {
      return '';
    }

    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return '';
    }

    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  function addVariantGroup() {
    variantGroups = [
      ...variantGroups,
      {
        id: nextGroupId++,
        name: '',
        subVariants: [
          {
            id: nextSubVariantId++,
            name: '',
            price: '',
            is_active: true,
            images: []
          }
        ]
      }
    ];
  }

  function removeVariantGroup(groupId: number) {
    const group = variantGroups.find((item) => item.id === groupId);

    group?.subVariants.forEach((variant) => {
      variant.images.forEach((image) => URL.revokeObjectURL(image.preview));
    });

    variantGroups = variantGroups.filter((group) => group.id !== groupId);
  }

  function addSubVariant(groupId: number) {
    variantGroups = variantGroups.map((group) => {
      if (group.id !== groupId) return group;

      return {
        ...group,
        subVariants: [
          ...group.subVariants,
          {
            id: nextSubVariantId++,
            name: '',
            price: '',
            is_active: true,
            images: []
          }
        ]
      };
    });
  }

  function removeSubVariant(groupId: number, subVariantId: number) {
    const group = variantGroups.find((item) => item.id === groupId);
    const variant = group?.subVariants.find((item) => item.id === subVariantId);

    variant?.images.forEach((image) => URL.revokeObjectURL(image.preview));

    variantGroups = variantGroups.map((item) => {
      if (item.id !== groupId) return item;

      return {
        ...item,
        subVariants: item.subVariants.filter(
          (subVariant) => subVariant.id !== subVariantId
        )
      };
    });
  }

  async function handleImageChange(
    event: Event,
    groupId: number,
    subVariantId: number
  ) {
    const input = event.currentTarget as HTMLInputElement;
    const selectedFiles = Array.from(input.files ?? []);

    errorMessage = '';

    const group = variantGroups.find((item) => item.id === groupId);
    const variant = group?.subVariants.find((item) => item.id === subVariantId);

    if (!variant) return;

    const availableSlots = MAX_IMAGES_PER_VARIANT - variant.images.length;

    if (availableSlots <= 0) {
      errorMessage = 'Maksimal 2 gambar untuk setiap subvariasi.';
      input.value = '';
      return;
    }

    if (selectedFiles.length > availableSlots) {
      errorMessage = `Subvariasi hanya bisa memiliki maksimal ${MAX_IMAGES_PER_VARIANT} gambar.`;
    }

    const filesToProcess = selectedFiles.slice(0, availableSlots);
    const processedImages: SubVariantImage[] = [];

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        errorMessage = 'File yang dipilih harus berupa gambar.';
        continue;
      }

      if (file.size > MAX_ORIGINAL_SIZE) {
        errorMessage = `${file.name} melebihi batas ukuran awal 10 MB.`;
        continue;
      }

      try {
        let compressedFile: File;

        if (file.size > MAX_COMPRESSED_SIZE) {
          compressedFile = await imageCompression(file, {
            maxSizeMB: 0.48,
            maxWidthOrHeight: 1600,
            useWebWorker: true
          });

          if (compressedFile.size > MAX_COMPRESSED_SIZE) {
            compressedFile = await imageCompression(file, {
              maxSizeMB: 0.48,
              maxWidthOrHeight: 1200,
              useWebWorker: true
            });
          }
        } else {
          compressedFile = file;
        }

        if (compressedFile.size > MAX_COMPRESSED_SIZE) {
          errorMessage = `${file.name} masih melebihi 500 KB setelah dikompres. Coba gambar lain.`;
          continue;
        }

        const safeFile = new File(
          [compressedFile],
          file.name.replace(/\.[^.]+$/, '.jpg'),
          { type: compressedFile.type || 'image/jpeg' }
        );

        processedImages.push({
          id: crypto.randomUUID(),
          file: safeFile,
          preview: URL.createObjectURL(safeFile)
        });
      } catch (error) {
        console.error('Image compression error:', error);
        errorMessage = `Gagal memproses ${file.name}. Silakan coba lagi.`;
      }
    }

    variantGroups = variantGroups.map((item) => {
      if (item.id !== groupId) return item;

      return {
        ...item,
        subVariants: item.subVariants.map((subVariant) => {
          if (subVariant.id !== subVariantId) return subVariant;

          return {
            ...subVariant,
            images: [...subVariant.images, ...processedImages].slice(
              0,
              MAX_IMAGES_PER_VARIANT
            )
          };
        })
      };
    });

    input.value = '';
  }

  function removeImage(groupId: number, subVariantId: number, imageId: string) {
    const group = variantGroups.find((item) => item.id === groupId);
    const variant = group?.subVariants.find((item) => item.id === subVariantId);
    const image = variant?.images.find((item) => item.id === imageId);

    if (image) URL.revokeObjectURL(image.preview);

    variantGroups = variantGroups.map((item) => {
      if (item.id !== groupId) return item;

      return {
        ...item,
        subVariants: item.subVariants.map((subVariant) => {
          if (subVariant.id !== subVariantId) return subVariant;

          return {
            ...subVariant,
            images: subVariant.images.filter((item) => item.id !== imageId)
          };
        })
      };
    });
  }

  function validateForm(): boolean {
    if (!productName.trim()) {
      errorMessage = 'Nama produk wajib diisi.';
      return false;
    }

    if (!categoryId) {
      errorMessage = 'Silakan pilih kategori produk.';
      return false;
    }

    if (variantGroups.length === 0) {
      errorMessage = 'Tambahkan minimal satu variasi.';
      return false;
    }

    for (const group of variantGroups) {
      if (!group.name.trim()) {
        errorMessage = 'Nama variasi wajib diisi.';
        return false;
      }

      if (group.subVariants.length === 0) {
        errorMessage = `Tambahkan minimal satu subvariasi untuk ${group.name}.`;
        return false;
      }

      for (const subVariant of group.subVariants) {
        if (!subVariant.name.trim()) {
          errorMessage = `Nama subvariasi pada ${group.name} wajib diisi.`;
          return false;
        }

        // Harga bisa berupa string atau number karena bind:value pada input number.
        // Jangan gunakan subVariant.price.trim().
        const price =
          subVariant.price === '' ? NaN : Number(subVariant.price);

        if (!Number.isFinite(price) || price < 0) {
          errorMessage = `Harga subvariasi "${subVariant.name}" harus berupa angka nol atau lebih.`;
          return false;
        }

        if (subVariant.images.length > MAX_IMAGES_PER_VARIANT) {
          errorMessage = `Maksimal 2 gambar untuk ${subVariant.name}.`;
          return false;
        }
      }
    }

    return true;
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    errorMessage = '';
    successMessage = '';

    if (!validateForm()) return;

    isSubmitting = true;

    try {
      const formData = new FormData();

      const payload = {
        name: productName.trim(),
        category_id: categoryId,
        status: productStatus,
        variantGroups: variantGroups.map((group, groupIndex) => ({
          name: group.name.trim(),
          sort_order: groupIndex,
          subVariants: group.subVariants.map((subVariant, variantIndex) => ({
            id: subVariant.id,
            name: subVariant.name.trim(),
            price: Number(subVariant.price),
            is_active: subVariant.is_active,
            sort_order: variantIndex,
            images: subVariant.images.map((image, imageIndex) => ({
              id: image.id,
              field_name: `image_${subVariant.id}_${imageIndex}`
            }))
          }))
        }))
      };

      formData.append('payload', JSON.stringify(payload));

      for (const group of variantGroups) {
        for (const subVariant of group.subVariants) {
          subVariant.images.forEach((image, imageIndex) => {
            formData.append(
              `image_${subVariant.id}_${imageIndex}`,
              image.file,
              image.file.name
            );
          });
        }
      }

      const response = await fetch('?/create', {
        method: 'POST',
        body: formData
      });

      const result = deserialize(await response.text());

      if (result.type === 'success') {
        successMessage = 'Produk berhasil dibuat.';

        // Beri kesempatan pesan sukses ditampilkan sebelum navigasi.
        await goto('/admin/products');
        return;
      }

      if (result.type === 'failure') {
        const failureData = result.data as { message?: string } | undefined;
        errorMessage =
          failureData?.message ?? 'Gagal menyimpan produk. Periksa kembali data.';
        return;
      }

      errorMessage = 'Respons server tidak sesuai. Silakan coba lagi.';
    } catch (error) {
      console.error('Create product error:', error);
      errorMessage = 'Terjadi kesalahan saat menyimpan produk.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Tambah Produk | Admin</title>
  <meta
    name="description"
    content="Buat produk baru beserta variasi, harga, dan gambar."
  />
</svelte:head>

<div class="min-h-screen bg-[#F7F5F2] px-4 py-8 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-5xl">
    <div class="mb-8">
      <button
        type="button"
        onclick={() => goto('/admin/products')}
        class="mb-5 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
      >
        <span aria-hidden="true">←</span>
        Kembali ke produk
      </button>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#C58B62]">
            Product Management
          </p>
          <h1 class="text-3xl font-semibold tracking-tight text-[#242424]">
            Tambah produk
          </h1>
          <p class="mt-2 text-sm text-neutral-500">
            Lengkapi informasi produk, variasi, harga, dan gambar.
          </p>
        </div>

        <span
          class="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600"
        >
          Produk baru
        </span>
      </div>
    </div>

    {#if errorMessage}
      <div
        role="alert"
        class="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        <span class="font-semibold">!</span>
        <p>{errorMessage}</p>
      </div>
    {/if}

    {#if successMessage}
      <div
        role="status"
        class="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
      >
        {successMessage}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-6">
      <!-- Basic information -->
      <section class="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-[#242424]">
            Informasi dasar
          </h2>
          <p class="mt-1 text-sm text-neutral-500">
            Informasi utama yang akan digunakan untuk produk.
          </p>
        </div>

        <div class="space-y-5">
          <div>
            <label for="productName" class="mb-2 block text-sm font-medium text-neutral-700">
              Nama produk <span class="text-red-500">*</span>
            </label>
            <input
              id="productName"
              type="text"
              bind:value={productName}
              placeholder="Contoh: fēnix 8 – 51 mm"
              required
              class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
            />
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label for="category" class="mb-2 block text-sm font-medium text-neutral-700">
                Kategori <span class="text-red-500">*</span>
              </label>
              <select
                id="category"
                bind:value={categoryId}
                required
                class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
              >
                <option value="">Pilih kategori</option>
                {#each data.categories as category (category.id)}
                  <option value={category.id}>{category.name}</option>
                {/each}
              </select>

              {#if data.categories.length === 0}
                <p class="mt-2 text-xs text-amber-700">
                  Belum ada kategori. Tambahkan kategori terlebih dahulu.
                </p>
              {/if}
            </div>

            <div>
              <label for="status" class="mb-2 block text-sm font-medium text-neutral-700">
                Status produk
              </label>
              <select
                id="status"
                bind:value={productStatus}
                class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <p class="mt-2 text-xs text-neutral-400">
                Draft belum ditampilkan sebagai produk publik.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Variations -->
      <section class="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-[#242424]">
              Variasi produk
            </h2>
            <p class="mt-1 text-sm text-neutral-500">
              Tambahkan kelompok variasi dan subvariasi beserta harga masing-masing.
            </p>
          </div>

          <button
            type="button"
            onclick={addVariantGroup}
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-[#C58B62] hover:bg-[#C58B62]/5"
          >
            <span aria-hidden="true">+</span>
            Tambah variasi
          </button>
        </div>

        {#if variantGroups.length === 0}
          <div class="rounded-xl border border-dashed border-neutral-300 px-5 py-10 text-center">
            <p class="text-sm font-medium text-neutral-700">Belum ada variasi</p>
            <p class="mt-1 text-sm text-neutral-500">
              Tambahkan variasi seperti AMOLED atau Solar.
            </p>
          </div>
        {:else}
          <div class="space-y-5">
            {#each variantGroups as group, groupIndex (group.id)}
              <div class="overflow-hidden rounded-xl border border-neutral-200">
                <div class="flex items-start gap-3 border-b border-neutral-200 bg-neutral-50 p-4 sm:p-5">
                  <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#C58B62]/10 text-sm font-semibold text-[#9B623B]">
                    {groupIndex + 1}
                  </div>

                  <div class="min-w-0 flex-1">
                    <label for={`group-${group.id}`} class="mb-2 block text-sm font-medium text-neutral-700">
                      Nama variasi
                    </label>
                    <input
                      id={`group-${group.id}`}
                      type="text"
                      bind:value={group.name}
                      placeholder="Contoh: AMOLED"
                      required
                      class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
                    />
                  </div>

                  <button
                    type="button"
                    onclick={() => removeVariantGroup(group.id)}
                    aria-label={`Hapus variasi ${group.name || groupIndex + 1}`}
                    class="mt-7 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>

                <div class="space-y-4 p-4 sm:p-5">
                  {#each group.subVariants as subVariant, subIndex (subVariant.id)}
                    <div class="rounded-xl border border-neutral-200 p-4">
                      <div class="mb-4 flex items-center justify-between gap-3">
                        <h3 class="text-sm font-semibold text-neutral-800">
                          Subvariasi {subIndex + 1}
                        </h3>

                        <button
                          type="button"
                          onclick={() => removeSubVariant(group.id, subVariant.id)}
                          class="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Hapus subvariasi
                        </button>
                      </div>

                      <div class="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            for={`sub-name-${subVariant.id}`}
                            class="mb-2 block text-sm font-medium text-neutral-700"
                          >
                            Nama subvariasi <span class="text-red-500">*</span>
                          </label>
                          <input
                            id={`sub-name-${subVariant.id}`}
                            type="text"
                            bind:value={subVariant.name}
                            placeholder="Contoh: Orange"
                            required
                            class="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
                          />
                        </div>

                        <div>
                          <label
                            for={`sub-price-${subVariant.id}`}
                            class="mb-2 block text-sm font-medium text-neutral-700"
                          >
                            Harga (Rp) <span class="text-red-500">*</span>
                          </label>
                          <input
                            id={`sub-price-${subVariant.id}`}
                            type="number"
                            min="0"
                            step="1"
                            bind:value={subVariant.price}
                            placeholder="Contoh: 12999000"
                            required
                            class="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none focus:border-[#C58B62] focus:ring-2 focus:ring-[#C58B62]/15"
                          />
                          {#if subVariant.price !== '' && Number.isFinite(Number(subVariant.price)) && Number(subVariant.price) >= 0}
                            <p class="mt-2 text-xs text-neutral-500">
                              {formatRupiah(subVariant.price)}
                            </p>
                          {/if}
                        </div>
                      </div>

                      <div class="mt-4">
                        <label class="mb-2 block text-sm font-medium text-neutral-700">
                          Gambar produk
                        </label>
                        <p class="mb-3 text-xs text-neutral-500">
                          Maksimal 2 gambar per subvariasi. Ukuran awal maksimal 10 MB per gambar; gambar di atas 500 KB akan dikompres.
                        </p>

                        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {#each subVariant.images as image (image.id)}
                            <div class="group relative overflow-hidden rounded-xl border border-neutral-200">
                              <img
                                src={image.preview}
                                alt={`Gambar ${subVariant.name || 'subvariasi'}`}
                                class="aspect-square w-full object-cover"
                              />
                              <button
                                type="button"
                                onclick={() => removeImage(group.id, subVariant.id, image.id)}
                                aria-label="Hapus gambar"
                                class="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-red-600 shadow-sm hover:bg-red-50"
                              >
                                Hapus
                              </button>
                              <div class="truncate border-t border-neutral-100 px-2 py-1.5 text-xs text-neutral-500">
                                {image.file.name}
                              </div>
                            </div>
                          {/each}

                          {#if subVariant.images.length < MAX_IMAGES_PER_VARIANT}
                            <label
                              class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-3 text-center transition hover:border-[#C58B62] hover:bg-[#C58B62]/5"
                            >
                              <span class="mb-2 text-2xl text-neutral-400" aria-hidden="true">+</span>
                              <span class="text-xs font-medium text-neutral-700">
                                Tambah gambar
                              </span>
                              <span class="mt-1 text-[11px] text-neutral-400">
                                {subVariant.images.length}/{MAX_IMAGES_PER_VARIANT}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                class="sr-only"
                                onchange={(event) =>
                                  handleImageChange(event, group.id, subVariant.id)}
                              />
                            </label>
                          {/if}
                        </div>
                      </div>

                      <label class="mt-4 inline-flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          bind:checked={subVariant.is_active}
                          class="size-4 rounded border-neutral-300 accent-[#C58B62]"
                        />
                        <span class="text-sm text-neutral-700">
                          Subvariasi aktif
                        </span>
                      </label>
                    </div>
                  {/each}

                  <button
                    type="button"
                    onclick={() => addSubVariant(group.id)}
                    class="w-full rounded-lg border border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-600 transition hover:border-[#C58B62] hover:bg-[#C58B62]/5 hover:text-[#9B623B]"
                  >
                    + Tambah subvariasi
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>

      <!-- Actions -->
      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onclick={() => goto('/admin/products')}
          disabled={isSubmitting}
          class="rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>

        <button
          type="submit"
          disabled={isSubmitting || data.categories.length === 0}
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-[#242424] px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {#if isSubmitting}
            <span class="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
            Menyimpan...
          {:else}
            Simpan produk
          {/if}
        </button>
      </div>
    </form>
  </div>
</div>
