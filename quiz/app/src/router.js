/**
 * Router — simple hash-based SPA router
 */

const routes = {};
let currentView = null;

export function registerRoute(hash, renderFn) {
  routes[hash] = renderFn;
}

export function navigate(hash) {
  window.location.hash = hash;
}

export function initRouter(defaultHash = '#decks') {
  function handleRoute() {
    const hash = window.location.hash || defaultHash;
    const renderFn = routes[hash] || routes[defaultHash];

    if (currentView && currentView.destroy) {
      currentView.destroy();
    }

    if (renderFn) {
      currentView = renderFn();
    }

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.route === hash);
    });
  }

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
