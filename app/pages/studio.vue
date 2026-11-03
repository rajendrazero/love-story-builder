<template>
  <main id="main-content" ref="studioPage" tabindex="-1" class="brand-ui min-h-screen bg-paper px-5 py-8 md:px-12">
    <div class="mx-auto max-w-5xl">
      <div class="mb-10 max-w-2xl">
        <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Studio cerita · ruang akunmu</p>
        <h1 class="mt-3 font-display text-5xl md:text-6xl">{{ editingStorySlug ? 'Perbarui cerita kalian.' : 'Rangkai cerita kalian.' }}</h1>
        <p class="mt-4 leading-7 text-[#756a62]">Draft tersimpan di akunmu. Kamu bisa melanjutkan dari perangkat lain, memperbarui cerita terbit, dan hanya kamu serta admin yang bisa mengelolanya.</p>
      </div>

      <div class="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          class="step-tab"
          :class="{ 'step-tab-active': activeStep === index, 'step-tab-complete': index < activeStep }"
          @click="goToStep(index)"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <span>{{ step.title }}</span>
        </button>
      </div>

      <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e7ddd4] bg-white/70 px-4 py-3 text-sm">
        <p class="text-[#756a62]">Draft akun privat · progres tersimpan otomatis</p>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center gap-2 text-xs text-[#756a62]" role="status">
            <span v-if="saveStatus === 'saving' || saveStatus === 'idle'" class="loading-spinner" aria-hidden="true" />
            {{ saveStatus === 'saving' ? 'Menyimpan…' : saveStatus === 'saved' ? `Tersimpan ${lastSavedLabel}` : saveStatus === 'error' ? 'Belum tersimpan ke server' : 'Menyiapkan penyimpanan…' }}
          </span>
          <AppButton variant="ghost" size="sm" :disabled="savingDraft" :loading="savingDraft" @click="saveDraft">
            Simpan sekarang
          </AppButton>
        </div>
      </div>
      <AppErrorAlert
        v-if="error && !previewOpen"
        class="mb-6"
        :title="errorTitle"
        :message="error"
        :location="errorLocation"
      />

      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="section-kicker mb-1">Langkah {{ activeStep + 1 }} dari {{ steps.length }}</p>
          <h2 class="font-display text-3xl">{{ steps[activeStep]?.title }}</h2>
        </div>
        <span class="text-xs text-[#756a62]">{{ Math.round(((activeStep + 1) / steps.length) * 100) }}% selesai</span>
      </div>
      <div class="mb-6 h-1.5 overflow-hidden rounded-full bg-[#e7ddd4]">
        <div class="h-full rounded-full bg-[#9c6257] transition-all duration-300" :style="{ width: `${((activeStep + 1) / steps.length) * 100}%` }" />
      </div>

      <div class="space-y-5">
        <div v-if="activeSectionType" class="flex justify-end">
          <AppButton variant="secondary" @click="openActiveSectionPreview">
            <AppIcon name="eye" :size="16" />
            Pratinjau hasil section
          </AppButton>
        </div>

        <section v-if="activeStepId === 'theme'" class="editor-card">
          <StoryThemePicker
            :model-value="draft.templateId ?? 'editorial-rose'"
            @update:model-value="changeTemplate"
          />
          <div class="mt-7 border-t border-[#e7ddd4] pt-6">
            <StoryAppearanceEditor v-model="appearanceModel" />
          </div>
        </section>

        <section v-else-if="activeStepId === 'cover'" class="editor-card">
          <EntranceCoverPicker
            v-model="entranceStyleModel"
            :template-id="draft.templateId ?? 'editorial-rose'"
            :story="draft"
          />
          <StorySectionAppearanceEditor
            :model-value="sectionDesign('hero')"
            section-type="hero"
            section-label="Sampul"
            :template-id="draft.templateId ?? 'editorial-rose'"
            :appearance="appearanceModel"
            @update:model-value="updateSectionDesign('hero', $event)"
          />
          <div class="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e3dbd2] p-4">
            <div>
              <p class="text-xs uppercase tracking-[0.2em] text-[#9c6257]">Identitas cerita</p>
              <strong class="mt-1 block font-display text-2xl">{{ selectedTemplate.name }}</strong>
              <p class="mt-1 text-sm text-[#756a62]">Warna {{ selectedTemplate.colors[1] }} · {{ selectedTemplate.fontPair }}</p>
            </div>
          </div>
          <div class="grid gap-5 md:grid-cols-2">
            <label class="floating-field"><span class="editor-label">Judul cerita</span><input v-model="draft.title" name="storyTitle" class="editor-input" maxlength="100" required placeholder="Sebuah kisah tentang kita"></label>
            <label class="floating-field"><span class="editor-label">Nama kalian</span><input v-model="draft.coupleNames" name="coupleNames" class="editor-input" maxlength="100" required placeholder="Alya & Bima"></label>
            <label class="floating-field"><span class="editor-label">Tanggal spesial</span><input v-model="draft.date" name="storyDate" class="editor-input" maxlength="80" required placeholder="Sejak 14 Februari 2022"></label>
            <ImageField v-model="draft.heroImage" label="Foto sampul" />
          </div>
          <div class="mt-6 grid gap-4 rounded-2xl bg-[#f7f4ed] p-5 md:grid-cols-2">
            <template v-if="draft.templateId === 'editorial-rose'">
              <label class="floating-field"><span class="editor-label">Dedikasi pada sampul majalah</span><input v-model="draft.templateDetails!.editorialRose!.dedication" name="editorialDedication" class="editor-input" maxlength="180" placeholder="Edisi khusus untuk dua hati"></label>
              <label class="floating-field"><span class="editor-label">Tanda tangan penutup</span><input v-model="draft.templateDetails!.editorialRose!.signature" name="editorialSignature" class="editor-input" maxlength="80" placeholder="Dengan cinta, selalu"></label>
            </template>
            <template v-else-if="draft.templateId === 'love-letter'">
              <label class="floating-field"><span class="editor-label">Salam pembuka surat</span><input v-model="draft.templateDetails!.editorialRose!.dedication" name="letterDedication" class="editor-input" maxlength="180" placeholder="Untuk orang yang selalu kupilih"></label>
              <label class="floating-field"><span class="editor-label">Tanda tangan surat</span><input v-model="draft.templateDetails!.editorialRose!.signature" name="letterSignature" class="editor-input" maxlength="80" placeholder="Dengan cinta, selalu"></label>
            </template>
            <template v-else-if="draft.templateId === 'midnight-cinema'">
              <label class="floating-field"><span class="editor-label">Kutipan pembuka film</span><textarea v-model="draft.templateDetails!.midnightCinema!.openingQuote" name="filmOpeningQuote" class="editor-input min-h-24" maxlength="220" placeholder="Setiap kisah punya satu adegan yang ingin diulang."></textarea></label>
              <label class="floating-field"><span class="editor-label">Kredit penutup film</span><input v-model="draft.templateDetails!.midnightCinema!.credits" name="filmCredits" class="editor-input" maxlength="120" placeholder="Dibintangi kalian · 2021—selamanya"></label>
            </template>
            <template v-else-if="draft.templateId === 'botanical-journal'">
              <label class="floating-field"><span class="editor-label">Label jurnal</span><input v-model="draft.templateDetails!.botanicalJournal!.journalLabel" name="journalLabel" class="editor-input" maxlength="80" placeholder="Catatan perjalanan no. 01"></label>
              <label class="floating-field"><span class="editor-label">Catatan lapangan</span><textarea v-model="draft.templateDetails!.botanicalJournal!.fieldNote" name="fieldNote" class="editor-input min-h-24" maxlength="220" placeholder="Bahagia tumbuh dari hal-hal kecil yang dirawat bersama."></textarea></label>
            </template>
          </div>
        </section>

        <section v-else-if="activeStepId === 'sections'" class="editor-card">
          <p class="section-kicker">03 — Pilih dan susun cerita</p>
          <StorySectionEditor
            v-model="sectionLayoutModel"
            :template-id="draft.templateId ?? 'editorial-rose'"
            :story="draft"
          />
        </section>

        <section v-else-if="activeSectionType === 'greeting'" class="editor-card">
          <p class="section-kicker">Section aktif · Kartu ucapan</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.greetingImage" label="Latar kartu" />
            <label class="floating-field"><span class="editor-label">Tulisan untuknya</span><textarea v-model="draft.greetingText" name="greetingText" class="editor-input min-h-36" maxlength="1000" required placeholder="Untuk kamu, rumah yang selalu ingin kutuju..." /></label>
            <label v-if="!hasSection('moments-in-motion')" class="floating-field md:col-span-2"><span class="editor-label">Tautan video latar (opsional)</span><input v-model="draft.greetingVideoUrl" name="greetingVideoUrl" class="editor-input" type="url" placeholder="https://... tautan video MP4 langsung"><span class="mt-2 block text-xs text-muted">Jika diisi, video menggantikan foto pada bagian latar kartu.</span></label>
          </div>
        </section>

        <section v-else-if="activeSectionType === 'gallery'" class="editor-card">
          <p class="section-kicker">Section aktif · Galeri kenangan</p>
          <div class="space-y-4">
            <div v-for="(photo, index) in draft.gallery" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <ImageField v-model="photo.url" :label="`Foto ${index + 1}`" />
              <label class="floating-field"><span class="editor-label">Cerita singkat</span><input v-model="photo.caption" :name="`galleryCaption-${index}`" class="editor-input" maxlength="120" placeholder="Hari pertama kita bertemu"></label>
              <button v-if="draft.gallery.length > 1" type="button" class="inline-flex min-h-11 items-center gap-2 pb-3 text-sm text-[#9c6257]" @click="draft.gallery.splice(index, 1)"><AppIcon name="trash" :size="16" />Hapus</button>
            </div>
            <button v-if="draft.gallery.length < 12" type="button" class="inline-flex min-h-11 items-center gap-2 text-sm text-[#9c6257]" @click="draft.gallery.push({ url: '', caption: '' })"><AppIcon name="plus" :size="16" />Tambah foto ke galeri</button>
          </div>
        </section>

        <section v-else-if="activeSectionType === 'first-encounter'" class="editor-card">
          <p class="section-kicker">Section aktif · Pertemuan pertama</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.secondImage" label="Foto berdua" />
            <div class="space-y-5">
              <label class="floating-field"><span class="editor-label">Judul momen</span><input v-model="draft.detailTitle" name="detailTitle" class="editor-input" maxlength="100" required placeholder="Semua berawal dari hari itu"></label>
              <label class="floating-field"><span class="editor-label">Ceritakan momen kalian</span><textarea v-model="draft.detailText" name="detailText" class="editor-input min-h-28" maxlength="1000" required placeholder="Ceritakan bagaimana perjalanan kalian dimulai..." /></label>
            </div>
          </div>
        </section>

        <section v-else-if="['timeline', 'book', 'constellation'].includes(activeSectionType ?? '')" class="editor-card">
          <p class="section-kicker">Section aktif · {{ steps[activeStep]?.title }}</p>
          <p class="mb-4 text-sm text-[#756a62]">Bab cerita menjadi sumber kenangan untuk garis waktu, buku, atau konstelasi yang aktif.</p>
          <div class="space-y-4">
            <article v-for="(page, index) in draft.storyPages" :key="index" class="grid gap-4 rounded-2xl border border-[#e3dbd2] p-4 md:grid-cols-2">
              <label class="floating-field"><span class="editor-label">Halaman {{ index + 1 }} · Judul</span><input v-model="page.title" :name="`storyPageTitle-${index}`" class="editor-input" maxlength="100" required placeholder="Pertemuan pertama"></label>
              <ImageField v-model="page.image" label="Foto halaman" />
              <label class="floating-field md:col-span-2"><span class="editor-label">Kisah di halaman ini</span><textarea v-model="page.text" :name="`storyPageText-${index}`" class="editor-input min-h-28" maxlength="1200" required placeholder="Tulis cerita kalian di sini..." /></label>
              <button v-if="draft.storyPages.length > 1" type="button" class="inline-flex min-h-11 items-center gap-2 text-left text-sm text-[#9c6257]" @click="draft.storyPages.splice(index, 1)"><AppIcon name="trash" :size="16" />Hapus halaman</button>
            </article>
            <button v-if="draft.storyPages.length < 8" type="button" class="inline-flex min-h-11 items-center gap-2 text-sm text-[#9c6257]" @click="draft.storyPages.push({ title: '', text: '', image: '' })"><AppIcon name="plus" :size="16" />Tambah halaman</button>
          </div>
        </section>

        <section v-else-if="activeSectionType === 'finale'" class="editor-card">
          <p class="section-kicker">Section aktif · Penutup</p>
          <div class="grid gap-5 md:grid-cols-2">
            <ImageField v-model="draft.finalImage" label="Foto penutup" />
            <label class="floating-field"><span class="editor-label">Pesan untuknya</span><textarea v-model="draft.finalMessage" name="finalMessage" class="editor-input min-h-36" maxlength="1000" required placeholder="Dan jika aku harus memilih lagi, tetap kamu..." /></label>
          </div>
        </section>

        <section v-else-if="activeSectionType === 'moments-in-motion'" class="editor-card">
          <p class="section-kicker">Section aktif · Momen bergerak</p>
          <p class="mb-4 text-sm text-[#756a62]">Video ini juga menjadi latar kartu ucapan bila section kartu ucapan aktif.</p>
          <div class="grid gap-5 md:grid-cols-2">
            <label class="floating-field"><span class="editor-label">Judul momen video</span><input v-model="draft.detailTitle" name="videoMomentTitle" class="editor-input" maxlength="100" required placeholder="Satu momen yang ingin diulang"></label>
            <label class="floating-field"><span class="editor-label">Tautan video kenangan</span><input v-model="draft.greetingVideoUrl" name="greetingVideoUrl" class="editor-input" type="url" required placeholder="https://... tautan video MP4 langsung"></label>
          </div>
        </section>

        <section v-else-if="activeSectionType === 'music'" class="editor-card">
          <p class="section-kicker">Section aktif · Soundtrack</p>
          <div class="grid gap-5 md:grid-cols-2">
            <AudioField v-model="draft.musicUrl" />
            <label class="floating-field"><span class="editor-label">Judul lagu (opsional)</span><input v-model="draft.musicTitle" name="musicTitle" class="editor-input" maxlength="120" placeholder="Lagu yang mengingatkan kalian"></label>
            <label class="floating-field"><span class="editor-label">Penyanyi (opsional)</span><input v-model="draft.musicArtist" name="musicArtist" class="editor-input" maxlength="120" placeholder="Nama penyanyi"></label>
            <p v-if="unsupportedMusicProvider" class="text-sm text-amber-800 md:col-span-2" role="alert">Tautan {{ unsupportedMusicProvider }} tidak bisa diputar di cerita. Gunakan URL HTTPS file audio langsung atau unggah file yang hak penggunaannya kamu miliki.</p>
          </div>
        </section>

        <section v-else-if="activeSectionType && contentEditorSectionTypes.has(activeSectionType)" class="editor-card">
          <p class="section-kicker">Section aktif · {{ steps[activeStep]?.title }}</p>
          <StorySectionContentEditor
            v-model="sectionContentModel"
            :section-type="activeSectionType"
          />
        </section>

        <section v-else-if="activeStepId === 'settings'" class="editor-card">
          <p class="section-kicker">Pengaturan akhir · Privasi & tampilan</p>
          <div v-if="!hasSection('music')" class="mb-6 grid gap-5 md:grid-cols-2">
            <AudioField v-model="draft.musicUrl" />
            <label class="floating-field"><span class="editor-label">Judul lagu (opsional)</span><input v-model="draft.musicTitle" name="musicTitle" class="editor-input" maxlength="120" placeholder="Lagu yang mengingatkan kalian"></label>
            <label class="floating-field"><span class="editor-label">Penyanyi (opsional)</span><input v-model="draft.musicArtist" name="musicArtist" class="editor-input" maxlength="120" placeholder="Nama penyanyi"></label>
            <p v-if="unsupportedMusicProvider" class="text-sm text-amber-800 md:col-span-2" role="alert">Tautan {{ unsupportedMusicProvider }} tidak bisa diputar di cerita. Gunakan URL HTTPS file audio langsung atau unggah file yang hak penggunaannya kamu miliki.</p>
          </div>
          <div class="grid gap-5 md:grid-cols-2">
            <label class="floating-field">
              <span class="editor-label">Kursor halaman</span>
              <select v-model="draft.cursorPreset" name="cursorPreset" class="editor-input">
                <option value="ring">Cincin minimal</option>
                <option value="heart">Hati</option>
                <option value="sparkle">Kilau</option>
                <option value="flower">Bunga</option>
                <option value="star">Bintang</option>
                <option value="system">Default perangkat</option>
              </select>
              <span class="mt-2 block text-xs text-muted">Default mengikuti kursor perangkat. Pilihan lain memakai ikon bawaan yang aman.</span>
            </label>
            <label class="floating-field md:col-span-2">
              <span class="editor-label">Atur link berbagi singkat (opsional)</span>
              <span class="share-slug-field">
                <span>{{ shareOrigin }}/w/</span>
                <input
                  id="custom-story-link"
                  v-model="customSlug"
                  name="customSlug"
                  class="editor-input"
                  type="text"
                  minlength="3"
                  maxlength="32"
                  pattern="[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*"
                  autocomplete="off"
                  autocapitalize="none"
                  spellcheck="false"
                  placeholder="contoh: kisah-kita"
                  :aria-invalid="Boolean(customSlugError)"
                  :aria-describedby="customSlugError ? 'custom-story-link-hint custom-story-link-error' : 'custom-story-link-hint'"
                >
              </span>
              <span id="custom-story-link-hint" class="mt-2 block text-xs leading-5 text-muted">
                3–32 huruf, angka, dan tanda hubung. Link yang dipakai berubah setelah cerita diterbitkan atau diperbarui.
              </span>
              <span v-if="customSlugError" id="custom-story-link-error" class="mt-2 block text-sm text-red-700" role="alert">
                {{ customSlugError }}
              </span>
            </label>
            <div class="floating-field">
              <label for="story-password" class="editor-label">{{ editingStorySlug ? 'Ubah sandi cerita (opsional)' : 'Sandi cerita (opsional)' }}</label>
              <span class="story-password-field">
                <input
                  id="story-password"
                  v-model="draft.password"
                  name="storyPassword"
                  class="editor-input"
                  :type="storyPasswordVisible ? 'text' : 'password'"
                  maxlength="128"
                  :placeholder="editingStorySlug ? 'Kosongkan untuk mempertahankan sandi saat ini' : 'Hanya orang dengan sandi yang bisa membuka'"
                >
                <button
                  type="button"
                  class="story-password-toggle"
                  :aria-label="storyPasswordVisible ? 'Sembunyikan sandi cerita' : 'Tampilkan sandi cerita'"
                  :aria-pressed="storyPasswordVisible"
                  @click="storyPasswordVisible = !storyPasswordVisible"
                ><AppIcon :name="storyPasswordVisible ? 'eye-off' : 'eye'" :size="19" /></button>
              </span>
              <span v-if="editingStorySlug" class="mt-2 block text-xs text-muted">Sandi yang ada tetap berlaku bila kolom dikosongkan.</span>
            </div>
          </div>
          <label v-if="editingStorySlug" class="mt-4 flex items-center gap-2 text-sm text-[#756a62]">
            <input v-model="removePassword" name="removeStoryPassword" type="checkbox">
            Hapus perlindungan sandi pada cerita ini
          </label>
          <p class="mt-3 text-xs leading-5 text-muted">Spotify, YouTube Music, dan SoundCloud tidak dapat diputar langsung. URL audio langsung harus mendukung pemutaran publik; file yang diunggah ke akun disimpan di Cloudinary. Musik baru mulai setelah cerita dibuka. Sandi disimpan sebagai hash, bukan sebagai teks biasa.</p>
        </section>

        <section v-if="activeSectionType" class="editor-card">
          <StorySectionAppearanceEditor
            :key="activeSectionType"
            :model-value="sectionDesign(activeSectionType)"
            :section-type="activeSectionType"
            :section-label="activeStepInfo?.title ?? 'Section cerita'"
            :template-id="draft.templateId ?? 'editorial-rose'"
            :appearance="appearanceModel"
            @update:model-value="updateSectionDesign(activeSectionType, $event)"
          />
        </section>

        <div class="flex flex-col gap-4 pb-14 sm:flex-row sm:items-center sm:justify-between">
          <AppButton variant="secondary" :disabled="activeStep === 0" @click="goToStep(activeStep - 1)"><AppIcon name="chevron-left" :size="16" />Sebelumnya</AppButton>
          <div class="flex flex-wrap gap-3">
            <AppButton v-if="activeStep < steps.length - 1" @click="goToStep(activeStep + 1)">
              Simpan & lanjut
              <AppIcon name="arrow-up-right" :size="16" />
            </AppButton>
            <AppButton v-else :disabled="savingDraft || saving" :loading="savingDraft || saving" @click="openPreview">
              {{ savingDraft || saving ? 'Menyiapkan…' : 'Lihat pratinjau' }}
              <AppIcon v-if="!savingDraft && !saving" name="eye" :size="16" />
            </AppButton>
          </div>
        </div>
      </div>

      <StorySectionPreviewDialog
        v-model:open="sectionPreviewOpen"
        :story="draft"
        :section="activeSectionConfig"
        :section-label="activeStepInfo?.title ?? 'Section cerita'"
      />

      <div v-if="previewOpen" class="fixed inset-0 z-40 overflow-y-auto bg-ink/75 p-4 md:p-8">
        <div class="fixed inset-x-4 top-4 z-50 flex items-center justify-between rounded-full bg-paper px-4 py-2 shadow-lg md:inset-x-10">
          <span class="text-xs font-semibold uppercase tracking-widest text-[#9c6257]">Pratinjau cerita utuh</span>
          <div class="flex items-center gap-3">
            <AppButton variant="ghost" size="sm" @click="previewOpen = false">
              <AppIcon name="close" :size="16" />
              Kembali ke editor
            </AppButton>
            <AppButton size="sm" :disabled="saving" :loading="saving" @click="publish">
              {{ saving ? 'Menerbitkan…' : 'Konfirmasi & terbitkan' }}
              <AppIcon v-if="!saving" name="arrow-up-right" :size="16" />
            </AppButton>
          </div>
        </div>
        <div class="mx-auto max-w-7xl pt-14">
          <p v-if="previewLinkWarning" class="mx-auto mb-4 max-w-2xl rounded-xl bg-paper px-4 py-3 text-sm text-ink shadow-lg" role="status">
            {{ previewLinkWarning }}
          </p>
          <StoryExperience v-if="previewStory" :story="previewStory" />
          <p v-if="draft.password" class="mx-auto mt-4 w-fit rounded-full bg-paper px-5 py-3 text-sm text-ink shadow-lg">Cerita ini akan meminta sandi saat dibuka.</p>
          <AppErrorAlert
            v-if="error && previewOpen"
            class="mx-auto mt-4 max-w-2xl"
            :title="errorTitle"
            :message="error"
            :location="errorLocation"
          />
        </div>
      </div>

      <div
        v-if="publishedUrl"
        class="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-3 sm:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="published-dialog-title"
        tabindex="-1"
        @keydown="onPublishedDialogKeydown"
      >
        <div ref="publishedDialog" class="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-3xl bg-paper p-5 shadow-2xl sm:max-h-[calc(100dvh-2.5rem)] sm:p-7">
          <button
            ref="publishedDialogClose"
            type="button"
            class="published-dialog-close absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-[#d6c9bf] text-2xl leading-none text-ink transition hover:-rotate-6 hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:right-4 sm:top-4"
            aria-label="Tutup konfirmasi publikasi"
            @click="closePublishedDialog"
          ><AppIcon name="close" :size="20" /></button>
          <div class="mb-5 pr-12 sm:mb-6">
            <p class="text-xs uppercase tracking-[0.25em] text-[#9c6257]">Cerita sudah terbit ✳</p>
            <h2 id="published-dialog-title" class="mt-2 font-display text-3xl sm:text-4xl">{{ publishedIsUpdate ? 'Perubahan sudah terbit.' : 'Saatnya dibagikan.' }}</h2>
          </div>
          <div class="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-7">
            <div class="mx-auto flex size-44 shrink-0 items-center justify-center rounded-2xl border border-[#e7ddd4] bg-white p-2 sm:size-48">
              <QrcodeVue :value="publishedUrl" :size="160" level="H" background="#ffffff" foreground="#171311" />
            </div>
            <div class="min-w-0 text-center sm:text-left">
              <p class="text-sm text-muted">Bagikan lewat tautan atau pindai QR.</p>
              <p class="mt-2 break-all rounded-2xl bg-white/80 px-4 py-3 text-sm text-ink">{{ publishedUrl }}</p>
              <div class="mt-4 flex flex-col gap-3 sm:flex-row">
                <AppButton class="min-h-11 w-full justify-center sm:w-auto" :disabled="copyingLink" :loading="copyingLink" @click="copyLink">
                  {{ copyingLink ? 'Menyalin…' : 'Salin tautan' }}
                </AppButton>
                <NuxtLink
                  :to="`/w/${publishedSlug}`"
                  class="published-dialog-link inline-flex min-h-11 w-full items-center justify-center rounded-full border border-ink px-5 py-3 text-sm transition hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
                ><span>Lihat cerita</span><AppIcon name="arrow-up-right" :size="16" /></NuxtLink>
              </div>
              <p v-if="copyMessage" class="mt-3 text-sm text-muted" role="status">{{ copyMessage }}</p>
            </div>
          </div>
          <div class="mt-5 flex justify-center sm:justify-end">
            <AppButton variant="ghost" size="sm" @click="closePublishedDialog">Tutup</AppButton>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import AppButton from '../components/AppButton.vue'
import { storyContentSchema, type StoryContent } from '#shared/schema/story'
import {
  createDefaultSectionLayout,
  createTemplateCustomization,
  getTemplateDefinition,
  storyTemplateSchema,
  storyTemplates,
  type StoryTemplateId,
} from '#shared/story-templates'
import {
  createDefaultStorySectionDesign,
  createEmptyStorySectionContent,
  sortStorySections,
  type StorySectionConfig,
  type StorySectionDesign,
  type StorySectionType,
} from '#shared/story-sections'
import {
  createDefaultStoryAppearance,
  type StoryAppearance,
} from '#shared/story-appearance'
import { createStoryEditorSteps } from '#shared/story-editor-steps'
import { getUnsupportedMusicProvider } from '#shared/music-embed'
import { isValidStorySlug } from '#shared/story-slug'
import { getUserFacingError } from '#shared/utils/user-facing-error'
import type { ZodIssue } from 'zod'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import StorySectionContentEditor from '~/components/story-section-editor/StorySectionContentEditor.vue'
import StorySectionEditor from '~/components/story-section-editor/StorySectionEditor.vue'
import StoryThemePicker from '~/components/story-editor/StoryThemePicker.vue'
import StorySectionPreviewDialog from '~/components/story-editor/StorySectionPreviewDialog.vue'
import EntranceCoverPicker from '~/components/story-editor/EntranceCoverPicker.vue'
import StoryAppearanceEditor from '~/components/story-editor/StoryAppearanceEditor.vue'
import StorySectionAppearanceEditor from '~/components/story-editor/StorySectionAppearanceEditor.vue'

const QrcodeVue = defineAsyncComponent(() => import('qrcode.vue'))
definePageMeta({ middleware: 'auth' })
const route = useRoute()
const studioPage = ref<HTMLElement | null>(null)
const publishedDialog = ref<HTMLElement | null>(null)
const publishedDialogClose = ref<HTMLButtonElement | null>(null)
let studioMotion: gsap.MatchMedia | undefined
const draft = reactive<StoryContent & { password: string }>({
  templateId: 'editorial-rose',
  entranceStyle: 'editorial',
  cursorPreset: 'system',
  appearance: createDefaultStoryAppearance('editorial-rose'),
  templateDetails: createTemplateCustomization('editorial-rose'),
  sectionLayout: createDefaultSectionLayout('editorial-rose'),
  sectionContent: createEmptyStorySectionContent(),
  title: '',
  coupleNames: '',
  date: '',
  heroImage: '',
  greetingImage: '',
  greetingVideoUrl: '',
  greetingText: '',
  gallery: [{ url: '', caption: '' }, { url: '', caption: '' }],
  secondImage: '',
  detailTitle: '',
  detailText: '',
  storyPages: [{ title: '', text: '', image: '' }],
  finalImage: '',
  finalMessage: '',
  musicUrl: '',
  musicTitle: '',
  musicArtist: '',
  password: '',
})
const sectionLayoutModel = computed({
  get: () => draft.sectionLayout ?? createDefaultSectionLayout(draft.templateId ?? 'editorial-rose'),
  set: (value: NonNullable<StoryContent['sectionLayout']>) => {
    draft.sectionLayout = value
  },
})
const appearanceModel = computed({
  get: () => draft.appearance ?? createDefaultStoryAppearance(draft.templateId ?? 'editorial-rose'),
  set: (value: StoryAppearance) => {
    draft.appearance = value
  },
})
const sectionContentModel = computed({
  get: () => draft.sectionContent ?? createEmptyStorySectionContent(),
  set: (value: NonNullable<StoryContent['sectionContent']>) => {
    draft.sectionContent = value
  },
})
const steps = computed(() => createStoryEditorSteps(draft.sectionLayout ?? []))
const selectedTemplate = computed(() => getTemplateDefinition(draft.templateId) ?? storyTemplates[0])
const entranceStyleModel = computed({
  get: () => draft.entranceStyle ?? selectedTemplate.value.entrance.style,
  set: (value: NonNullable<StoryContent['entranceStyle']>) => {
    draft.entranceStyle = value
  },
})
const contentEditorSectionTypes = new Set<StorySectionType>([
  'love-notes',
  'distance-map',
  'future-dreams',
  'countdown',
  'memory-capsule',
])
function hasSection(type: StorySectionType): boolean {
  return (draft.sectionLayout ?? []).some(section => section.enabled && section.type === type)
}
function sectionDesign(type: StorySectionType): StorySectionDesign {
  return draft.sectionLayout?.find(section => section.type === type)?.design
    ?? createDefaultStorySectionDesign(type)
}
function updateSectionDesign(type: StorySectionType, design: StorySectionDesign): void {
  const sections = draft.sectionLayout ?? createDefaultSectionLayout(draft.templateId ?? 'editorial-rose')
  draft.sectionLayout = sections.map(section =>
    section.type === type ? { ...section, design } : section,
  )
}
function firstValidationField(caught: unknown): string | undefined {
  if (typeof caught !== 'object' || caught === null) return undefined
  const response = 'data' in caught && typeof caught.data === 'object' && caught.data !== null
    ? caught.data
    : undefined
  const payload = response && 'data' in response
    && typeof response.data === 'object'
    && response.data !== null
    ? response.data
    : response
  if (!payload || !('fieldErrors' in payload) || typeof payload.fieldErrors !== 'object' || payload.fieldErrors === null) {
    return undefined
  }
  return Object.keys(payload.fieldErrors)[0]
}
const unsupportedMusicProvider = computed(() => getUnsupportedMusicProvider(draft.musicUrl))
const saving = ref(false)
const savingDraft = ref(false)
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const activeStep = ref(0)
const activeStepInfo = computed(() => steps.value[activeStep.value])
const activeStepId = computed(() => activeStepInfo.value?.id ?? '')
const activeSectionType = computed(() => activeStepInfo.value?.sectionType)
const activeSectionConfig = computed<StorySectionConfig | null>(() => {
  const sectionType = activeSectionType.value
  return sectionType
    ? draft.sectionLayout?.find(section => section.type === sectionType) ?? null
    : null
})
const sectionPreviewOpen = ref(false)
watch(() => steps.value.length, (length) => {
  activeStep.value = Math.min(activeStep.value, Math.max(0, length - 1))
}, { flush: 'sync' })
const error = ref('')
const errorTitle = ref('Ada bagian yang perlu diperiksa')
const errorLocation = ref('Studio cerita')
const { success, error: notifyError } = useNotifications()
const publishedUrl = ref('')
const publishedSlug = ref('')
const publishedIsUpdate = ref(false)
const previewOpen = ref(false)
const copyMessage = ref('')
const copyingLink = ref(false)
const draftId = ref('')
const editingStorySlug = ref('')
const customSlug = ref('')
const storyPasswordVisible = ref(false)
const customSlugError = computed(() => {
  const slug = customSlug.value.trim().toLowerCase()
  return slug && !isValidStorySlug(slug)
    ? 'Link harus terdiri dari 3–32 huruf atau angka. Gunakan satu tanda hubung untuk memisahkan kata; jangan gunakan spasi atau simbol.'
    : ''
})
const removePassword = ref(false)
const lastSavedAt = ref('')
const lastSavedLabel = computed(() => lastSavedAt.value
  ? new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSavedAt.value))
  : '')

