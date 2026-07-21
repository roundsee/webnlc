import cors from 'cors';
import express from 'express';
import mysql from 'mysql2/promise';
import multer from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 3001);
const mysqlHost = process.env.DB_HOST || 'localhost';
const mysqlPort = Number(process.env.DB_PORT || 3306);
const mysqlUser = process.env.DB_USER || process.env.DB_USERNAME || 'root';
const mysqlPassword = process.env.DB_PASSWORD || 'test';
const databaseName = process.env.DB_NAME || process.env.DB_DATABASE || 'db_nlc';
const serverDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = process.env.APP_ROOT ? path.resolve(process.env.APP_ROOT) : path.resolve(serverDir, '..');
const uploadsBasePath = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(appRoot, 'uploads');

const schemaSql = `
CREATE TABLE IF NOT EXISTS renungan_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  html_content LONGTEXT NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  pdf_path VARCHAR(500) NULL,
  pdf_original_name VARCHAR(255) NULL,
  pdf_size_bytes BIGINT NULL,
  pdf_mime_type VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const uploadsPath = path.join(uploadsBasePath, 'renungan');
mkdirSync(uploadsPath, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsPath),
    filename: (_req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname
        .toLowerCase()
        .replace(/[^a-z0-9.-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const finalName = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;
      cb(null, `${timestamp}-${finalName}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    cb(isPdf ? null : new Error('Hanya file PDF yang diperbolehkan.'), isPdf);
  },
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '12mb' }));

let pool;

function normalizeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'renungan';
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toMysqlDateTime(value) {
  const iso = toIsoString(value);
  if (!iso) {
    return null;
  }

  return iso.slice(0, 19).replace('T', ' ');
}

function mapRow(row) {
  const pdfPath = row.pdf_path || '';
  return {
    id: Number(row.id),
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    htmlContent: row.html_content,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : '',
    pdfUrl: pdfPath ? `/uploads/renungan/${pdfPath}` : '',
    pdfOriginalName: row.pdf_original_name || '',
    pdfSizeBytes: row.pdf_size_bytes ? Number(row.pdf_size_bytes) : 0,
    pdfMimeType: row.pdf_mime_type || '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
  };
}

async function bootstrapDatabase() {
  const adminPool = mysql.createPool({
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: true,
  });

  try {
    await adminPool.query(
      `CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`,
    );
  } catch (error) {
    console.warn('Skip CREATE DATABASE step:', String(error));
  }
  await adminPool.end();

  pool = mysql.createPool({
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: databaseName,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true,
  });

  await pool.query(schemaSql);

  const addColumnIfMissing = async (columnName, ddlType) => {
    const [rows] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'renungan_posts' AND COLUMN_NAME = ?
       LIMIT 1`,
      [databaseName, columnName],
    );

    if (!rows.length) {
      await pool.query(`ALTER TABLE renungan_posts ADD COLUMN ${columnName} ${ddlType}`);
    }
  };

  await addColumnIfMissing('pdf_path', 'VARCHAR(500) NULL');
  await addColumnIfMissing('pdf_original_name', 'VARCHAR(255) NULL');
  await addColumnIfMissing('pdf_size_bytes', 'BIGINT NULL');
  await addColumnIfMissing('pdf_mime_type', 'VARCHAR(120) NULL');
}

async function ensureUniqueSlug(baseSlug, excludeId = null) {
  const safeBase = normalizeSlug(baseSlug);
  let current = safeBase;
  let suffix = 2;

  while (true) {
    const [rows] = await pool.query(
      'SELECT id FROM renungan_posts WHERE slug = ? AND (? IS NULL OR id <> ?)',
      [current, excludeId, excludeId],
    );

    if (rows.length === 0) {
      return current;
    }

    current = `${safeBase}-${suffix}`;
    suffix += 1;
  }
}

async function upsertRenungan({ id, title, slug, excerpt, htmlContent, status, publishedAt }) {
  const resolvedSlug = await ensureUniqueSlug(slug || title, id ?? null);
  const resolvedPublishedAt = status === 'published' ? toMysqlDateTime(publishedAt) || toMysqlDateTime(new Date().toISOString()) : null;

  if (id) {
    const [updateResult] = await pool.query(
      `UPDATE renungan_posts
       SET slug = ?, title = ?, excerpt = ?, html_content = ?, status = ?, published_at = ?
       WHERE id = ?`,
      [resolvedSlug, title, excerpt, htmlContent, status, resolvedPublishedAt, id],
    );

    if (updateResult.affectedRows > 0) {
      const [rows] = await pool.query('SELECT * FROM renungan_posts WHERE id = ?', [id]);
      if (rows.length > 0) {
        return mapRow(rows[0]);
      }
    }
  }

  const [result] = await pool.query(
    `INSERT INTO renungan_posts (slug, title, excerpt, html_content, status, published_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [resolvedSlug, title, excerpt, htmlContent, status, resolvedPublishedAt],
  );

  const [rows] = await pool.query('SELECT * FROM renungan_posts WHERE id = ?', [result.insertId]);
  return mapRow(rows[0]);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/renungan', async (req, res) => {
  try {
    const scope = String(req.query.scope || 'public');
    const includeDrafts = scope === 'all';
    const [rows] = await pool.query(
      `SELECT * FROM renungan_posts ${includeDrafts ? '' : 'WHERE status = \'published\''} ORDER BY COALESCE(published_at, created_at) DESC, updated_at DESC`,
    );
    res.json(rows.map(mapRow));
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat renungan.', error: String(error) });
  }
});

