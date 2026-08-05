/* DotField — floating dot particle background (React Bits inspired)
 * Canvas-based field of drifting dots. Respects reduced-motion preference.
 * Exposes window.ReactBits.DotField for the login page. */
function DotField({ density = 700, size = 1.6, speed = 0.6, className = '' }) {
  var ref = React.useRef(null);
  React.useEffect(function () {
    var canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var ctx = canvas.getContext('2d');
    var dots = [];
    var raf = 0;
    var w = 0, h = 0;

    function seed() {
      dots = Array.from({ length: density }, function () {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5 * speed,
          vy: (Math.random() - 0.5) * 0.5 * speed,
          r: Math.random() * 0.8 + size
        };
      });
    }
    function resize() {
      w = canvas.width = canvas.offsetWidth * (window.devicePixelRatio || 1);
      h = canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      seed();
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.32)';
      dots.forEach(function (d) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', resize);
    tick();
    return function () {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, size, speed]);

  return React.createElement('canvas', { ref: ref, className: 'dotfield-canvas ' + className, 'aria-hidden': 'true' });
}

window.ReactBits = window.ReactBits || {};
window.ReactBits.DotField = DotField;