watch(publishedUrl, async (url) => {
  if (!url) return
  await nextTick()
  publishedDialogClose.value?.focus()
})

function closePublishedDialog() {
  publishedUrl.value = ''
  void nextTick(() => studioPage.value?.focus())
}

function openActiveSectionPreview(): void {
  if (activeSectionConfig.value) sectionPreviewOpen.value = true
}

function onPublishedDialogKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePublishedDialog()
    return
  }
  if (event.key !== 'Tab') return

  const dialog = publishedDialog.value
  if (!dialog) return
  const focusableElements = dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  const first = focusableElements.item(0)
  const last = focusableElements.item(focusableElements.length - 1)
  if (!first || !last) {
    event.preventDefault()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
const invalidOptionalPreviewLinks = computed(() => [
  { field: 'greetingVideoUrl' as const, label: 'tautan video latar' },
  { field: 'musicUrl' as const, label: 'tautan lagu' },
].filter(({ field }) => {
  const value = draft[field]
  return value.trim() !== '' && !storyContentSchema.shape[field].safeParse(value).success
}))
function storyContentForPreview() {
  const content = { ...draft }
  for (const { field } of invalidOptionalPreviewLinks.value) {
    content[field] = ''
  }
  return content
}
const previewStory = computed(() => {
  const parsed = storyContentSchema.safeParse(storyContentForPreview())
  return parsed.success ? parsed.data : null
})
const previewLinkWarning = computed(() => invalidOptionalPreviewLinks.value.length
  ? `Pratinjau mengabaikan ${invalidOptionalPreviewLinks.value.map(link => link.label).join(' dan ')} yang tidak valid. Perbaiki atau kosongkan tautan sebelum menerbitkan.`
  : '')
const shareOrigin = useState('studio-share-origin', () => useRequestURL().origin)
const previewFieldLabels: Record<string, string> = {
  title: 'Judul cerita',
  coupleNames: 'Nama kalian',
  date: 'Tanggal spesial',
  heroImage: 'Foto sampul',
  entranceStyle: 'Gaya layar pembuka',
  templateDetails: 'Detail template',
  sectionLayout: 'Susunan section cerita',
  sectionContent: 'Konten tambahan',
  greetingImage: 'Latar kartu',
  greetingVideoUrl: 'Tautan video latar',
  greetingText: 'Tulisan kartu ucapan',
  gallery: 'Foto galeri',
  secondImage: 'Foto momen',
  detailTitle: 'Judul momen',
  detailText: 'Cerita momen',
  storyPages: 'Bab cerita',
  finalImage: 'Foto penutup',
  finalMessage: 'Pesan terakhir',
  musicUrl: 'Tautan lagu',
  musicTitle: 'Judul lagu',
  musicArtist: 'Penyanyi',
  cursorPreset: 'Kursor halaman',
}

function stepIndexForField(field: string, nestedField?: string): number {
  const sectionContentTypes: Record<string, StorySectionType> = {
    loveNotes: 'love-notes',
    'love-notes': 'love-notes',
    distanceMap: 'distance-map',
    'distance-map': 'distance-map',
    futureDreams: 'future-dreams',
    'future-dreams': 'future-dreams',
    countdown: 'countdown',
    memoryCapsule: 'memory-capsule',
    'memory-capsule': 'memory-capsule',
  }
  let stepId = 'settings'

  if (field === 'templateId') {
    stepId = 'theme'
  } else if (['title', 'coupleNames', 'date', 'heroImage', 'entranceStyle', 'templateDetails'].includes(field)) {
    stepId = 'cover'
  } else if (field === 'sectionLayout') {
    stepId = 'sections'
  } else if (field === 'sectionContent') {
    const sectionType = nestedField ? sectionContentTypes[nestedField] : undefined
    stepId = sectionType ? `section:${sectionType}` : 'sections'
  } else if (field === 'greetingImage' || field === 'greetingText') {
    stepId = 'section:greeting'
  } else if (field === 'gallery') {
    stepId = 'section:gallery'
  } else if (field === 'secondImage') {
    stepId = 'section:first-encounter'
  } else if (field === 'detailTitle' || field === 'detailText') {
    stepId = hasSection('first-encounter')
      ? 'section:first-encounter'
      : hasSection('moments-in-motion')
        ? 'section:moments-in-motion'
        : 'section:timeline'
  } else if (field === 'greetingVideoUrl') {
    stepId = hasSection('moments-in-motion') ? 'section:moments-in-motion' : 'section:greeting'
  } else if (field === 'storyPages') {
    const sharedPageSection = sortStorySections(draft.sectionLayout ?? [])
      .find(section => ['timeline', 'book', 'constellation'].includes(section.type))
    stepId = sharedPageSection ? `section:${sharedPageSection.type}` : 'sections'
  } else if (field === 'finalImage' || field === 'finalMessage') {
    stepId = 'section:finale'
  } else if (['musicUrl', 'musicTitle', 'musicArtist'].includes(field) && hasSection('music')) {
    stepId = 'section:music'
  }

  const index = steps.value.findIndex(step => step.id === stepId)
  return index >= 0 ? index : steps.value.length - 1
}

function stepIndexForIssue(issue: ZodIssue | undefined): number {
  const field = typeof issue?.path[0] === 'string' ? issue.path[0] : ''
  const nestedField = typeof issue?.path[1] === 'string' ? issue.path[1] : undefined
  return stepIndexForField(field, nestedField)
}

function focusValidationField(caught: unknown, details: ReturnType<typeof getUserFacingError>): void {
  const field = firstValidationField(caught)
  if (!field) return
  const [fieldName, nestedField] = field.split('.')
  const step = stepIndexForField(fieldName ?? field, nestedField)
  activeStep.value = step
  details.location = `Studio · Langkah ${step + 1} · ${steps.value[step]?.title ?? 'Konten cerita'}`
}
let localDraftRefKey = ''
let localDraftContentKey = ''
let saveTimer: ReturnType<typeof setTimeout> | undefined
let saveQueued = false
let currentSave: Promise<void> | undefined
let isRestoring = false
let stopDraftWatch: (() => void) | undefined
let stopCustomSlugWatch: (() => void) | undefined

function draftPayload() {
  const { password: _password, ...content } = draft
  return {
    ...content,
    activeStep: activeStep.value,
    ...(editingStorySlug.value ? { editingSlug: editingStorySlug.value } : {}),
    customSlug: customSlug.value.trim().toLowerCase() || undefined,
  }
}

function applyStoryContent(content: Partial<StoryContent>) {
  Object.assign(draft, content)
  const templateId = content.templateId ?? 'editorial-rose'
  draft.templateId = templateId
  draft.appearance = content.appearance ?? createDefaultStoryAppearance(templateId)
  draft.entranceStyle = content.entranceStyle ?? getTemplateDefinition(templateId)?.entrance.style ?? 'editorial'
  draft.cursorPreset = content.cursorPreset ?? 'system'
  draft.sectionLayout = content.sectionLayout ?? createDefaultSectionLayout(templateId)
  draft.sectionContent = {
    ...createEmptyStorySectionContent(),
    ...content.sectionContent,
  }
  draft.templateDetails = {
    ...createTemplateCustomization(templateId),
    ...content.templateDetails,
  }
}

function changeTemplate(templateId: StoryTemplateId): void {
  if (draft.templateId === templateId) return
  draft.templateId = templateId
  draft.appearance = createDefaultStoryAppearance(templateId)
  draft.entranceStyle = getTemplateDefinition(templateId)?.entrance.style ?? 'editorial'
  draft.templateDetails = {
    ...draft.templateDetails,
    ...createTemplateCustomization(templateId),
  }
  draft.sectionLayout = createDefaultSectionLayout(templateId)
  activeStep.value = 0
}

function persistLocalSnapshot() {
  if (!import.meta.client) return
  localStorage.setItem(localDraftContentKey, JSON.stringify({
    draft: draftPayload(),
    activeStep: activeStep.value,
  }))
}

async function ensureDraftRef() {
  if (draftId.value) return
  const ref = await $fetch<{ id: string, updatedAt: string }>('/api/drafts', { method: 'POST' })
  draftId.value = ref.id
  lastSavedAt.value = ref.updatedAt
  localStorage.setItem(localDraftRefKey, JSON.stringify({ id: ref.id }))
}

function saveDraft(): Promise<void> {
  if (currentSave) {
    saveQueued = true
    return currentSave
  }
  currentSave = saveDraftWork()
  return currentSave
}

async function saveDraftWork() {
  if (savingDraft.value) return
  savingDraft.value = true
  saveStatus.value = 'saving'
  try {
    do {
      saveQueued = false
      await ensureDraftRef()
      const saved = await $fetch<{ updatedAt: string }>(`/api/drafts/${draftId.value}`, {
        method: 'PUT',
        body: draftPayload(),
      })
      lastSavedAt.value = saved.updatedAt
      persistLocalSnapshot()
    } while (saveQueued)
    saveStatus.value = 'saved'
    error.value = ''
    errorLocation.value = ''
  } catch (caught) {
    saveStatus.value = 'error'
    const details = getUserFacingError(caught, {
      title: 'Draft belum tersimpan',
      fallback: 'Coba simpan lagi. Salinan perubahan tetap ada di browser ini.',
      location: 'Studio cerita · Draft otomatis',
    })
    error.value = details.message
    errorTitle.value = details.title
    errorLocation.value = details.location ?? 'Studio cerita · Draft otomatis'
    focusValidationField(caught, details)
    persistLocalSnapshot()
  } finally {
    savingDraft.value = false
    currentSave = undefined
  }
}

function scheduleSave() {
  if (isRestoring) return
  persistLocalSnapshot()
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveDraft(), 700)
}

