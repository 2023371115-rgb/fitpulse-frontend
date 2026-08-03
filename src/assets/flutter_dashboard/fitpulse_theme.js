(function () {
  var fallback = {
    primary: '#0F9D58',
    accent: '#B7F51B',
    background: '#F5FAF7',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    border: '#CBD5E1'
  };

  function safeHex(value, backup) {
    return /^#[0-9a-fA-F]{6}$/.test(value || '') ? value.toUpperCase() : backup;
  }

  function parseTheme() {
    var params = new URLSearchParams(window.location.search);
    return Object.keys(fallback).reduce(function (theme, key) {
      theme[key] = safeHex(params.get(key), fallback[key]);
      return theme;
    }, {});
  }

  function colorToFlutter(A, B, hex) {
    var value = hex.replace('#', '');
    return new A.D(
      1,
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255,
      B.f
    );
  }

  window.__fitPulseTheme = parseTheme();
  window.__fitPulseColor = function (A, B, name, backup) {
    return colorToFlutter(A, B, window.__fitPulseTheme[name] || backup);
  };

  document.documentElement.style.background = window.__fitPulseTheme.background;
  document.body.style.margin = '0';
  document.body.style.background = window.__fitPulseTheme.background;
})();
