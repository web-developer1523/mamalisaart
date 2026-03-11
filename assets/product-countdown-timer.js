(function() {
  var processed = {};
  function run() {
    var elements = document.querySelectorAll('.product-countdown-timer__js');
    elements.forEach(function(el) {
      if (processed[el]) return;
      processed[el] = true;
      var endStr = (el.getAttribute('data-countdown-end') || '').replace(/\s+/g, ':').replace(/\s/g, '');
      var endedStr = el.getAttribute('data-countdown-ended') || 'Ended';
      if (!endStr) return;
      var dateStr = endStr.replace(/-/g, '/').replace('T', ' ');
      var end = new Date(dateStr);
      if (isNaN(end.getTime())) return;
      function pad(n) { return (n < 10 ? '0' : '') + n; }
      function hideBlock() { var b = el.closest('.product-countdown-timer'); if (b) b.style.display = 'none'; }
      function update() {
        var now = new Date();
        var diff = end - now;
        if (diff <= 0) { hideBlock(); return; }
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var hh = pad(h);
        var mm = pad(m);
        var ss = pad(s);
        if (d > 0) el.textContent = d + 'd ' + hh + ':Hr ' + mm + ':Min ' + ss + ':Sec';
        else el.textContent = hh + ':Hr ' + mm + ':Min ' + ss + ':Sec';
      }
      update();
      setInterval(update, 1000);
    });
  }
  function schedule() { run(); setTimeout(run, 400); setTimeout(run, 1200); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule);
  else schedule();
})();
