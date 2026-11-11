#!/bin/bash
# Assembles the single-file page: dist/index.html = head.html + <script>data.js + app.js</script>
set -e
cd "$(dirname "$0")"
mkdir -p dist
{ cat src/head.html; echo '<script>'; cat src/data.js src/app.js; echo '</script>'; echo '</body></html>'; } > dist/index.html
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
echo "built dist/index.html ($(wc -c < dist/index.html) bytes)"
