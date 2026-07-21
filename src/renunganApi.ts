export type RenunganStatus = 'draft' | 'published';

export type RenunganPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  htmlContent: string;
  status: RenunganStatus;
  publishedAt: string;
  pdfUrl: string;
  pdfOriginalName: string;
  pdfSizeBytes: number;
  pdfMimeType: string;
  createdAt: string;
  updatedAt: string;
};

export type RenunganDraft = {
  id?: number;
  slug: string;
  title: string;
  excerpt: string;
  htmlContent: string;
  status: RenunganStatus;
  publishedAt: string;
  pdfUrl?: string;
  pdfOriginalName?: string;
  pdfSizeBytes?: number;
  pdfMimeType?: string;
};

export const emptyRenunganDraft: RenunganDraft = {
  slug: '',
  title: '',
  excerpt: '',
  htmlContent: '<p>Tulis isi renungan di sini.</p>',
  status: 'draft',
  publishedAt: new Date().toISOString(),
};

function toJsonHeaders() {
  return {
    'Content-Type': 'application/json',
  };
}

async function buildApiError(response: Response, fallbackMessage: string) {
  const statusLabel = `${response.status} ${response.statusText}`.trim();

  try {
    const rawBody = await response.text();

    if (rawBody) {
      try {
        const payload = JSON.parse(rawBody) as { message?: string; error?: string };
        const detail = [payload.message, payload.error].filter(Boolean).join(' | ');
        if (detail) {
          return new Error(`${detail} (HTTP ${statusLabel})`);
        }
      } catch {
        const compactBody = rawBody.replace(/\s+/g, ' ').trim().slice(0, 260);
        if (compactBody) {
          return new Error(`${fallbackMessage} (HTTP ${statusLabel}) Response: ${compactBody}`);
        }
      }
    }

    return new Error(`${fallbackMessage} (HTTP ${statusLabel})`);
  } catch {
    return new Error(`${fallbackMessage} (HTTP ${statusLabel})`);
  }
}

export function slugifyRenungan(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'renungan';
}

export async function fetchRenunganPosts(scope: 'public' | 'all' = 'public') {
  const response = await fetch(`/api/renungan?scope=${scope}`);
  if (!response.ok) {
    throw await buildApiError(response, 'Gagal memuat data renungan.');
  }

  return (await response.json()) as RenunganPost[];
}

export async function saveRenunganPost(post: RenunganDraft) {
  const payload = {
    slug: post.slug || slugifyRenungan(post.title),
    title: post.title,
    excerpt: post.excerpt,
    htmlContent: post.htmlContent,
    status: post.status,
    publishedAt: post.publishedAt,
  };

  const response = await fetch(post.id ? `/api/renungan/${post.id}` : '/api/renungan', {
    method: post.id ? 'PUT' : 'POST',
    headers: toJsonHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await buildApiError(response, 'Gagal menyimpan renungan.');
  }

  return (await response.json()) as RenunganPost;
}

export async function deleteRenunganPost(id: number) {
  const response = await fetch(`/api/renungan/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 204) {
    throw await buildApiError(response, 'Gagal menghapus renungan.');
  }
}

export async function uploadRenunganPdf(id: number, file: File) {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(`/api/renungan/${id}/pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await buildApiError(response, 'Gagal upload PDF renungan.');
  }

  return (await response.json()) as RenunganPost;
}