async function restoreDraft() {
  if (route.query.new === '1') {
    const rawTemplateId = typeof route.query.template === 'string' ? route.query.template : ''
    const templateId = storyTemplateSchema.safeParse(rawTemplateId)
    if (!templateId.success) {
      error.value = 'Pilih template yang valid sebelum mulai membuat cerita.'
      await navigateTo('/templates', { replace: true })
      return
    }
    draft.templateId = templateId.data
    draft.appearance = createDefaultStoryAppearance(templateId.data)
    draft.entranceStyle = getTemplateDefinition(templateId.data)?.entrance.style ?? 'editorial'
    draft.templateDetails = {
      ...draft.templateDetails,
      ...createTemplateCustomization(templateId.data),
    }
    draft.sectionLayout = createDefaultSectionLayout(templateId.data)
    await saveDraft()
    if (saveStatus.value === 'error') throw new Error('Draft baru belum tersimpan.')
    await navigateTo(`/studio?draft=${draftId.value}`, { replace: true })
    return
  }
  const savedContent = localStorage.getItem(localDraftContentKey)
  const savedRef = localStorage.getItem(localDraftRefKey)
  const editSlug = typeof route.query.edit === 'string' ? route.query.edit : ''
  const requestedDraftId = typeof route.query.draft === 'string' ? route.query.draft : ''
  const importLegacy = route.query.importLocal === '1'
  if (importLegacy) {
    const legacyContent = localStorage.getItem('selamanya:draft-content')
    if (!legacyContent) {
      error.value = 'Snapshot draft lama tidak ditemukan di browser ini.'
      throw new Error(error.value)
    }
    try {
      const content = JSON.parse(legacyContent) as { draft?: Partial<StoryContent> & { editingSlug?: string, customSlug?: string }, activeStep?: number }
      if (!content.draft) throw new Error('Snapshot draft lama tidak memiliki konten.')
      const { editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = content.draft
      applyStoryContent(savedDraft)
      editingStorySlug.value = savedEditingSlug ?? ''
      customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      activeStep.value = Math.max(0, Math.min(steps.value.length - 1, Number(content.activeStep) || 0))
      await saveDraft()
      if (saveStatus.value === 'error') throw new Error('Draft belum berhasil diimpor dan disimpan.')
      localStorage.removeItem('selamanya:draft-content')
      localStorage.removeItem('selamanya:draft-ref')
      await navigateTo('/studio', { replace: true })
      return
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : 'Snapshot draft lama tidak dapat dibaca.'
      throw new Error(error.value)
    }
  }
  if (editSlug) {
    try {
      const result = await $fetch<{ slug: string, story: StoryContent }>(`/api/account/stories/${editSlug}`)
      applyStoryContent(result.story)
      editingStorySlug.value = result.slug
      customSlug.value = result.slug
      draft.password = ''
      removePassword.value = false
      await saveDraft()
      return
    } catch {
      error.value = 'Cerita tidak ditemukan atau bukan milik akun ini.'
      throw new Error(error.value)
    }
  }

  let savedDraftId = requestedDraftId
  if (!savedDraftId && savedRef) {
    try {
      savedDraftId = (JSON.parse(savedRef) as { id?: string }).id ?? ''
    } catch {
      localStorage.removeItem(localDraftRefKey)
    }
  }
  if (savedDraftId) {
    try {
      const result = await $fetch<{ id: string, draft: Partial<StoryContent> & { activeStep?: number, editingSlug?: string, customSlug?: string }, publishedSlug: string | null, updatedAt: string }>(
        `/api/drafts/${savedDraftId}`,
      )
      if (result.publishedSlug) {
        await navigateTo(`/studio?edit=${result.publishedSlug}`, { replace: true })
        return
      }
      const { activeStep: savedStep, editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = result.draft
      applyStoryContent(savedDraft)
      editingStorySlug.value = savedEditingSlug ?? ''
      customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      draftId.value = result.id
      lastSavedAt.value = result.updatedAt
      saveStatus.value = 'saved'
      activeStep.value = Math.max(0, Math.min(steps.value.length - 1, savedStep ?? 0))
      return
    } catch {
      if (requestedDraftId) {
        error.value = 'Draft tidak ditemukan atau bukan milik akun ini.'
        throw new Error(error.value)
      }
      localStorage.removeItem(localDraftRefKey)
    }
  }

  if (savedContent) {
    try {
      const content = JSON.parse(savedContent) as { draft?: Partial<StoryContent> & { editingSlug?: string, customSlug?: string }, activeStep?: number }
      if (content.draft) {
        const { editingSlug: savedEditingSlug, customSlug: savedCustomSlug, ...savedDraft } = content.draft
        applyStoryContent(savedDraft)
        editingStorySlug.value = savedEditingSlug ?? ''
        customSlug.value = savedCustomSlug ?? savedEditingSlug ?? ''
      }
      activeStep.value = Math.max(0, Math.min(steps.value.length - 1, Number(content.activeStep) || 0))
    } catch {
      localStorage.removeItem(localDraftContentKey)
    }
  }
  await saveDraft()
}

async function goToStep(index: number) {
  if (index < 0 || index >= steps.value.length) return
  activeStep.value = index
  if (saveTimer) clearTimeout(saveTimer)
  persistLocalSnapshot()
  await saveDraft()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  shareOrigin.value = window.location.origin
  isRestoring = true
  void (async () => {
    const user = await $fetch<{ id: string }>('/api/account/me')
    localDraftRefKey = `selamanya:${user.id}:draft-ref`
    localDraftContentKey = `selamanya:${user.id}:draft-content`
    stopDraftWatch = watch(draft, scheduleSave, { deep: true })
    stopCustomSlugWatch = watch(customSlug, scheduleSave)
    await restoreDraft()
  })().catch((caught: unknown) => {
    const details = getUserFacingError(caught, {
      title: 'Draft belum berhasil dimuat',
      fallback: 'Periksa koneksi, lalu muat ulang Studio.',
      location: 'Studio cerita · Pemulihan draft',
    })
    error.value = details.message
    errorTitle.value = details.title
    errorLocation.value = details.location ?? 'Studio cerita · Pemulihan draft'
    saveStatus.value = 'error'
    notifyError(details)
  }).finally(() => {
    isRestoring = false
  })
  const root = studioPage.value
  if (!root) return

  gsap.registerPlugin(ScrollTrigger)
  studioMotion = gsap.matchMedia(root)
  studioMotion.add('(prefers-reduced-motion: no-preference)', () => {
    gsap.from(root.querySelectorAll('header, .max-w-2xl'), {
      y: 18,
      autoAlpha: 0,
      duration: 0.65,
      stagger: 0.12,
      ease: 'power2.out',
    })

    root.querySelectorAll<HTMLElement>('.editor-card').forEach((card) => {
      gsap.from(card, {
        y: 20,
        autoAlpha: 0,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 88%',
          once: true,
        },
      })
    })
  })
})

function showStoryValidationIssue(issue: ZodIssue | undefined) {
  const field = issue?.path[0]
  const fieldName = typeof field === 'string' ? field : ''
  const contentType = typeof issue?.path[1] === 'string' ? issue.path[1] : ''
  const label = previewFieldLabels[fieldName]
    ?? (fieldName === 'sectionContent' ? `${contentType || 'Section'} · konten` : 'Konten cerita')
  const step = stepIndexForIssue(issue)
  activeStep.value = step
  window.scrollTo({ top: 0, behavior: 'smooth' })

  if (issue?.code === 'custom' && issue.message) {
    error.value = issue.message
  } else if (issue?.code === 'invalid_format' && issue.format === 'url') {
    let value: unknown = draft
    for (const key of issue.path) {
      if (typeof value !== 'object' || value === null) {
        value = undefined
        break
      }
      value = Reflect.get(value, key)
    }
    error.value = typeof value === 'string' && value.trim()
      ? `${label} harus berupa URL HTTPS yang valid.`
      : `Tambahkan URL HTTPS untuk ${label.toLowerCase()}.`
  } else if (issue?.code === 'too_small') {
    error.value = `Lengkapi ${label.toLowerCase()} sebelum pratinjau.`
  } else {
    error.value = `${label} belum lengkap atau tidak valid.`
  }
  errorTitle.value = 'Pratinjau belum siap'
  errorLocation.value = `Studio · Langkah ${step + 1} · ${steps.value[step]?.title ?? 'Konten cerita'}`
}