app.get('/api/renungan/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM renungan_posts WHERE slug = ? LIMIT 1', [req.params.slug]);
    if (!rows.length) {
      res.status(404).json({ message: 'Renungan tidak ditemukan.' });
      return;
    }

    res.json(mapRow(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Gagal memuat detail renungan.', error: String(error) });
  }
});

app.post('/api/renungan', async (req, res) => {
  try {
    const created = await upsertRenungan(req.body || {});
    res.status(201).json(created);
  } catch (error) {
    res.status(500).json({ message: 'Gagal membuat renungan.', error: String(error) });
  }
});

app.put('/api/renungan/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await upsertRenungan({ id, ...req.body });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Gagal menyimpan renungan.', error: String(error) });
  }
});

app.delete('/api/renungan/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM renungan_posts WHERE id = ?', [Number(req.params.id)]);
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus renungan.', error: String(error) });
  }
});

app.post('/api/renungan/:id/pdf', upload.single('pdf'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!req.file) {
      res.status(400).json({ message: 'File PDF belum dipilih.' });
      return;
    }

    await pool.query(
      `UPDATE renungan_posts
       SET pdf_path = ?, pdf_original_name = ?, pdf_size_bytes = ?, pdf_mime_type = ?
       WHERE id = ?`,
      [req.file.filename, req.file.originalname, req.file.size, req.file.mimetype, id],
    );

    const [rows] = await pool.query('SELECT * FROM renungan_posts WHERE id = ?', [id]);
    if (!rows.length) {
      res.status(404).json({ message: 'Renungan tidak ditemukan.' });
      return;
    }

    res.json(mapRow(rows[0]));
  } catch (error) {
    res.status(500).json({ message: 'Gagal upload PDF renungan.', error: String(error) });
  }
});

// Handle known upload errors with clear messages for clients/admin panel.
app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ message: 'Ukuran file PDF maksimal 20MB.' });
      return;
    }

    res.status(400).json({ message: 'Upload gagal.', error: error.message });
    return;
  }

  if (error instanceof Error && error.message === 'Hanya file PDF yang diperbolehkan.') {
    res.status(400).json({ message: error.message });
    return;
  }

  next(error);
});

const distPath = path.join(appRoot, 'dist');

app.use('/uploads', express.static(uploadsBasePath));

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

bootstrapDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`App root: ${appRoot}`);
      console.log(`Uploads path: ${uploadsPath}`);
      console.log(`Renungan API listening on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });