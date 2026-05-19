fetch('https://trikara.com').then(r => r.text()).then(html => {
  const m = html.match(/<img[^>]+src=["']([^"']*logo[^"']*)["'][^>]*>/i);
  console.log(m ? m[1] : 'No logo found');
});
