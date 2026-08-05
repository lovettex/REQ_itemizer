/* Aurora — animated aurora background (React Bits inspired, static-site friendly)
 * Renders stacked blurred gradient layers that drift across the screen.
 * Exposes window.ReactBits.Aurora for the login page. */
function Aurora({ layers = 3, speed = 1, className = '' }) {
  return React.createElement(
    'div',
    { className: 'aurora-bg ' + className, 'aria-hidden': 'true' },
    Array.from({ length: layers }).map(function (_, i) {
      return React.createElement('div', {
        key: i,
        className: 'aurora-layer',
        style: { '--i': i, '--dur': (24 + i * 9) / speed + 's', '--delay': (i * -6) + 's' }
      });
    })
  );
}

window.ReactBits = window.ReactBits || {};
window.ReactBits.Aurora = Aurora;