function openPreview() {
  const parsed = storyContentSchema.safeParse(storyContentForPreview())
  if (!parsed.success) {
    showStoryValidationIssue(parsed.error.issues[0])
    return
  }
  error.value = ''
  errorLocation.value = ''
  void saveDraft()
  previewOpen.value = true
}

async function publish() {
  error.value = ''
  errorLocation.value = ''
  const parsed = storyContentSchema.safeParse(draft)
  if (!parsed.success) {
    previewOpen.value = false
    showStoryValidationIssue(parsed.error.issues[0])
    return
  }
  saving.value = true
  try {
    if (saveTimer) clearTimeout(saveTimer)
    await saveDraft()
    if (!draftId.value || saveStatus.value === 'error') {
      throw new Error('Draft belum tersimpan. Periksa koneksi, lalu coba lagi sebelum menerbitkan.')
    }
    const wasEditing = Boolean(editingStorySlug.value)
    const result = await $fetch<{ slug: string }>(
      editingStorySlug.value ? `/api/account/stories/${editingStorySlug.value}` : '/api/stories',
      {
      method: editingStorySlug.value ? 'PUT' : 'POST',
      body: {
        ...draft,
        customSlug: customSlug.value.trim().toLowerCase() || undefined,
        draftId: draftId.value,
        removePassword: removePassword.value,
      },
      },
    )
    publishedSlug.value = result.slug
    publishedIsUpdate.value = wasEditing
    editingStorySlug.value = result.slug
    publishedUrl.value = `${window.location.origin}/w/${result.slug}`
    success('Cerita berhasil diterbitkan dan link berbagi siap digunakan.')
    previewOpen.value = false
    if (localDraftRefKey) localStorage.removeItem(localDraftRefKey)
    if (localDraftContentKey) localStorage.removeItem(localDraftContentKey)
    draftId.value = ''
  } catch (caught) {
    const details = getUserFacingError(caught, {
      title: 'Cerita belum berhasil diterbitkan',
      fallback: 'Coba lagi. Draft dan perubahanmu tetap tersimpan.',
      location: 'Studio cerita · Publikasi',
    })
    error.value = details.message
    errorTitle.value = details.title
    errorLocation.value = details.location ?? 'Studio cerita · Publikasi'
    focusValidationField(caught, details)
    if (firstValidationField(caught)) {
      previewOpen.value = false
    }
    notifyError(details)
  } finally {
    saving.value = false
  }
}

