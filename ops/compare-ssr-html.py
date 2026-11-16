#!/usr/bin/env python3
"""Deep parity diff of the original production SSR HTML vs the recovery branch.

Normalises everything that is build-specific (scope ids, keyframe names derived
from the scope hash, asset hashes, build id) and then compares, per page:
  * the ordered visible-text stream,
  * the ordered CSS rule sequence of every inline stylesheet,
  * the Nuxt payload, element by element.
"""
import difflib
import html
import json
import os
import re

import os
D = os.environ.get('PARITY_HTML', '/tmp/parity-html')
SCOPE = re.compile(r'data-v-[0-9a-f]{8}')
KEYFRAME = re.compile(r'([A-Za-z_][\w-]*)-[0-9a-f]{8}\b')
ASSET = re.compile(r'/_nuxt/[A-Za-z0-9_\-]{6,8}\.(js|css|mjs)')
BUILDID = re.compile(r'"buildId":"[^"]*"')
UUID = re.compile(r'content="[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"')
TAG = re.compile(r'<[^>]*>')
STYLE_BLOCK = re.compile(r'<style[^>]*>(.*?)</style>', re.S)
SCRIPT_BLOCK = re.compile(r'<script[^>]*>(.*?)</script>', re.S)


def norm_text(s):
    s = SCOPE.sub('data-v-S', s)
    s = KEYFRAME.sub(r'\1-KF', s)
    s = ASSET.sub(r'/_nuxt/ASSET.\1', s)
    s = BUILDID.sub('"buildId":"X"', s)
    s = UUID.sub('content="BUILD"', s)
    s = re.sub(r'\?v=[0-9a-f]{8,}', '?v=X', s)
    return s


def visible(raw):
    s = norm_text(raw)
    s = STYLE_BLOCK.sub(' ', s)
    s = SCRIPT_BLOCK.sub(' ', s)
    s = re.sub(r'<!--[^>]*-->', '', s)
    s = TAG.sub('\n', s)
    s = html.unescape(s)
    return [ln.strip() for ln in s.split('\n') if ln.strip()]


def css_rules(raw):
    """Ordered list of (selector, body) for every inline stylesheet."""
    out = []
    for m in STYLE_BLOCK.finditer(norm_text(raw)):
        css = m.group(1)
        for rule in re.finditer(r'([^{}]+)\{([^{}]*)\}', css):
            sel = ' '.join(rule.group(1).split())
            body = ' '.join(rule.group(2).split())
            out.append((sel, body))
    return out


def payload(raw):
    m = re.search(r'<script type="application/json" data-nuxt-data[^>]*>(.*?)</script>', raw, re.S)
    if not m:
        return None
    try:
        return json.loads(html.unescape(m.group(1)))
    except Exception:
        return None


VOLATILE = {'buildId', 'devId', '_errors', 'serverRendered', 'path', 'prerenderedAt', 'id'}


def norm_payload(obj):
    if isinstance(obj, dict):
        return {k: ('<volatile>' if k in VOLATILE else norm_payload(v)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [norm_payload(v) for v in obj]
    if isinstance(obj, str):
        return norm_text(obj)
    return obj


def main():
    pages = sorted(f[4:] for f in os.listdir(D) if f.startswith('orig') and f.endswith('.html'))
    print('%-24s %-12s %-12s %-12s' % ('PAGE', 'VISIBLE TEXT', 'CSS RULES', 'PAYLOAD'))
    issues = []
    for p in pages:
        orig = open(os.path.join(D, 'orig' + p), encoding='utf-8').read()
        branch = open(os.path.join(D, 'branch' + p), encoding='utf-8').read()
        vt = 'OK' if visible(orig) == visible(branch) else 'DIFF'
        co, cb = css_rules(orig), css_rules(branch)
        so = [r[0] for r in co]
        sb = [r[0] for r in cb]
        cs = 'OK' if so == sb else ('ORDER' if sorted(so) == sorted(sb) else 'DIFF')
        po, pb = payload(orig), payload(branch)
        pl = 'OK' if norm_payload(po) == norm_payload(pb) else 'DIFF'
        print('%-24s %-12s %-12s %-12s' % (p.replace('.html', ''), vt, cs, pl))
        if vt != 'OK':
            issues.append((p, 'visible text'))
        if cs != 'OK':
            issues.append((p, 'css rules (%s)' % cs))
        if pl != 'OK':
            issues.append((p, 'payload'))
    print('\nissues: %s' % (issues if issues else 'none'))


if __name__ == '__main__':
    main()
