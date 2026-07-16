/* Local email de-obfuscator: reconstructs Cloudflare-encoded emails at runtime.
   Keeps addresses out of the static HTML (anti-scrape) while restoring mailto links,
   mirroring the behaviour of Cloudflare's email-decode.min.js. */
(function () {
  function decode(enc) {
    var key = parseInt(enc.substr(0, 2), 16), out = '';
    for (var i = 2; i < enc.length; i += 2) {
      out += String.fromCharCode(parseInt(enc.substr(i, 2), 16) ^ key);
    }
    try { return decodeURIComponent(escape(out)); } catch (e) { return out; }
  }
  function run() {
    document.querySelectorAll('a[href*="/cdn-cgi/l/email-protection"]').forEach(function (a) {
      var h = a.getAttribute('href') || '', i = h.indexOf('#');
      if (i > -1) a.setAttribute('href', 'mailto:' + decode(h.slice(i + 1)));
    });
    document.querySelectorAll('.__cf_email__, [data-cfemail]').forEach(function (el) {
      var c = el.getAttribute('data-cfemail');
      if (c) { el.textContent = decode(c); el.removeAttribute('data-cfemail'); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
