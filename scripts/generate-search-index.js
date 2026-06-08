const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const OUT_DIR = path.join(process.cwd(), 'public');
const OUT_FILE = path.join(OUT_DIR, 'search-index.json');

function listSections() {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs.readdirSync(CONTENT_DIR).filter((f) => fs.statSync(path.join(CONTENT_DIR, f)).isDirectory());
}

function slugify(name) {
  return name.replace(/\.mdx?$/i, '');
}

function stripMarkdown(md) {
  // remove code fences
  let s = md.replace(/```[\s\S]*?```/g, ' ');
  // remove JSX/HTML tags
  s = s.replace(/<[^>]+>/g, ' ');
  // remove inline math delimiters
  s = s.replace(/\$\$[\s\S]*?\$\$/g, ' ');
  s = s.replace(/\$[^\$\n]+\$/g, ' ');
  // strip remaining backticks
  s = s.replace(/`+/g, ' ');
  // collapse whitespace
  return s.replace(/\s+/g, ' ').trim();
}

function buildIndex() {
  const sections = listSections();
  const items = [];

  sections.forEach((section) => {
    const dir = path.join(CONTENT_DIR, section);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(raw);
      const slug = slugify(file);
      const text = stripMarkdown(content);
      const excerpt = text.split('.').slice(0, 2).join('.').slice(0, 300);
      items.push({
        id: `${section}/${slug}`,
        section,
        slug,
        title: data.title || slug,
        tags: data.tags || [],
        date: data.date || null,
        excerpt,
        text,
      });
    });
  });

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);
  fs.writeFileSync(OUT_FILE, JSON.stringify(items, null, 2), 'utf8');
  console.log('Wrote', OUT_FILE, 'with', items.length, 'items');
}

buildIndex();

// For CI/consumers
module.exports = { buildIndex };
