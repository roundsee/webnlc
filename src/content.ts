export type Highlight = {
  label: string;
  value: string;
  note: string;
};

export type Ministry = {
  name: string;
  description: string;
  meeting: string;
};

export type Event = {
  date: string;
  title: string;
  time: string;
  location: string;
  description: string;
};

export type Sermon = {
  title: string;
  speaker: string;
  duration: string;
  description: string;
  videoLabel: string;
};

export type Post = {
  type: 'Renungan' | 'Artikel' | 'Video';
  status: 'draft' | 'published';
  title: string;
  date: string;
  excerpt: string;
  mediaLabel: string;
  publishedAt: string;
  body: string;
};

export type Content = {
  siteName: string;
  tagline: string;
  mission: string;
  navigation: {
    home: string;
    about: string;
    ministry: string;
    blog: string;
    media: string;
    contact: string;
    admin: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    mediaTitle: string;
    mediaDescription: string;
    mediaTag: string;
  };
  highlights: Highlight[];
  about: {
    title: string;
    description: string;
    points: string[];
  };
  ministries: Ministry[];
  events: Event[];
  sermons: Sermon[];
  posts: Post[];
  quiz: {
    title: string;
    question: string;
    options: string[];
    answer: string;
    note: string;
  };
  humor: {
    title: string;
    items: string[];
  };
  locations: {
    region: string;
    name: string;
    address: string;
  }[];
  founder: {
    label: string;
    name: string;
    bio: string;
  };
  contact: {
    title: string;
    description: string;
    address: string;
    phone: string;
    email: string;
    cta: string;
  };
  footer: {
    note: string;
    legal: string;
    columns: {
      title: string;
      items: string[];
    }[];
  };
};

