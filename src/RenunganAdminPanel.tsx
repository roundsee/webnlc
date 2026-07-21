import { useEffect, useMemo, useState } from 'react';
import { type Post } from './content';
import { QuillEditor } from './QuillEditor';
import {
  deleteRenunganPost,
  emptyRenunganDraft,
  fetchRenunganPosts,
  saveRenunganPost,
  slugifyRenungan,
  uploadRenunganPdf,
  type RenunganDraft,
  type RenunganPost,
} from './renunganApi';

type Props = {
  fallbackPosts: Post[];
  onStatusMessage: (value: string) => void;
};

function toDraftFromLegacy(post: Post): RenunganDraft {
  return {
    id: undefined,
    slug: slugifyRenungan(post.title),
    title: post.title,
    excerpt: post.excerpt,
    htmlContent: `<p>${post.body
      .split('\n')
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .join('</p><p>')}</p>`,
    status: post.status,
    publishedAt: post.publishedAt,
  };
}

function toDraftFromApi(post: RenunganPost): RenunganDraft {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    htmlContent: post.htmlContent,
    status: post.status,
    publishedAt: post.publishedAt,
    pdfUrl: post.pdfUrl,
    pdfOriginalName: post.pdfOriginalName,
    pdfSizeBytes: post.pdfSizeBytes,
    pdfMimeType: post.pdfMimeType,
  };
}