async function copyLink() {
  if (copyingLink.value) return
  copyingLink.value = true
  copyMessage.value = ''
  try {
    await navigator.clipboard.writeText(publishedUrl.value)
    copyMessage.value = 'Tautan berhasil disalin.'
    success(copyMessage.value)
  } catch {
    const details = {
      title: 'Link belum bisa disalin',
      message: 'Salin alamat di atas secara manual atau izinkan akses clipboard.',
      location: 'Studio cerita · Dialog publikasi',
    }
    copyMessage.value = 'Tautan belum bisa disalin. Salin alamat di atas secara manual.'
    notifyError(details)
  } finally {
    copyingLink.value = false
  }
}

onBeforeUnmount(() => {
  if (saveTimer) {
    clearTimeout(saveTimer)
    void saveDraft()
  }
  stopDraftWatch?.()
  stopCustomSlugWatch?.()
  studioMotion?.revert()
})
</script>

<style scoped>
.editor-card {
  border-radius: var(--radius-extra-large);
  background: var(--color-surface);
  padding: var(--space-6);
  box-shadow: var(--shadow-small);
  transition: box-shadow var(--motion-duration-slow) var(--motion-ease-standard);
}
.editor-card:hover {
  box-shadow: var(--shadow-medium);
}
.section-kicker {
  margin-bottom: 1.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--color-primary);
}
.share-slug-field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  background: var(--color-surface);
  padding-left: 0.75rem;
  color: var(--color-muted-foreground);
  font-size: 0.85rem;
  white-space: nowrap;
}
.floating-field:focus-within .share-slug-field {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(80 69 245 / 12%);
}
.share-slug-field .editor-input {
  min-width: 0;
  border: 0;
  background: transparent;
  padding-left: 0.25rem;
}
.story-password-field {
  position: relative;
  display: block;
}
.story-password-field .editor-input {
  padding-right: 3.5rem;
}
.story-password-toggle {
  position: absolute;
  top: 50%;
  right: 0.35rem;
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border: 0;
  border-radius: 50%;
  color: var(--color-primary);
  background: transparent;
  transform: translateY(-50%);
  cursor: pointer;
}
.story-password-toggle:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
}
.step-tab {
  display: flex;
  min-height: 3.4rem;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-large);
  padding: 0.7rem 0.85rem;
  background: var(--color-surface-glass);
  color: var(--color-muted-foreground);
  font-size: 0.75rem;
  text-align: left;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}
