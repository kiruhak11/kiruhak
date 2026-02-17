const SCRIPT_LIKE_TAGS =
  /<(script|iframe|object|embed|link|meta|base|form|input|button|textarea|select)[\s\S]*?>[\s\S]*?<\/\1>/gi;
const SELF_CLOSING_DANGEROUS =
  /<(script|iframe|object|embed|link|meta|base|form|input|button|textarea|select)[^>]*\/?>/gi;
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const JS_PROTOCOL_ATTR = /\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*'|javascript:[^\s>]+)/gi;

export function sanitizeHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(SCRIPT_LIKE_TAGS, "")
    .replace(SELF_CLOSING_DANGEROUS, "")
    .replace(EVENT_HANDLER_ATTR, "")
    .replace(JS_PROTOCOL_ATTR, ' $1="#"');
}
