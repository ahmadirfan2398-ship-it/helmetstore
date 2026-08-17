// Toast notifications (from server-side flash messages)
(function () {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const type = container.dataset.flashType;
  const msg = container.dataset.flashMsg;
  if (msg) {
    container.textContent = msg;
    container.classList.add(type === 'error' ? 'error' : 'success');
    setTimeout(() => container.classList.add('show'), 200);
    setTimeout(() => container.classList.remove('show'), 3500);
  }
})();

window.showToast = function (message, type) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  container.textContent = message;
  container.className = 'toast-container show ' + (type || 'success');
  setTimeout(() => container.classList.remove('show'), 3000);
};

// Skeleton loader -> reveal real content
(function () {
  const skeleton = document.getElementById('skeletonGrid');
  const real = document.getElementById('productGrid');
  if (!skeleton || !real) return;
  setTimeout(() => {
    skeleton.style.display = 'none';
    real.style.display = 'grid';
  }, 500);
})();

// Carousel
(function () {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  const slides = track.children;
  const dotsWrap = document.getElementById('carouselDots');
  let index = 0;

  for (let i = 0; i < slides.length; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function update() {
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    document.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function goTo(i) { index = (i + slides.length) % slides.length; update(); }

  document.getElementById('carouselNext').addEventListener('click', () => goTo(index + 1));
  document.getElementById('carouselPrev').addEventListener('click', () => goTo(index - 1));
  setInterval(() => goTo(index + 1), 5000);
})();

// Infinite scroll (homepage featured products)
(function () {
  const sentinel = document.getElementById('infiniteScrollSentinel');
  const grid = document.getElementById('productGrid');
  const spinner = document.getElementById('loadMoreSpinner');
  if (!sentinel || !grid) return;

  let page = parseInt(sentinel.dataset.page) || 1;
  let hasMore = sentinel.dataset.hasMore === 'true';
  const lang = sentinel.dataset.lang || 'en';
  let loading = false;

  function cardHtml(p) {
    const name = lang === 'ur' ? p.name_ur : p.name_en;
    const img = p.image
      ? '<img src="' + p.image + '" alt="' + p.name_en + '">'
      : '<div class="img-placeholder">🪖</div>';
    return '<div class="product-card animate-on-scroll in-view">' +
      '<a href="/product/' + p.id + '"><div class="product-img">' + img + '</div><h3>' + name + '</h3></a>' +
      '<p class="price">Rs. ' + p.price.toLocaleString() + '</p>' +
      '<a href="/product/' + p.id + '" class="btn btn-outline">' + (lang === 'ur' ? 'تفصیلات دیکھیں' : 'View Details') + '</a>' +
      '</div>';
  }

  async function loadMore() {
    if (loading || !hasMore) return;
    loading = true;
    if (spinner) spinner.style.display = 'flex';
    try {
      const res = await fetch('/api/products?page=' + (page + 1) + '&limit=8');
      const data = await res.json();
      data.products.forEach(p => { grid.insertAdjacentHTML('beforeend', cardHtml(p)); });
      page += 1;
      hasMore = data.hasMore;
    } catch (e) { /* silent fail */ }
    if (spinner) spinner.style.display = 'none';
    loading = false;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) loadMore(); });
  }, { threshold: 0.1 });
  observer.observe(sentinel);
})();

// Nav dropdown keyboard support + tabs + accordion already below; Tabs component
(function () {
  const tabHeaders = document.querySelectorAll('.tab-header');
  if (!tabHeaders.length) return;
  tabHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const tabId = header.dataset.tab;
      document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      header.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    });
  });
})();

// Star ratings display (read-only) - render filled/empty stars based on data-rating
(function () {
  document.querySelectorAll('.stars-display').forEach(el => {
    const rating = parseFloat(el.dataset.rating) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += '<i class="fa-' + (i <= Math.round(rating) ? 'solid' : 'regular') + ' fa-star"></i>';
    }
    el.innerHTML = html;
  });
})();

// Star rating input (clickable, for review form)
(function () {
  const starInput = document.getElementById('starInput');
  if (!starInput) return;
  const stars = starInput.querySelectorAll('i');
  const valueInput = document.getElementById('ratingValue');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.val);
      valueInput.value = val;
      stars.forEach(s => {
        const sv = parseInt(s.dataset.val);
        s.classList.toggle('active', sv <= val);
        s.className = (sv <= val ? 'fa-solid' : 'fa-regular') + ' fa-star' + (sv <= val ? ' active' : '');
      });
    });
  });
})();

// Lightbox
(function () {
  const trigger = document.getElementById('lightboxTrigger');
  const lightbox = document.getElementById('lightbox');
  if (!trigger || !lightbox) return;
  const img = trigger.querySelector('img');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');

  if (img) {
    trigger.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.classList.add('active');
    });
  }
  closeBtn.addEventListener('click', () => lightbox.classList.remove('active'));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('active'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('active'); });
})();

