const scriptEl =
  document.currentScript ||
  document.getElementById("fb-pixel");

const PIXEL_ID =
  scriptEl && scriptEl.getAttribute
    ? scriptEl.getAttribute("data-pixel-id")
    : null;

function initializeFacebookPixel(f, b, e, v, n, t, s) {
  if (f.fbq) return;
  n = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = !0;
  n.version = "2.0";
  n.queue = [];
  t = b.createElement(e);
  t.async = !0;
  t.src = v;
  s = b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t, s);
}

initializeFacebookPixel(
  window,
  document,
  "script",
  "https://connect.facebook.net/en_US/fbevents.js",
);

if (PIXEL_ID) {
  window.fbq("init", PIXEL_ID);

  const q = window.__pbFbqQueue;
  if (Array.isArray(q) && q.length) {
    q.forEach((args) => {
      try {
        window.fbq.apply(window, args);
      } catch (e) {}
    });
    window.__pbFbqQueue = [];
  }
}
