import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

export interface MarkdownOptions {
  breaks?: boolean;
  gfm?: boolean;
  sanitize?: boolean;
}

export const defaultMarkdownOptions: MarkdownOptions = {
  breaks: true,
  gfm: true,
  sanitize: true,
};

export function configureMarked(options: MarkdownOptions = defaultMarkdownOptions) {
  marked.setOptions({
    breaks: options.breaks ?? true,
    gfm: options.gfm ?? true,
  });

  const renderer = new marked.Renderer();
  
  renderer.link = function({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<a href="${href}" title="${title || ''}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  renderer.image = function({ href, title, text }) {
    return `<img src="${href}" alt="${text || ''}" title="${title || ''}" class="max-w-full h-auto rounded-lg shadow-sm" loading="lazy" />`;
  };

  renderer.code = function({ text, lang }) {
    return `<pre class="bg-gray-100 rounded-lg p-4 overflow-x-auto"><code class="language-${lang || 'text'}">${text}</code></pre>`;
  };

  renderer.blockquote = function({ tokens }) {
    const text = this.parser.parse(tokens);
    return `<blockquote class="border-l-4 border-[var(--aio-primary)] pl-4 my-4 italic text-gray-700">${text}</blockquote>`;
  };

  marked.use({ renderer });
}

export function markdownToHtml(markdown: string, options: MarkdownOptions = defaultMarkdownOptions): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  configureMarked(options);

  let html = marked(markdown) as string;

  if (options.sanitize !== false) {
    html = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'div', 'span',
        'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
        'a', 'img',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'code',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'src', 'alt', 'width', 'height', 'loading',
        'class', 'id',
        'colspan', 'rowspan'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });
  }

  return html;
}

export function stripMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  return markdown
    .replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '$1')
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '$1')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

export function truncateMarkdown(markdown: string, maxLength: number = 160): string {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  const plainText = stripMarkdown(markdown);
  
  if (plainText.length <= maxLength) {
    return plainText;
  }

  return plainText.slice(0, maxLength).replace(/\s+\w*$/, '') + '...';
}