// Price range slider (shop page)
(function () {
  const slider = document.getElementById('priceRange');
  if (!slider) return;
  const label = document.getElementById('priceRangeVal');
  slider.addEventListener('input', () => { label.textContent = parseInt(slider.value).toLocaleString(); });
  slider.addEventListener('change', () => { document.getElementById('filterForm').submit(); });
})();

// Checkout stepper navigation
(function () {
  const form = document.getElementById('checkoutForm');
  if (!form) return;
  const steps = form.querySelectorAll('.checkout-step');
  const stepperSteps = document.querySelectorAll('.stepper .stepper-step');

  function showStep(n) {
    steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === n));
    stepperSteps.forEach(s => {
      const sn = parseInt(s.dataset.step);
      s.classList.toggle('active', sn === n);
      s.classList.toggle('done', sn < n);
    });
  }

  form.querySelectorAll('.step-next').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = btn.closest('.checkout-step');
      const inputs = current.querySelectorAll('input[required], textarea[required], select[required]');
      for (const input of inputs) {
        if (!input.checkValidity()) { input.reportValidity(); return; }
      }
      showStep(parseInt(current.dataset.step) + 1);
    });
  });
  form.querySelectorAll('.step-back').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = btn.closest('.checkout-step');
      showStep(parseInt(current.dataset.step) - 1);
    });
  });

  form.addEventListener('submit', () => {
    const btn = document.getElementById('placeOrderBtn');
    const text = document.getElementById('placeOrderText');
    if (btn && text) {
      btn.disabled = true;
      text.innerHTML = '<span class="spinner small"></span>';
    }
  });
})();

// Password show/hide toggle
(function () {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isPwd = target.type === 'password';
      target.type = isPwd ? 'text' : 'password';
      const icon = btn.querySelector('i');
      icon.classList.toggle('fa-eye', !isPwd);
      icon.classList.toggle('fa-eye-slash', isPwd);
    });
  });
})();

// Password strength meter
(function () {
  const pwdInput = document.getElementById('signupPassword');
  const strengthWrap = document.getElementById('passwordStrength');
  if (!pwdInput || !strengthWrap) return;
  const bar = strengthWrap.querySelector('.strength-bar span');
  const label = strengthWrap.querySelector('.strength-label');

  pwdInput.addEventListener('input', () => {
    const val = pwdInput.value;
    let score = 0;
    if (val.length >= 6) score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    let pct = (score / 5) * 100;
    let color = '#e53935', text = 'Weak';
    if (score >= 4) { color = '#2e7d32'; text = 'Strong'; }
    else if (score >= 2) { color = '#f9a825'; text = 'Medium'; }

    bar.style.width = pct + '%';
    bar.style.background = color;
    label.textContent = val ? text : '';
  });
})();

// Keyboard support: close dropdown/accordion with Escape (already handled for sidebar/lightbox/modal above)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.nav-dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// Search autocomplete (shop page)
(function () {
  const input = document.getElementById('searchInput');
  const suggestionsBox = document.getElementById('searchSuggestions');
  if (!input || !suggestionsBox) return;

  const lang = document.documentElement.lang || 'en';
  let debounceTimer;

  function renderSuggestions(results) {
    if (!results.length) { suggestionsBox.innerHTML = ''; suggestionsBox.classList.remove('open'); return; }
    suggestionsBox.innerHTML = results.map(p => {
      const name = lang === 'ur' ? p.name_ur : p.name_en;
      const img = p.image ? '<img src="' + p.image + '">' : '<span class="sugg-icon">🪖</span>';
      return '<a href="/product/' + p.id + '" class="suggestion-item">' + img +
        '<span>' + name + '</span><span class="sugg-price">Rs. ' + p.price.toLocaleString() + '</span></a>';
    }).join('');
    suggestionsBox.classList.add('open');
  }

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (!q) { suggestionsBox.innerHTML = ''; suggestionsBox.classList.remove('open'); return; }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch('/api/search?q=' + encodeURIComponent(q));
        const data = await res.json();
        renderSuggestions(data.results);
      } catch (e) { /* silent */ }
    }, 250);
  });

  document.addEventListener('click', (e) => {
    if (!suggestionsBox.contains(e.target) && e.target !== input) suggestionsBox.classList.remove('open');
  });
})();