function toDateTimeLocal(value: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }

  return date.toISOString();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function RenunganAdminPanel({ fallbackPosts, onStatusMessage }: Props) {
  const [posts, setPosts] = useState<RenunganPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'api' | 'fallback'>('api');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<RenunganDraft>(emptyRenunganDraft);
  const [searchTerm, setSearchTerm] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [pendingPdf, setPendingPdf] = useState<File | null>(null);

  useEffect(() => {
    let active = true;

    fetchRenunganPosts('all')
      .then((result) => {
        if (!active) {
          return;
        }

        setPosts(result);
        setSource('api');
        setLoading(false);
        if (result.length > 0) {
          const first = result[0];
          setSelectedId(first.id);
          setDraft(toDraftFromApi(first));
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        const fallback = fallbackPosts.map(toDraftFromLegacy).map((item, index) => ({
          ...item,
          id: index + 1,
          title: item.title,
        })) as RenunganDraft[];

        const convertedFallback: RenunganPost[] = fallback.map((item, index) => ({
          id: index + 1,
          slug: item.slug,
          title: item.title,
          excerpt: item.excerpt,
          htmlContent: item.htmlContent,
          status: item.status,
          publishedAt: item.publishedAt,
          pdfUrl: '',
          pdfOriginalName: '',
          pdfSizeBytes: 0,
          pdfMimeType: '',
          createdAt: item.publishedAt,
          updatedAt: item.publishedAt,
        }));

        setPosts(convertedFallback);
        setSource('fallback');
        setLoading(false);
        if (convertedFallback.length > 0) {
          const first = convertedFallback[0];
          setSelectedId(first.id);
          setDraft(toDraftFromApi(first));
        }
        setLocalMessage('Backend MySQL belum tersedia, memakai data fallback sementara.');
      });

    return () => {
      active = false;
    };
  }, [fallbackPosts]);

  const filteredPosts = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return posts;
    }

    return posts.filter((post) => [post.title, post.excerpt, post.htmlContent, post.slug, post.status]
      .join(' ')
      .toLowerCase()
      .includes(normalized));
  }, [posts, searchTerm]);

  const selectedPost = selectedId ? posts.find((post) => post.id === selectedId) ?? null : null;

  useEffect(() => {
    if (!selectedPost) {
      return;
    }

    setDraft(toDraftFromApi(selectedPost));
  }, [selectedPost]);

  const updateDraft = (patch: Partial<RenunganDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const selectPost = (post: RenunganPost) => {
    setSelectedId(post.id);
    setDraft(toDraftFromApi(post));
    setPendingPdf(null);
    setLocalMessage(`Membuka "${post.title}".`);
  };

  const createNewPost = () => {
    setSelectedId(null);
    setDraft(emptyRenunganDraft);
    setPendingPdf(null);
    setLocalMessage('Renungan baru siap diisi.');
  };

  const saveDraft = async (nextStatus: RenunganDraft['status'] = draft.status) => {
    try {
      const saved = await saveRenunganPost({
        ...draft,
        slug: draft.slug || slugifyRenungan(draft.title),
        status: nextStatus,
        publishedAt: fromDateTimeLocal(toDateTimeLocal(draft.publishedAt)),
      });
      setPosts((current) => {
        const index = current.findIndex((post) => post.id === saved.id);
        if (index >= 0) {
          return current.map((post) => (post.id === saved.id ? saved : post));
        }

        return [saved, ...current];
      });
      setSelectedId(saved.id);
      setDraft(toDraftFromApi(saved));
      const message = saved.status === 'published' ? 'Renungan dipublikasikan.' : 'Renungan disimpan sebagai draft.';
      setLocalMessage(message);
      onStatusMessage(message);
    } catch {
      const message = 'Gagal menyimpan renungan ke MySQL.';
      setLocalMessage(message);
      onStatusMessage(message);
    }
  };

  const deleteCurrentPost = async () => {
    if (!selectedId) {
      return;
    }

    try {
      await deleteRenunganPost(selectedId);
      const nextPosts = posts.filter((post) => post.id !== selectedId);
      setPosts(nextPosts);
      setSelectedId(nextPosts[0]?.id ?? null);
      setDraft(nextPosts[0] ? toDraftFromApi(nextPosts[0]) : emptyRenunganDraft);
      const message = 'Renungan dihapus.';
      setLocalMessage(message);
      onStatusMessage(message);
    } catch {
      const message = 'Gagal menghapus renungan.';
      setLocalMessage(message);
      onStatusMessage(message);
    }
  };

  const toggleStatus = async (post: RenunganPost) => {
    try {
      const saved = await saveRenunganPost({
        id: post.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        htmlContent: post.htmlContent,
        status: post.status === 'published' ? 'draft' : 'published',
        publishedAt: post.publishedAt,
      });
      setPosts((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      if (selectedId === saved.id) {
        setDraft(toDraftFromApi(saved));
      }
      const message = saved.status === 'published' ? 'Renungan dipublikasikan.' : 'Renungan dijadikan draft.';
      setLocalMessage(message);
      onStatusMessage(message);
    } catch {
      const message = 'Gagal mengubah status renungan.';
      setLocalMessage(message);
      onStatusMessage(message);
    }
  };

  const uploadPdf = async () => {
    if (!selectedId || !pendingPdf) {
      const message = 'Pilih post renungan dan file PDF terlebih dulu.';
      setLocalMessage(message);
      onStatusMessage(message);
      return;
    }

    try {
      const saved = await uploadRenunganPdf(selectedId, pendingPdf);
      setPosts((current) => current.map((item) => (item.id === saved.id ? saved : item)));
      if (selectedId === saved.id) {
        setDraft(toDraftFromApi(saved));
      }
      setPendingPdf(null);
      const message = 'PDF renungan berhasil diupload.';
      setLocalMessage(message);
      onStatusMessage(message);
    } catch {
      const message = 'Gagal upload PDF renungan.';
      setLocalMessage(message);
      onStatusMessage(message);
    }
  };

  return (
    <section className="panel renungan-panel">
      <div className="renungan-header">
        <div>
          <span className="section-label">Renungan CMS</span>
          <h2>Rich Text Editor</h2>
          <p>
            Kelola renungan yang tersimpan di MySQL. Tulis isi artikel dengan editor visual, lalu publikasikan dari panel ini.
          </p>
          <div className="renungan-meta">
            <span>{loading ? 'Memuat data...' : `${posts.length} post`}</span>
            <span>{source === 'api' ? 'Sumber: MySQL' : 'Sumber: fallback lokal'}</span>
          </div>
          {localMessage ? <p className="admin-status">{localMessage}</p> : null}
        </div>
        <div className="renungan-header-actions">
          <button className="button secondary" type="button" onClick={createNewPost}>
            Renungan Baru
          </button>
          <button className="button secondary" type="button" onClick={() => saveDraft()}>
            Simpan
          </button>
          <button className="button primary" type="button" onClick={() => saveDraft('published')}>
            Publikasikan
          </button>
          <button className="button danger" type="button" onClick={deleteCurrentPost} disabled={selectedId === null}>
            Hapus
          </button>
        </div>
      </div>

      <div className="renungan-layout">
        <aside className="renungan-list-panel">
          <label className="renungan-search">
            <span>Cari renungan</span>
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Cari judul, slug, atau isi..." />
          </label>
          <div className="renungan-list">
            {filteredPosts.map((post) => (
              <article className={post.id === selectedId ? 'renungan-item active' : 'renungan-item'} key={post.id}>
                <button className="renungan-item-main" type="button" onClick={() => selectPost(post)}>
                  <span className={`status-pill ${post.status === 'published' ? 'published' : 'draft'}`}>
                    {post.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <strong>{post.title}</strong>
                  <span>{post.slug}</span>
                  <small>{post.excerpt}</small>
                </button>
                <div className="renungan-item-actions">
                  <button className="mini-button" type="button" onClick={() => toggleStatus(post)}>
                    {post.status === 'published' ? 'Draftkan' : 'Publish'}
                  </button>
                  <button className="mini-button" type="button" onClick={() => selectPost(post)}>
                    Edit
                  </button>
                </div>
              </article>
            ))}
            {!loading && filteredPosts.length === 0 ? <div className="empty-state">Belum ada renungan yang cocok dengan pencarian.</div> : null}
          </div>
        </aside>

        <section className="renungan-editor-panel">
          <div className="editor-grid">
            <label>
              Judul
              <input
                value={draft.title}
                onChange={(event) => {
                  const nextTitle = event.target.value;
                  setDraft((previous) => {
                    const shouldUpdateSlug = !previous.slug || previous.slug === slugifyRenungan(previous.title);
                    return {
                      ...previous,
                      title: nextTitle,
                      slug: shouldUpdateSlug ? slugifyRenungan(nextTitle) : previous.slug,
                    };
                  });
                }}
              />
            </label>
            <label>
              Slug
              <input value={draft.slug} onChange={(event) => updateDraft({ slug: event.target.value })} />
            </label>
            <label>
              Status
              <select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as RenunganDraft['status'] })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
            <label>
              Published At
              <input type="datetime-local" value={toDateTimeLocal(draft.publishedAt)} onChange={(event) => updateDraft({ publishedAt: fromDateTimeLocal(event.target.value) })} />
            </label>
          </div>

          <label>
            Ringkasan
            <textarea value={draft.excerpt} onChange={(event) => updateDraft({ excerpt: event.target.value })} rows={3} />
          </label>

          <div className="pdf-upload-card">
            <div className="group-header">
              <h3>Lampiran PDF</h3>
              {draft.pdfUrl ? (
                <a className="mini-button" href={draft.pdfUrl} target="_blank" rel="noreferrer">
                  Preview PDF
                </a>
              ) : null}
            </div>
            <label>
              Upload PDF Renungan
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setPendingPdf(event.target.files?.[0] ?? null)}
              />
            </label>
            <div className="pdf-upload-actions">
              <button className="mini-button" type="button" onClick={uploadPdf} disabled={!selectedId || !pendingPdf}>
                Upload PDF
              </button>
              {pendingPdf ? <span>{pendingPdf.name}</span> : <span>Belum ada file dipilih.</span>}
            </div>
            {draft.pdfUrl ? (
              <div className="pdf-meta">
                <strong>{draft.pdfOriginalName || 'Lampiran PDF'}</strong>
                <span>{draft.pdfSizeBytes ? `${Math.max(1, Math.round(draft.pdfSizeBytes / 1024))} KB` : 'Ukuran tidak tersedia'}</span>
                <a href={draft.pdfUrl} target="_blank" rel="noreferrer">
                  Download
                </a>
              </div>
            ) : (
              <p>Belum ada lampiran PDF untuk post ini.</p>
            )}
          </div>

          <div className="quill-field">
            <span>Konten Renungan</span>
            <QuillEditor value={draft.htmlContent} onChange={(value) => updateDraft({ htmlContent: value })} />
          </div>

          <div className="editor-preview-card">
            <div className="group-header">
              <h3>Preview</h3>
              <span className={`status-pill ${draft.status === 'published' ? 'published' : 'draft'}`}>
                {draft.status === 'published' ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="preview-html" dangerouslySetInnerHTML={{ __html: draft.htmlContent || '<p>Preview kosong.</p>' }} />
            <p className="preview-excerpt">{stripHtml(draft.excerpt || draft.htmlContent)}</p>
          </div>
        </section>
      </div>
    </section>
  );
}
