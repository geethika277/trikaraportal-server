fetch('https://trikara.com').then(r => r.text()).then(html => {
  const m = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i);
  console.log(m ? m[1] : 'https://trikara.com/favicon.ico');
}).catch(() => console.log('https://trikara.com/favicon.ico'));