// Client-side form validation (inline error messages)
(function () {
  const validators = {
    email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? '' : 'Please enter a valid email address.',
    tel: (val) => /^[0-9]{7,12}$/.test(val.replace(/\s/g, '')) ? '' : 'Please enter a valid phone number (digits only).',
    password: (val) => val.length >= 6 ? '' : 'Password must be at least 6 characters.'
  };

  function showError(input, msg) {
    let errEl = input.parentElement.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('small');
      errEl.className = 'field-error';
      input.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
    input.classList.toggle('input-invalid', !!msg);
  }

  document.querySelectorAll('form.auth-form, #checkoutForm').forEach(form => {
    form.querySelectorAll('input[type="email"], input[type="tel"], input[type="password"]').forEach(input => {
      input.addEventListener('blur', () => {
        if (!input.value) return; // don't show error on empty (required handles that)
        const validator = validators[input.type];
        if (validator) showError(input, validator(input.value));
      });
      input.addEventListener('input', () => {
        if (input.classList.contains('input-invalid')) {
          const validator = validators[input.type];
          if (validator) showError(input, validator(input.value));
        }
      });
    });
  });
})();

// Form auto-save to localStorage (contact + checkout shipping - never passwords)
(function () {
  function setupAutosave(formId, storageKey, fieldNames) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Restore saved values
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      fieldNames.forEach(name => {
        const field = form.querySelector('[name="' + name + '"]');
        if (field && saved[name] && !field.value) field.value = saved[name];
      });
    } catch (e) { /* silent */ }

    // Save on input
    fieldNames.forEach(name => {
      const field = form.querySelector('[name="' + name + '"]');
      if (!field) return;
      field.addEventListener('input', () => {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
          saved[name] = field.value;
          localStorage.setItem(storageKey, JSON.stringify(saved));
        } catch (e) { /* silent */ }
      });
    });

    // Clear on successful submit
    form.addEventListener('submit', () => {
      setTimeout(() => localStorage.removeItem(storageKey), 500);
    });
  }

  setupAutosave('checkoutForm', 'helmetstore-checkout-draft', ['name', 'phone', 'address', 'city']);

  const contactForm = document.querySelector('.auth-page form[action="/contact"]');
  if (contactForm && !contactForm.id) contactForm.id = 'contactForm';
  setupAutosave('contactForm', 'helmetstore-contact-draft', ['name', 'email', 'phone', 'message']);
})();

// Search autocomplete + validation done. Continuing to progress bar...
// Scroll progress bar
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = pct + '%';
  });
})();

// Back to top button
(function () {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// Nav dropdown (Shop categories)
(function () {
  const dropdownBtn = document.getElementById('shopDropdownBtn');
  if (!dropdownBtn) return;
  const dropdown = dropdownBtn.closest('.nav-dropdown');

  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove('open');
  });
})();

// Scroll-reveal animation for elements with .animate-on-scroll
(function () {
  const items = document.querySelectorAll('.animate-on-scroll');
  if (!items.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(item => observer.observe(item));
})();

// Animated counters (hero stats)
(function () {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10) || 0;
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.floor(progress * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + '+';
    }
    requestAnimationFrame(tick);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(c => observer.observe(c));
})();

// Promo modal (shows once per browser session)
(function () {
  const modal = document.getElementById('promoModal');
  if (!modal) return;
  const closeBtn = document.getElementById('promoModalClose');
  const okBtn = document.getElementById('promoModalOk');

  if (!sessionStorage.getItem('helmetstore-promo-seen')) {
    setTimeout(() => modal.classList.add('active'), 800);
    sessionStorage.setItem('helmetstore-promo-seen', 'true');
  }

  function closeModal() { modal.classList.remove('active'); }
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (okBtn) okBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
})();

// FAQ Accordion
(function () {
  const headers = document.querySelectorAll('.accordion-header');
  if (!headers.length) return;
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
})();

// Left sidebar drawer toggle
(function () {
  const body = document.body;
  const toggleBtn = document.getElementById('sideNavToggle');
  const closeBtn = document.getElementById('sideNavClose');
  const overlay = document.getElementById('sideNavOverlay');

  function openNav() { body.classList.add('sidenav-open'); }
  function closeNav() { body.classList.remove('sidenav-open'); }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      body.classList.contains('sidenav-open') ? closeNav() : openNav();
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeNav);
  if (overlay) overlay.addEventListener('click', closeNav);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });
})();

// Dark mode toggle - persists using localStorage
(function () {
  const toggleBtn = document.getElementById('darkModeToggle');
  const root = document.documentElement;

  function setIcon(isDark) {
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-moon', 'fa-sun');
      icon.classList.add(isDark ? 'fa-sun' : 'fa-moon');
    }
  }

  // Apply saved preference on load
  const saved = localStorage.getItem('helmetstore-theme');
  if (saved === 'dark') {
    root.setAttribute('data-theme', 'dark');
    setIcon(true);
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isDark = root.getAttribute('data-theme') === 'dark';
      if (isDark) {
        root.removeAttribute('data-theme');
        localStorage.setItem('helmetstore-theme', 'light');
        setIcon(false);
      } else {
        root.setAttribute('data-theme', 'dark');
        localStorage.setItem('helmetstore-theme', 'dark');
        setIcon(true);
      }
    });
  }
})();
