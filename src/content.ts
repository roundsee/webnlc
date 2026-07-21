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
    ministry: 'Pelayanan',
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
    { label: 'Komunitas Aktif', value: '12+ Group', note: 'Pemuda, keluarga, dan pelayanan' },
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
      name: 'Youth & Young Adult',
      description: 'Komunitas generasi muda dengan pertemuan rutin, worship night, dan mentoring.',
      meeting: 'Jumat, 19.00 WIB',
    },
    {
      name: 'Family & Marriage',
      description: 'Ruang pertumbuhan untuk keluarga, pasangan, dan parenting.',
      meeting: 'Sabtu, 10.00 WIB',
    },
    {
      name: 'Worship Team',
      description: 'Pelayanan musik, vokal, dan produksi media untuk mendukung ibadah.',
      meeting: 'Rabu, 18.30 WIB',
    },
  ],
  events: [
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
    { region: 'Indonesia', name: 'GSJA New Life Surabaya', address: 'Pakuwon Mall Surabaya, Rooftop 2' },
    { region: 'Indonesia', name: 'GSJA New Life Jakarta', address: 'Main Hall, pusat kota Jakarta' },
    { region: 'Asia', name: 'GSJA New Life Singapore', address: 'Community Hall, Central District' },
  ],
  founder: {
    label: 'Gembala Sidang',
    name: 'Ps. Jonathan Rivera',
    bio: 'Bio placeholder untuk profil gembala/pemimpin gereja. Ganti dengan informasi resmi dari Anda.',
  },
  contact: {
    title: 'Hubungi Kami',
    description: 'Ganti data kontak, alamat, dan tombol call-to-action sesuai kebutuhan gereja Anda.',
    address: 'Jl. Contoh No. 123, Jakarta',
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