.step-tab span:first-child {
  color: var(--color-primary);
  font-size: 0.65rem;
  font-weight: 700;
}
.step-tab:hover { transform: translateY(-2px); }
.step-tab-active {
  border-color: var(--color-primary);
  background: var(--color-surface);
  color: var(--color-foreground);
  box-shadow: var(--shadow-medium);
}
.step-tab-complete { border-color: var(--color-success); }
.template-option {
  display: grid;
  justify-items: start;
  gap: 0.55rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-medium);
  padding: 1rem;
  background: var(--color-surface);
  color: var(--color-foreground);
  text-align: left;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}
.template-option:hover { transform: translateY(-2px); }
.template-option-active {
  border-color: var(--template-accent);
  box-shadow: 0 0 0 2px var(--template-accent), 0 12px 28px rgb(35 25 20 / 8%);
}
.template-option strong { font-family: 'Instrument Serif', serif; font-size: 1.35rem; }
.template-option > span:not(.template-swatch) { color: var(--color-muted-foreground); font-size: 0.7rem; }
.template-swatch { display: flex; width: 100%; gap: 0.4rem; }
.template-swatch i { height: 2rem; flex: 1; border-radius: 0.55rem; background: var(--template-paper); }
.template-swatch i:nth-child(2) { background: var(--template-accent); }
.template-swatch i:nth-child(3) { background: var(--template-ink); }
.template-check { color: var(--template-accent) !important; font-weight: 700; }
@media (prefers-reduced-motion: reduce) {
  .published-dialog-close, .published-dialog-link { transition: none; }
  .published-dialog-close:hover { transform: none; }
}
@media (min-width: 768px) {
  .editor-card { padding: 2rem; }
}
</style>
