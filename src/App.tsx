import { useEffect, useMemo, useState } from 'react';
import { defaultContent, contentStorageKey, type Content, type Post } from './content';
import { RenunganAdminPanel } from './RenunganAdminPanel';
import { fetchRenunganPosts, type RenunganPost } from './renunganApi';

type Route = 'home' | 'blog' | 'admin';

const POSTS_PER_PAGE = 3;
const PREVIEW_TOKEN = 'dev010101010';
const PREVIEW_PREFIX = `/${PREVIEW_TOKEN}`;
const LIVE_DOMAIN_URL = 'https://gsjanewlifebdg.com';
const TERHUBUNG_APP_URL = 'https://play.google.com/store/apps/details?id=com.terhubung.app';
const PRODUCTION_HOSTS = new Set(['gsjanewlifebdg.com', 'www.gsjanewlifebdg.com']);

type LegacyNavigation = Partial<Content['navigation']> & { renungan?: string };

type BlogItem = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  mediaLabel: string;
  publishedAt: string;
  body: string;
  status: 'draft' | 'published';
  pdfUrl?: string;
  pdfOriginalName?: string;
  pdfSizeBytes?: number;
};

function normalizePost(post: Post): Post {
  return {
    ...post,
    publishedAt: post.publishedAt || new Date().toISOString(),
    body: post.body || post.excerpt,
    status: post.status || 'draft',
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));
  } catch {
    return value;
  }
}

function mergeNavigation(overrides?: LegacyNavigation) {
  return {
    ...defaultContent.navigation,
    ...overrides,
    blog: overrides?.blog ?? overrides?.renungan ?? defaultContent.navigation.blog,
  };
}

function renunganToBlogItem(post: RenunganPost): BlogItem {
  return {
    slug: post.slug,
    title: post.title,
    date: formatDate(post.publishedAt || post.createdAt),
    excerpt: post.excerpt,
    mediaLabel: 'Renungan',
    publishedAt: post.publishedAt || post.createdAt,
    body: post.htmlContent,
    status: post.status,
    pdfUrl: post.pdfUrl,
    pdfOriginalName: post.pdfOriginalName,
    pdfSizeBytes: post.pdfSizeBytes,
  };
}

function legacyPostToBlogItem(post: Post): BlogItem {
  return {
    slug: slugify(post.title),
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    mediaLabel: post.mediaLabel,
    publishedAt: post.publishedAt,
    body: `<p>${post.body
      .split('\n')
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => paragraph.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
      .join('</p><p>')}</p>`,
    status: post.status,
    pdfUrl: '',
    pdfOriginalName: '',
    pdfSizeBytes: 0,
  };
}

function loadContent(): Content {
  if (typeof window === 'undefined') {
    return defaultContent;
  }

  try {
    const stored = window.localStorage.getItem(contentStorageKey);
    if (!stored) {
      return defaultContent;
    }

    const parsed = JSON.parse(stored) as Content;
    const oldFounderNames = new Set(['Ps. Jonathan Rivera']);
    const oldAddresses = new Set(['Jl. Contoh No. 123, Jakarta']);
    const oldLocations = new Set(['GSJA New Life Surabaya', 'GSJA New Life Jakarta', 'GSJA New Life Singapore']);

    return {
      ...defaultContent,
      ...parsed,
      tagline: parsed.tagline ?? defaultContent.tagline,
      mission: parsed.mission ?? defaultContent.mission,
      hero: { ...defaultContent.hero, ...parsed.hero },
      navigation: mergeNavigation(parsed.navigation as LegacyNavigation),
      about: { ...defaultContent.about, ...parsed.about },
      contact: {
        ...defaultContent.contact,
        ...parsed.contact,
        address: !parsed.contact?.address || oldAddresses.has(parsed.contact.address) ? defaultContent.contact.address : parsed.contact.address,
      },
      founder: {
        ...defaultContent.founder,
        ...parsed.founder,
        name: !parsed.founder?.name || oldFounderNames.has(parsed.founder.name) ? defaultContent.founder.name : parsed.founder.name,
      },
      footer: {
        ...defaultContent.footer,
        ...parsed.footer,
        columns: parsed.footer?.columns?.length ? parsed.footer.columns : defaultContent.footer.columns,
      },
      highlights: parsed.highlights?.length ? parsed.highlights : defaultContent.highlights,
      ministries: parsed.ministries?.length ? parsed.ministries : defaultContent.ministries,
      events: parsed.events?.length ? parsed.events : defaultContent.events,
      sermons: parsed.sermons?.length ? parsed.sermons : defaultContent.sermons,
      posts: parsed.posts?.length ? parsed.posts.map(normalizePost) : defaultContent.posts,
      locations:
        parsed.locations?.length && !parsed.locations.every((location) => oldLocations.has(location.name))
          ? parsed.locations
          : defaultContent.locations,
    };
  } catch {
    return defaultContent;
  }
}