export const defaultContent: Content = {
  siteName: 'GSJA New Life',
  tagline: 'New Life Church (NLC)',
  mission: 'Menjadi gereja lokal yang kuat, relevan, dan bertumbuh bersama generasi hari ini.',
  navigation: {
    home: 'Beranda',
    about: 'Tentang',
    ministry: 'Life Group',
    blog: 'Blog',
    media: 'Media',
    contact: 'Kontak',
    admin: 'Admin',
  },
  hero: {
    badge: 'Welcome Home',
    title: 'Ruang ibadah modern untuk membangun iman, harapan, dan komunitas.',
    subtitle:
      'Template ini dibuat seperti website gereja modern. Semua konten masih dummy, jadi Anda bisa mengganti teks, gambar, dan video dari halaman admin.',
    primaryCta: 'Lihat Jadwal Ibadah',
    secondaryCta: 'Buka Admin',
    mediaTitle: 'Hero Media Dummy',
    mediaDescription: 'Gunakan area ini untuk mengganti video highlight atau gambar utama gereja Anda.',
    mediaTag: '1080p / Placeholder',
  },
  highlights: [
    { label: 'Ibadah Minggu', value: '3 Sesi', note: 'Pagi, siang, dan malam' },
    { label: 'Komunitas Aktif', value: '12 Life Group', note: 'LG Kopi, LG Hana, LG Wings, dll' },
    { label: 'Konten Digital', value: 'Setiap Minggu', note: 'Sermon, highlight, dan pengumuman' },
  ],
  about: {
    title: 'Tentang Gereja',
    description:
      'Area ini menampilkan profil gereja, visi, dan narasi utama. Saat produksi, ganti semua isi dummy ini lewat admin agar sesuai identitas Anda.',
    points: [
      'Atmosfer ibadah hangat dengan tampilan visual yang rapi.',
      'Ruang untuk berita gereja, jadwal ibadah, dan media khotbah.',
      'Admin sederhana untuk mengganti konten tanpa masuk ke kode.',
    ],
  },
  ministries: [
    {
      name: 'LG Kopi',
      description: 'Komunitas Pria Integritas.',
      meeting: 'Jumat, 19.00 WIB',
    },
    {
      name: 'LG Hana',
      description: 'Komunitas wanita yang bertumbuh dalam firman dan persekutuan.',
      meeting: 'Sabtu, 10.00 WIB',
    },
    {
      name: 'LG Wings',
      description: 'Komunitas muda yang dinamis untuk bertumbuh, melayani, dan berdampak.',
      meeting: 'Rabu, 18.30 WIB',
    },
    {
      name: 'LG Grace',
      description: 'Komunitas keluarga untuk saling menguatkan dan mendoakan.',
      meeting: 'Kamis, 19.00 WIB',
    },
    {
      name: 'LG Hope',
      description: 'Komunitas dengan fokus pemuridan dan pertumbuhan rohani.',
      meeting: 'Selasa, 19.00 WIB',
    },
    {
      name: 'LG Joy',
      description: 'Komunitas yang menolong jemaat bertumbuh dalam sukacita Kristus.',
      meeting: 'Sabtu, 16.00 WIB',
    },
    {
      name: 'LG Faith',
      description: 'Komunitas untuk memperkuat iman melalui sharing firman dan doa.',
      meeting: 'Jumat, 18.30 WIB',
    },
    {
      name: 'LG Shine',
      description: 'Komunitas yang fokus pada pelayanan, kesaksian, dan dampak sosial.',
      meeting: 'Minggu, 15.00 WIB',
    },
    {
      name: 'LG One',
      description: 'Komunitas yang menjaga kebersamaan dan kesatuan tubuh Kristus.',
      meeting: 'Rabu, 19.30 WIB',
    },
    {
      name: 'LG Connect',
      description: 'Komunitas untuk relasi, mentoring, dan penguatan iman.',
      meeting: 'Senin, 19.00 WIB',
    },
    {
      name: 'LG Harvest',
      description: 'Komunitas yang bertumbuh dalam pelayanan dan pengutusan.',
      meeting: 'Kamis, 18.30 WIB',
    },
    {
      name: 'LG Next',
      description: 'Komunitas generasi berikutnya untuk pembinaan dan aktivasi talenta.',
      meeting: 'Sabtu, 19.00 WIB',
    },
  ],
  events: [
    {
      date: '10-12 September 2026',
      title: 'National Mission Conference - Behold and Listen',
      time: 'Sepanjang hari',
      location: 'GSJA New Life Bandung',
      description: 'Conference nasional GSJA dengan tema Behold and Listen. Siapkan jemaat untuk mengikuti sesi pembicara, worship, dan persekutuan.',
    },
    {
      date: 'Minggu, 28 Juli',
      title: 'Ibadah Raya & Perjamuan',
      time: '08.00, 10.30, 17.00',
      location: 'Main Hall',
      description: 'Dummy event untuk halaman depan. Konten ini nanti bisa diganti dari admin.',
    },
    {
      date: 'Rabu, 31 Juli',
      title: 'Midweek Prayer',
      time: '19.30 WIB',
      location: 'Online / Chapel',
      description: 'Sesi doa tengah minggu dengan materi renungan singkat dan permohonan doa.',
    },
  ],
  sermons: [
    {
      title: 'Hope in Uncertain Times',
      speaker: 'Ps. Daniel',
      duration: '34 menit',
      description: 'Slot video dummy untuk menampilkan khotbah minggu ini atau highlight sermon.',
      videoLabel: 'Dummy Video Preview',
    },
    {
      title: 'Build the House',
      speaker: 'Ps. Maria',
      duration: '28 menit',
      description: 'Konten media kedua untuk daftar khotbah, devotion, atau testimoni.',
      videoLabel: 'Media Placeholder',
    },
  ],
  quiz: {
    title: 'Quiz Firman Minggu Ini',
    question: 'Siapakah yang berjalan di atas air bersama Yesus?',
    options: ['Petrus', 'Yohanes', 'Yakobus', 'Andreas'],
    answer: 'Petrus',
    note: 'Jawaban ditampilkan sebagai ilustrasi. Bisa diganti menjadi quiz interaktif nanti.',
  },
  humor: {
    title: 'Humor Kristen',
    items: [
      'Kalau doa belum dijawab, mungkin Tuhan lagi siapkan update versi berikutnya.',
      'Jangan lupa: iman tanpa tindakan itu seperti Wi-Fi tanpa sinyal.',
      'Minggu pagi: minat tidur besar, tapi roh tetap panggil ibadah.',
    ],
  },
  posts: [
    {
      type: 'Renungan',
      status: 'published',
      title: 'Tetap Teguh Saat Musim Tidak Pasti',
      date: 'Senin, 22 Juli',
      excerpt: 'Renungan pendek tentang iman yang tetap berdiri saat situasi belum berubah.',
      mediaLabel: 'Devotional',
      publishedAt: '2026-07-22T08:00:00.000Z',
      body:
        'Saat keadaan belum berubah, iman justru diuji untuk tetap percaya. Renungan ini meneguhkan bahwa Tuhan tetap bekerja meski jawaban belum terlihat. Tetap melangkah, tetap berdoa, dan tetap berharap.',
    },
    {
      type: 'Artikel',
      status: 'published',
      title: 'Mengapa Komunitas Rohani Penting',
      date: 'Rabu, 24 Juli',
      excerpt: 'Artikel singkat untuk membangun pemahaman tentang life group dan pertumbuhan bersama.',
      mediaLabel: 'Reading',
      publishedAt: '2026-07-24T08:00:00.000Z',
      body:
        'Komunitas rohani menolong kita bertumbuh, saling menguatkan, dan saling menjaga. Life Group memberi ruang aman untuk bertanya, berbagi beban, dan bertumbuh dalam firman secara praktis.',
    },
    {
      type: 'Video',
      status: 'published',
      title: '60 Detik Penguatan Iman',
      date: 'Jumat, 26 Juli',
      excerpt: 'Slot video pendek untuk klip singkat gembala, kutipan firman, atau highlight pelayanan.',
      mediaLabel: 'Short Video',
      publishedAt: '2026-07-26T08:00:00.000Z',
      body:
        'Video singkat ini bisa dipakai untuk cuplikan pesan gembala, kutipan firman, atau ajakan praktis untuk menjalani minggu dengan hati yang kuat.',
    },
  ],
  locations: [
    { region: 'Cabang', name: 'Taman Kopo Ketapang', address: 'Bandung' },
    { region: 'Indonesia', name: 'GSJA New Life Bandung', address: 'Jl. Merdeka No. 32, Bandung' },
    { region: 'Indonesia', name: 'GSJA New Life Online', address: 'Platform digital dan komunitas jemaat' },
  ],
  founder: {
    label: 'Gembala Sidang',
    name: 'Ps. Yoel Soekardi, M.Div',
    bio: 'Bio placeholder untuk profil gembala/pemimpin gereja. Ganti dengan informasi resmi dari Anda.',
  },
  contact: {
    title: 'Hubungi Kami',
    description: 'Ganti data kontak, alamat, dan tombol call-to-action sesuai kebutuhan gereja Anda.',
    address: 'Jl. Merdeka No. 32, Bandung',
    phone: '+62 812 3456 7890',
    email: 'hello@nlc.church',
    cta: 'Kirim Pesan',
  },
  footer: {
    note: 'Website ini menggunakan dummy content untuk tahap development.',
    legal: 'GSJA New Life / New Life Church (NLC)',
    columns: [
      { title: 'Gereja', items: ['Indonesia', 'Asia', 'Australia & New Zealand', 'Eropa', 'USA & Canada'] },
      { title: 'Ibadah', items: ['Sunday Service', 'Youth', 'Family', 'English Service'] },
      { title: 'Terhubung', items: ['Baptis', 'Gabung Life Group', 'Permintaan Doa', 'Testimoni'] },
      { title: 'Media', items: ['YouTube', 'Instagram', 'TV', 'Musik'] },
    ],
  },
};

export const contentStorageKey = 'wnlc-church-content';