function saveContent(content: Content) {
  window.localStorage.setItem(contentStorageKey, JSON.stringify(content));
}

function getRoute(pathname: string): Route {
  if (pathname.startsWith('/renungan')) {
    return 'blog';
  }

  return pathname.startsWith('/admin') ? 'admin' : 'home';
}

function normalizePath(path: string) {
  if (!path) {
    return '/';
  }

  return path.startsWith('/') ? path : `/${path}`;
}

function getLocationState() {
  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname;
  const isPreviewPath = pathname === PREVIEW_PREFIX || pathname.startsWith(`${PREVIEW_PREFIX}/`);
  const internalPath = isPreviewPath ? pathname.slice(PREVIEW_PREFIX.length) || '/' : pathname;
  const showComingSoon = PRODUCTION_HOSTS.has(hostname) && !isPreviewPath;

  return {
    route: getRoute(internalPath),
    isPreviewPath,
    showComingSoon,
  };
}

function App() {
  const [content, setContent] = useState<Content>(() => loadContent());
  const [locationState, setLocationState] = useState(() =>
    typeof window === 'undefined' ? { route: 'home' as Route, isPreviewPath: false, showComingSoon: false } : getLocationState(),
  );

  const buildPath = (path: string) => {
    const normalizedPath = normalizePath(path);

    if (!locationState.isPreviewPath) {
      return normalizedPath;
    }

    return normalizedPath === '/' ? PREVIEW_PREFIX : `${PREVIEW_PREFIX}${normalizedPath}`;
  };

  const navigate = (path: string) => {
    const nextPath = buildPath(path);
    window.history.pushState({}, '', nextPath);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  useEffect(() => {
    const onPopState = () => setLocationState(getLocationState());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    saveContent(content);
  }, [content]);

  const currentPage = useMemo(() => {
    if (locationState.showComingSoon) {
      return <ComingSoonPage />;
    }

    return locationState.route === 'admin' ? (
      <AdminPage content={content} onChange={setContent} onReset={() => setContent(defaultContent)} onNavigate={navigate} />
    ) : locationState.route === 'blog' ? (
      <BlogPage content={content} onNavigate={navigate} buildPath={buildPath} />
    ) : (
      <HomePage content={content} onNavigate={navigate} />
    );
  }, [buildPath, content, locationState, navigate]);

  return currentPage;
}

function ComingSoonPage() {
  return (
    <div className="site-shell coming-soon-shell">
      <section className="section coming-soon-panel">
        <span className="section-label">GSJA New Life Bandung</span>
        <h1>Coming Soon</h1>
        <p>Website resmi sedang dalam tahap pengembangan. Silakan kembali lagi dalam waktu dekat.</p>
      </section>
    </div>
  );
}

function HomePage({ content, onNavigate }: { content: Content; onNavigate: (path: string) => void }) {
  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">W</div>
          <div>
            <div className="eyebrow">Church Template</div>
            <div className="brand-name">{content.siteName}</div>
            <div className="brand-tagline">{content.tagline}</div>
          </div>
        </div>
        <nav className="nav-links">
          <a href="#home">{content.navigation.home}</a>
          <a href="#about">{content.navigation.about}</a>
          <a href="#ministries">{content.navigation.ministry}</a>
          <button className="nav-button" onClick={() => onNavigate('/renungan')} type="button">
            {content.navigation.blog}
          </button>
          <a href="#media">{content.navigation.media}</a>
          <a href="#contact">{content.navigation.contact}</a>
          <button className="nav-button" onClick={() => onNavigate('/admin')} type="button">
            {content.navigation.admin}
          </button>
        </nav>
      </header>

      <main>
        <section className="hero section" id="home">
          <div className="hero-copy">
            <span className="pill">{content.hero.badge}</span>
            <h1>{content.hero.title}</h1>
            <p>{content.hero.subtitle}</p>
            <div className="hero-actions">
              <a className="button primary" href="#events">
                {content.hero.primaryCta}
              </a>
            </div>
          </div>

          <div className="hero-media">
            <div className="media-frame">
              <div className="media-overlay" />
              <div className="media-text">
                <span className="pill accent">{content.hero.mediaTag}</span>
                <div className="media-panel">
                  <h2>{content.hero.mediaTitle}</h2>
                  <p>{content.hero.mediaDescription}</p>
                </div>
              </div>
              <div className="media-footer">
                <span>Latest message</span>
                <strong>Watch Sunday sermon highlight</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="section hero-extras">
          <div className="hero-quote-card">
            <span className="section-label">This Week</span>
            <strong>{content.mission}</strong>
            <p>Gunakan area ini sebagai headline besar yang selalu berubah sesuai momentum pelayanan.</p>
          </div>
          <div className="service-strip">
            <div className="service-chip">
              <span>Sunday Service</span>
              <strong>08.00 / 10.30 / 17.00</strong>
            </div>
            <div className="service-chip">
              <span>Live Worship</span>
              <strong>Band + Choir + Media</strong>
            </div>
            <div className="service-chip">
              <span>Prayer Room</span>
              <strong>Open every week</strong>
            </div>
          </div>
          <div className="highlights-grid">
            {content.highlights.map((item) => (
              <article className="highlight-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="ticker-band">
          <div className="ticker-track">
            <span>WELCOME HOME</span>
            <span>{content.mission}</span>
            <span>LIFE GROUP</span>
            <span>MISSION 2030</span>
            <span>WELCOME HOME</span>
            <span>{content.mission}</span>
            <span>LIFE GROUP</span>
            <span>MISSION 2030</span>
          </div>
        </section>

        <section className="section quote-band">
          <div>
            <span className="section-label">Vision</span>
            <h2>{content.mission}</h2>
          </div>
          <p>
            Ini masih dummy copy, tetapi struktur ini sudah disiapkan supaya nanti Anda bisa mengganti seluruh narasi gereja dengan cepat dari admin.
          </p>
        </section>

        <section className="section split" id="about">
          <div>
            <span className="section-label">{content.navigation.about}</span>

            <h2>{content.about.title}</h2>
            <p>{content.about.description}</p>
          </div>
          <div className="info-list">
            {content.about.points.map((point) => (
              <div className="info-item" key={point}>
                <span className="dot" />
                <p>{point}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="events">
          <div className="section-heading">
            <div>
              <span className="section-label">Schedule</span>
              <h2>Ibadah & Agenda</h2>
            </div>
          </div>
          <div className="card-grid two-up">
            {content.events.map((event) => (
              <article className="event-card" key={`${event.title}-${event.date}`}>
                <div className="event-date">{event.date}</div>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="event-meta">
                  <span>{event.time}</span>
                  <span>{event.location}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section callout-band">
          <div>
            <span className="section-label">Announcement</span>
            <h2>Konten utama, jadwal ibadah, dan media khotbah ditempatkan dalam format yang mudah dipindah ke konten asli.</h2>
          </div>
          <div className="callout-card">
            <strong>Admin-ready</strong>
            <p>Gunakan halaman admin untuk mengganti dummy content tanpa mengubah kode.</p>
          </div>
        </section>

        <section className="section" id="ministries">
          <div className="section-heading">
            <div>
              <span className="section-label">Ministry</span>
              <h2>Pelayanan Utama</h2>
            </div>
          </div>
          <div className="card-grid three-up">
            {content.ministries.map((ministry) => (
              <article className="feature-card" key={ministry.name}>
                <h3>{ministry.name}</h3>
                <p>{ministry.description}</p>
                <strong>{ministry.meeting}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="section founder-section">
          <div className="founder-card">
            <span className="section-label">{content.founder.label}</span>
            <h2>{content.founder.name}</h2>
            <p>{content.founder.bio}</p>
          </div>
          <div className="location-grid">
            {content.locations.map((location) => (
              <article className="location-card" key={`${location.name}-${location.region}`}>
                <span>{location.region}</span>
                <strong>{location.name}</strong>
                <p>{location.address}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section media-section" id="media">
          <div className="section-heading">
            <div>
              <span className="section-label">Media</span>
              <h2>Seri Khotbah & Video Dummy</h2>
            </div>
          </div>
          <div className="card-grid two-up">
            {content.sermons.map((sermon) => (
              <article className="sermon-card" key={sermon.title}>
                <div className="video-placeholder">
                  <span>{sermon.videoLabel}</span>
                  <div className="play-button">Play</div>
                </div>
                <div className="sermon-copy">
                  <h3>{sermon.title}</h3>
                  <p>{sermon.description}</p>
                  <div className="event-meta">
                    <span>{sermon.speaker}</span>
                    <span>{sermon.duration}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section split" id="fun-corner">
          <div className="quiz-card">
            <span className="section-label">Fun Corner</span>
            <h2>{content.quiz.title}</h2>
            <p>{content.quiz.question}</p>
            <div className="quiz-options">
              {content.quiz.options.map((option) => (
                <div className="quiz-option" key={option}>
                  {option}
                </div>
              ))}
            </div>
            <p className="quiz-answer">
              Jawaban: <strong>{content.quiz.answer}</strong>
            </p>
            <small>{content.quiz.note}</small>
          </div>

          <div className="humor-card">
            <span className="section-label">Fun Corner</span>
            <h2>{content.humor.title}</h2>
            <div className="humor-list">
              {content.humor.items.map((item) => (
                <article className="humor-item" key={item}>
                  <p>{item}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div>
            <span className="section-label">Contact</span>
            <h2>{content.contact.title}</h2>
            <p>{content.contact.description}</p>
          </div>
          <div className="contact-card">
            <div>
              <span>Alamat</span>
              <strong>{content.contact.address}</strong>
            </div>
            <div>
              <span>Telepon</span>
              <strong>{content.contact.phone}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{content.contact.email}</strong>
            </div>
            <a className="button secondary full" href={TERHUBUNG_APP_URL} target="_blank" rel="noreferrer">
              Buka Aplikasi Terhubung
            </a>
            <button className="button primary full" type="button">
              {content.contact.cta}
            </button>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-branding">
          <p>{content.footer.note}</p>
          <span>{content.footer.legal}</span>
        </div>
        <div className="footer-columns">
          {content.footer.columns.map((column) => (
            <div className="footer-column" key={column.title}>
              <strong>{column.title}</strong>
              {column.items.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

function BlogPage({ content, onNavigate, buildPath }: { content: Content; onNavigate: (path: string) => void; buildPath: (path: string) => string }) {
  const [blogPosts, setBlogPosts] = useState<BlogItem[]>(() =>
    content.posts.filter((post) => post.status === 'published' && post.type === 'Renungan').map(legacyPostToBlogItem),
  );

  useEffect(() => {
    let active = true;

    fetchRenunganPosts('public')
      .then((posts) => {
        if (active) {
          setBlogPosts(posts.map(renunganToBlogItem));
        }
      })
      .catch(() => {
        if (active) {
          setBlogPosts(content.posts.filter((post) => post.status === 'published' && post.type === 'Renungan').map(legacyPostToBlogItem));
        }
      });

    return () => {
      active = false;
    };
  }, [content.posts]);

  const sortedPosts = useMemo(
    () => [...blogPosts].sort((left, right) => +new Date(right.publishedAt) - +new Date(left.publishedAt)),
    [blogPosts],
  );

  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return new URLSearchParams(window.location.search).get('q') ?? '';
  });
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') {
      return 1;
    }

    return Number(new URLSearchParams(window.location.search).get('page') ?? '1') || 1;
  });
  const [selectedSlug, setSelectedSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('post');
  });
  const selectedPost = selectedSlug ? sortedPosts.find((post) => post.slug === selectedSlug) ?? null : null;

  const filteredPosts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return sortedPosts;
    }

    return sortedPosts.filter((post) => {
      return [post.title, post.excerpt, post.body]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    });
  }, [searchTerm, sortedPosts]);

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / POSTS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filteredPosts.slice((safePage - 1) * POSTS_PER_PAGE, safePage * POSTS_PER_PAGE);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    }
    if (safePage > 1) {
      params.set('page', String(safePage));
    }
    if (selectedSlug) {
      params.set('post', selectedSlug);
    }

    const query = params.toString();
    const baseUrl = buildPath('/renungan');
    const nextUrl = query ? `${baseUrl}?${query}` : baseUrl;
    window.history.replaceState({}, '', nextUrl);
  }, [buildPath, searchTerm, safePage, selectedSlug]);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedSlug(params.get('post'));
      setSearchTerm(params.get('q') ?? '');
      setPage(Number(params.get('page') ?? '1') || 1);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const openPost = (post: BlogItem) => setSelectedSlug(post.slug);

  const clearDetail = () => setSelectedSlug(null);

  return (
    <div className="site-shell blog-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div>
            <div className="eyebrow">Renungan</div>
            <div className="brand-name">{content.siteName}</div>
            <div className="brand-tagline">Artikel, renungan, dan video singkat</div>
          </div>
        </div>
        <nav className="nav-links">
          <button className="nav-button" type="button" onClick={() => onNavigate('/')}>
            {content.navigation.home}
          </button>
          <button className="nav-button" type="button" onClick={() => onNavigate('/admin')}>
            {content.navigation.admin}
          </button>
        </nav>
      </header>

      <main>
        <section className="section blog-hero">
          <div>
            <span className="section-label">Blog</span>
            <h1>Renungan, artikel, dan video singkat dari gembala</h1>
            <p>
              Halaman ini menampilkan posting terbaru di bagian atas. Pengunjung dapat mencari postingan dan membuka detail tiap artikel.
            </p>
          </div>
          <div className="blog-hero-card">
            <strong>{sortedPosts.length} posting</strong>
            <span>{filteredPosts.length} hasil sesuai pencarian</span>
          </div>
        </section>

        {selectedPost ? (
          <section className="section blog-detail">
            <button className="button secondary" type="button" onClick={clearDetail}>
              Kembali ke daftar
            </button>
            <div className="detail-layout">
              <article className="detail-card">
                <div className="detail-headline">
                  <div className="post-type">Renungan</div>
                  <h2>{selectedPost.title}</h2>
                  <div className="post-meta detail-meta">
                    <span>{selectedPost.date}</span>
                    <span>{formatDate(selectedPost.publishedAt)}</span>
                  </div>
                </div>
                <div className="detail-media">{selectedPost.mediaLabel}</div>
                <p className="detail-excerpt">{selectedPost.excerpt}</p>
                <div className="detail-body" dangerouslySetInnerHTML={{ __html: selectedPost.body }} />
                {selectedPost.pdfUrl ? (
                  <div className="pdf-viewer-card">
                    <div className="group-header">
                      <h3>Lampiran Renungan (PDF)</h3>
                      <a className="button secondary" href={selectedPost.pdfUrl} target="_blank" rel="noreferrer">
                        Download PDF
                      </a>
                    </div>
                    <div className="pdf-viewer-meta">
                      <span>{selectedPost.pdfOriginalName || 'Dokumen Renungan'}</span>
                      <span>{selectedPost.pdfSizeBytes ? `${Math.max(1, Math.round(selectedPost.pdfSizeBytes / 1024))} KB` : ''}</span>
                    </div>
                    <iframe title={`PDF ${selectedPost.title}`} src={selectedPost.pdfUrl} className="pdf-iframe" />
                  </div>
                ) : null}
              </article>

              <aside className="detail-sidebar">
                <div className="sidebar-card">
                  <span className="section-label">Bagikan</span>
                  <h3>Kirim posting ini ke jemaat</h3>
                  <p>Gunakan detail post untuk dibagikan ke grup komunitas atau media sosial.</p>
                </div>
                <div className="sidebar-card">
                  <span className="section-label">Posting lain</span>
                  <div className="related-list">
                    {sortedPosts
                      .filter((post) => post.title !== selectedPost.title)
                      .slice(0, 3)
                      .map((post) => (
                        <button className="related-item" key={post.title} type="button" onClick={() => openPost(post)}>
                          <strong>{post.title}</strong>
                          <span>Renungan</span>
                        </button>
                      ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <>
            <section className="section blog-toolbar">
              <label className="blog-search">
                <span>Cari posting</span>
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari renungan, artikel, atau video..."
                />
              </label>
              <div className="blog-summary">
                <span>Menampilkan {pageItems.length} dari {filteredPosts.length} posting</span>
              </div>
            </section>

            <section className="section">
              <div className="post-grid">
                {pageItems.map((post) => (
                  <article className="post-card clickable" key={`${post.title}-${post.publishedAt}`} onClick={() => openPost(post)}>
                    <div className="post-media">{post.mediaLabel}</div>
                    <div className="post-body">
                      <span className="post-type">Renungan</span>
                      {post.pdfUrl ? <span className="post-file-pill">PDF</span> : null}
                      <h3>{post.title}</h3>
                      <p>{post.excerpt}</p>
                      <div className="post-meta">
                        <span>{post.date}</span>
                        <span>{formatDate(post.publishedAt)}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="pagination">
                <button className="button secondary" type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  Sebelumnya
                </button>
                <div className="pagination-info">
                  Halaman {safePage} dari {totalPages}
                </div>
                <button className="button secondary" type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  Berikutnya
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function AdminPage({
  content,
  onChange,
  onReset,
  onNavigate,
}: {
  content: Content;
  onChange: (value: Content) => void;
  onReset: () => void;
  onNavigate: (path: string) => void;
}) {
  const [statusMessage, setStatusMessage] = useState('');
  const [activeSection, setActiveSection] = useState<'konten' | 'renungan'>('konten');
  const updateTagline = (value: string) => onChange({ ...content, tagline: value });
  const updateMission = (value: string) => onChange({ ...content, mission: value });
  const updateHero = (patch: Partial<Content['hero']>) => onChange({ ...content, hero: { ...content.hero, ...patch } });
  const updateContact = (patch: Partial<Content['contact']>) => onChange({ ...content, contact: { ...content.contact, ...patch } });
  const updateAbout = (patch: Partial<Content['about']>) => onChange({ ...content, about: { ...content.about, ...patch } });
  const updateFooter = (patch: Partial<Content['footer']>) => onChange({ ...content, footer: { ...content.footer, ...patch } });
  const updateFounder = (patch: Partial<Content['founder']>) => onChange({ ...content, founder: { ...content.founder, ...patch } });

  const updateArrayItem = <T,>(items: T[], index: number, patch: Partial<T>) => {
    return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
  };

  const addHighlight = () =>
    onChange({
      ...content,
      highlights: [...content.highlights, { label: 'New Highlight', value: '0', note: 'Replace this text' }],
    });

  const addMinistry = () =>
    onChange({
      ...content,
      ministries: [...content.ministries, { name: 'New Ministry', description: 'Replace this text', meeting: 'TBD' }],
    });

  const addEvent = () =>
    onChange({
      ...content,
      events: [...content.events, { date: 'TBD', title: 'New Event', time: 'TBD', location: 'TBD', description: 'Replace this text' }],
    });

  const addSermon = () =>
    onChange({
      ...content,
      sermons: [...content.sermons, { title: 'New Sermon', speaker: 'Speaker', duration: '0 menit', description: 'Replace this text', videoLabel: 'Video Placeholder' }],
    });

  const addPost = () =>
    onChange({
      ...content,
      posts: [
        ...content.posts,
        {
          type: 'Renungan',
          status: 'draft',
          title: 'Judul Baru',
          date: 'TBD',
          excerpt: 'Isi ringkas',
          mediaLabel: 'Preview',
          publishedAt: new Date().toISOString(),
          body: 'Tulis isi posting di sini.',
        },
      ],
    });

  const removePost = (index: number) => {
    onChange({
      ...content,
      posts: content.posts.filter((_, itemIndex) => itemIndex !== index),
    });
    setStatusMessage('Posting dihapus.');
  };

  const togglePostStatus = (index: number) => {
    const nextStatus = content.posts[index]?.status === 'published' ? 'draft' : 'published';
    onChange({
      ...content,
      posts: updateArrayItem(content.posts, index, { status: nextStatus }),
    });
    setStatusMessage(nextStatus === 'published' ? 'Posting dipublikasikan.' : 'Posting dijadikan draft.');
  };

  const focusPost = (index: number) => {
    const element = document.getElementById(`post-admin-${index}`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setStatusMessage('Silakan edit posting pada kartu yang dipilih.');
  };

  const exportContent = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nlc-content.json';
    anchor.click();
    window.URL.revokeObjectURL(url);
    setStatusMessage('Konten berhasil diexport ke JSON.');
  };

  const importContent = (file: File | undefined) => {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Content;
        onChange({
          ...defaultContent,
          ...parsed,
          tagline: parsed.tagline ?? defaultContent.tagline,
          mission: parsed.mission ?? defaultContent.mission,
          hero: { ...defaultContent.hero, ...parsed.hero },
          navigation: mergeNavigation(parsed.navigation as LegacyNavigation),
          about: { ...defaultContent.about, ...parsed.about },
          contact: { ...defaultContent.contact, ...parsed.contact },
          founder: { ...defaultContent.founder, ...parsed.founder },
          footer: {
            ...defaultContent.footer,
            ...parsed.footer,
            columns: parsed.footer?.columns?.length ? parsed.footer.columns : defaultContent.footer.columns,
          },
          highlights: parsed.highlights?.length ? parsed.highlights : defaultContent.highlights,
          ministries: parsed.ministries?.length ? parsed.ministries : defaultContent.ministries,
          events: parsed.events?.length ? parsed.events : defaultContent.events,
          sermons: parsed.sermons?.length ? parsed.sermons : defaultContent.sermons,
          posts: parsed.posts?.length ? parsed.posts.map(normalizePost) : defaultContent.posts,
          locations: parsed.locations?.length ? parsed.locations : defaultContent.locations,
        });
        setStatusMessage('Konten berhasil diimpor dari JSON.');
      } catch {
        setStatusMessage('File JSON tidak valid.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <span className="section-label">Admin Panel</span>
          <h1>Edit dummy content</h1>
          <p>Konten utama tetap disimpan di localStorage browser, sedangkan menu Renungan memakai MySQL lewat API.</p>
          {statusMessage ? <p className="admin-status">{statusMessage}</p> : null}
        </div>
        <div className="admin-actions">
          <button className="button primary" type="button" onClick={() => window.open(LIVE_DOMAIN_URL, '_blank', 'noopener,noreferrer')}>
            LIVE
          </button>
          <button className="button secondary" type="button" onClick={exportContent}>
            Export JSON
          </button>
          <label className="button secondary file-button" htmlFor="content-import">
            Import JSON
          </label>
          <input
            id="content-import"
            className="file-input"
            type="file"
            accept="application/json"
            onChange={(event) => importContent(event.target.files?.[0])}
          />
          <button className="button secondary" type="button" onClick={() => onNavigate('/')}>
            Lihat Website
          </button>
          <button className="button danger" type="button" onClick={onReset}>
            Reset Dummy
          </button>
        </div>
      </header>

      <div className="admin-menu">
        <button className={activeSection === 'konten' ? 'admin-menu-button active' : 'admin-menu-button'} type="button" onClick={() => setActiveSection('konten')}>
          Konten
        </button>
        <button className={activeSection === 'renungan' ? 'admin-menu-button active' : 'admin-menu-button'} type="button" onClick={() => setActiveSection('renungan')}>
          Renungan
        </button>
      </div>

      {activeSection === 'renungan' ? <RenunganAdminPanel fallbackPosts={content.posts} onStatusMessage={setStatusMessage} /> : null}

      <div className="admin-grid" style={activeSection === 'renungan' ? { display: 'none' } : undefined}>
        <section className="panel form-panel">
          <h2>Konten Utama</h2>
          <label>
            Nama Website
            <input value={content.siteName} onChange={(event) => onChange({ ...content, siteName: event.target.value })} />
          </label>
          <label>
            Tagline
            <input value={content.tagline} onChange={(event) => updateTagline(event.target.value)} />
          </label>
          <label>
            Mission Statement
            <textarea value={content.mission} onChange={(event) => updateMission(event.target.value)} rows={3} />
          </label>

          <div className="form-group">
            <h3>Hero</h3>
            <label>
              Badge
              <input value={content.hero.badge} onChange={(event) => updateHero({ badge: event.target.value })} />
            </label>
            <label>
              Judul
              <textarea value={content.hero.title} onChange={(event) => updateHero({ title: event.target.value })} rows={3} />
            </label>
            <label>
              Subtitle
              <textarea value={content.hero.subtitle} onChange={(event) => updateHero({ subtitle: event.target.value })} rows={4} />
            </label>
            <div className="dual-inputs">
              <label>
                CTA Utama
                <input value={content.hero.primaryCta} onChange={(event) => updateHero({ primaryCta: event.target.value })} />
              </label>
              <label>
                CTA Kedua
                <input value={content.hero.secondaryCta} onChange={(event) => updateHero({ secondaryCta: event.target.value })} />
              </label>
            </div>
            <label>
              Teks Media Utama
              <input value={content.hero.mediaTitle} onChange={(event) => updateHero({ mediaTitle: event.target.value })} />
            </label>
            <label>
              Deskripsi Media
              <textarea value={content.hero.mediaDescription} onChange={(event) => updateHero({ mediaDescription: event.target.value })} rows={3} />
            </label>
          </div>

          <div className="form-group">
            <div className="group-header">
              <h3>Highlights</h3>
              <button className="mini-button" type="button" onClick={addHighlight}>Tambah</button>
            </div>
            {content.highlights.map((item, index) => (
              <div className="item-card" key={`${item.label}-${index}`}>
                <label>
                  Label
                  <input value={item.label} onChange={(event) => onChange({ ...content, highlights: updateArrayItem(content.highlights, index, { label: event.target.value }) })} />
                </label>
                <label>
                  Value
                  <input value={item.value} onChange={(event) => onChange({ ...content, highlights: updateArrayItem(content.highlights, index, { value: event.target.value }) })} />
                </label>
                <label>
                  Note
                  <input value={item.note} onChange={(event) => onChange({ ...content, highlights: updateArrayItem(content.highlights, index, { note: event.target.value }) })} />
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <h3>Tentang</h3>
            <label>
              Judul
              <input value={content.about.title} onChange={(event) => updateAbout({ title: event.target.value })} />
            </label>
            <label>
              Deskripsi
              <textarea value={content.about.description} onChange={(event) => updateAbout({ description: event.target.value })} rows={4} />
            </label>
            <label>
              Poin, satu per baris
              <textarea
                value={content.about.points.join('\n')}
                onChange={(event) => updateAbout({ points: event.target.value.split('\n').filter(Boolean) })}
                rows={4}
              />
            </label>
          </div>

          <div className="form-group">
            <div className="group-header">
              <h3>Pelayanan</h3>
              <button className="mini-button" type="button" onClick={addMinistry}>Tambah</button>
            </div>
            {content.ministries.map((ministry, index) => (
              <div className="item-card" key={`${ministry.name}-${index}`}>
                <label>
                  Nama
                  <input value={ministry.name} onChange={(event) => onChange({ ...content, ministries: updateArrayItem(content.ministries, index, { name: event.target.value }) })} />
                </label>
                <label>
                  Deskripsi
                  <textarea value={ministry.description} onChange={(event) => onChange({ ...content, ministries: updateArrayItem(content.ministries, index, { description: event.target.value }) })} rows={3} />
                </label>
                <label>
                  Jadwal
                  <input value={ministry.meeting} onChange={(event) => onChange({ ...content, ministries: updateArrayItem(content.ministries, index, { meeting: event.target.value }) })} />
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <div className="group-header">
              <h3>Agenda</h3>
              <button className="mini-button" type="button" onClick={addEvent}>Tambah</button>
            </div>
            {content.events.map((event, index) => (
              <div className="item-card" key={`${event.title}-${index}`}>
                <label>
                  Tanggal
                  <input value={event.date} onChange={(evt) => onChange({ ...content, events: updateArrayItem(content.events, index, { date: evt.target.value }) })} />
                </label>
                <label>
                  Judul
                  <input value={event.title} onChange={(evt) => onChange({ ...content, events: updateArrayItem(content.events, index, { title: evt.target.value }) })} />
                </label>
                <label>
                  Jam
                  <input value={event.time} onChange={(evt) => onChange({ ...content, events: updateArrayItem(content.events, index, { time: evt.target.value }) })} />
                </label>
                <label>
                  Lokasi
                  <input value={event.location} onChange={(evt) => onChange({ ...content, events: updateArrayItem(content.events, index, { location: evt.target.value }) })} />
                </label>
                <label>
                  Deskripsi
                  <textarea value={event.description} onChange={(evt) => onChange({ ...content, events: updateArrayItem(content.events, index, { description: evt.target.value }) })} rows={3} />
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <div className="group-header">
              <h3>Media</h3>
              <button className="mini-button" type="button" onClick={addSermon}>Tambah</button>
            </div>
            {content.sermons.map((sermon, index) => (
              <div className="item-card" key={`${sermon.title}-${index}`}>
                <label>
                  Judul
                  <input value={sermon.title} onChange={(evt) => onChange({ ...content, sermons: updateArrayItem(content.sermons, index, { title: evt.target.value }) })} />
                </label>
                <label>
                  Pembicara
                  <input value={sermon.speaker} onChange={(evt) => onChange({ ...content, sermons: updateArrayItem(content.sermons, index, { speaker: evt.target.value }) })} />
                </label>
                <label>
                  Durasi
                  <input value={sermon.duration} onChange={(evt) => onChange({ ...content, sermons: updateArrayItem(content.sermons, index, { duration: evt.target.value }) })} />
                </label>
                <label>
                  Label Video
                  <input value={sermon.videoLabel} onChange={(evt) => onChange({ ...content, sermons: updateArrayItem(content.sermons, index, { videoLabel: evt.target.value }) })} />
                </label>
                <label>
                  Deskripsi
                  <textarea value={sermon.description} onChange={(evt) => onChange({ ...content, sermons: updateArrayItem(content.sermons, index, { description: evt.target.value }) })} rows={3} />
                </label>
              </div>
            ))}
          </div>

          <div className="form-group">
            <h3>Renungan</h3>
            <p>Klik menu Renungan di atas untuk membuka HTML editor berbasis MySQL.</p>
          </div>

          <div className="form-group">
            <h3>Kontak</h3>
            <label>
              Judul
              <input value={content.contact.title} onChange={(event) => updateContact({ title: event.target.value })} />
            </label>
            <label>
              Deskripsi
              <textarea value={content.contact.description} onChange={(event) => updateContact({ description: event.target.value })} rows={3} />
            </label>
            <label>
              Alamat
              <input value={content.contact.address} onChange={(event) => updateContact({ address: event.target.value })} />
            </label>
            <div className="dual-inputs">
              <label>
                Telepon
                <input value={content.contact.phone} onChange={(event) => updateContact({ phone: event.target.value })} />
              </label>
              <label>
                Email
                <input value={content.contact.email} onChange={(event) => updateContact({ email: event.target.value })} />
              </label>
            </div>
            <label>
              CTA
              <input value={content.contact.cta} onChange={(event) => updateContact({ cta: event.target.value })} />
            </label>
          </div>

          <div className="form-group">
            <h3>Footer</h3>
            <label>
              Note
              <input value={content.footer.note} onChange={(event) => updateFooter({ note: event.target.value })} />
            </label>
            <label>
              Legal
              <input value={content.footer.legal} onChange={(event) => updateFooter({ legal: event.target.value })} />
            </label>
            <label>
              Footer columns, format: title|item1,item2
              <textarea
                value={content.footer.columns.map((column) => `${column.title}|${column.items.join(',')}`).join('\n')}
                onChange={(event) =>
                  updateFooter({
                    columns: event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [title, items] = line.split('|');
                        return {
                          title: title?.trim() || 'Section',
                          items: (items || '')
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        };
                      }),
                  })
                }
                rows={6}
              />
            </label>
          </div>

          <div className="form-group">
            <h3>Founder</h3>
            <label>
              Label
              <input value={content.founder.label} onChange={(event) => updateFounder({ label: event.target.value })} />
            </label>
            <label>
              Nama
              <input value={content.founder.name} onChange={(event) => updateFounder({ name: event.target.value })} />
            </label>
            <label>
              Bio
              <textarea value={content.founder.bio} onChange={(event) => updateFounder({ bio: event.target.value })} rows={4} />
            </label>
          </div>

          <div className="form-group">
            <h3>Locations</h3>
            <label>
              Lokasi per baris, format: region|name|address
              <textarea
                value={content.locations.map((location) => `${location.region}|${location.name}|${location.address}`).join('\n')}
                onChange={(event) =>
                  onChange({
                    ...content,
                    locations: event.target.value
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean)
                      .map((line) => {
                        const [region, name, address] = line.split('|');
                        return {
                          region: region?.trim() || 'Region',
                          name: name?.trim() || 'Church',
                          address: address?.trim() || 'Address',
                        };
                      }),
                  })
                }
                rows={5}
              />
            </label>
          </div>
        </section>

        <aside className="panel preview-panel">
          <h2>Preview</h2>
          <div className="preview-card">
            <span className="pill">{content.hero.badge}</span>
            <h3>{content.hero.title}</h3>
            <p>{content.hero.subtitle}</p>
          </div>
          <div className="preview-list">
            {content.highlights.map((item) => (
              <div className="preview-row" key={item.label}>
                <strong>{item.label}</strong>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="preview-card small">
            <strong>{content.contact.title}</strong>
            <p>{content.contact.address}</p>
            <p>{content.contact.phone}</p>
            <p>{content.contact.email}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;