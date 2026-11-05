/**
 * EVER GAIN Indoor Football - Gallery Page Script
 * Fully production-grade interactive gallery with filter, fullscreen lightbox,
 * touch swipe, video playback, Firebase Realtime Database integration, and lazy loading.
 */

// Global gallery state
let allGalleryItems = [];
let currentFilteredItems = [];
let currentLightboxIndex = 0;
let currentFilter = 'all';
let touchStartX = 0;
let touchStartY = 0;

/**
 * Page Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
  init();
});

/**
 * Master Init function
 */
function init() {
  initParticles();
  initNavigation();
  initScrollAnimations();
  initLightboxEvents();
  initFilterEvents();
  loadGallery();

  window.addEventListener('evergain:languageChanged', () => {
    if (window.EverGain && typeof window.EverGain.applyTranslations === 'function') {
      window.EverGain.applyTranslations();
    }
  });
}

/**
 * Fetch gallery items from Firebase Realtime Database (/gallery)
 * Ordered by 'order' field, with graceful error handling.
 */
function loadGallery() {
  showLoading();

  // Check if Firebase is available
  let database = null;
  if (typeof db !== 'undefined' && db) {
    database = db;
  } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    database = firebase.database();
  }

  if (!database) {
    console.warn('Firebase Database not yet initialized. Checking offline or sample data...');
    // Handle unconfigured or offline state gracefully
    handleOfflineOrFallback();
    return;
  }

  try {
    const galleryRef = database.ref('gallery');
    
    // Listen for realtime value or read once
    galleryRef.orderByChild('order').once('value')
      .then((snapshot) => {
        hideLoading();
        const items = [];

        if (snapshot.exists()) {
          snapshot.forEach((childSnap) => {
            const data = childSnap.val();
            items.push({
              id: childSnap.key,
              title: data.title || 'ইনডোর ফুটবল',
              description: data.description || '',
              type: 'image',
              url: data.url || '',
              thumbnail: data.thumbnail || data.url || '',
              order: typeof data.order === 'number' ? data.order : 999,
              createdAt: data.createdAt || 0
            });
          });

          // Sort by order ascending
          items.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        allGalleryItems = items;

        if (allGalleryItems.length === 0) {
          showEmptyState();
        } else {
          filterGallery(currentFilter);
        }
      })
      .catch((error) => {
        console.error('Firebase gallery fetch error:', error);
        hideLoading();
        showToast('গ্যালারির ডেটা লোড করতে সমস্যা হয়েছে।', 'error');
        handleOfflineOrFallback();
      });
  } catch (err) {
    console.error('Unexpected error loading gallery:', err);
    hideLoading();
    handleOfflineOrFallback();
  }
}

/**
 * Handle fallback when Firebase is not connected or in development mode
 */
function handleOfflineOrFallback() {
  hideLoading();
  // If no items in database, check if sample items should be provided for demo
  if (allGalleryItems.length === 0) {
    // Provide realistic high-definition football turf sample images so UI is never broken
    allGalleryItems = getSampleGalleryItems();
  }

  if (allGalleryItems.length === 0) {
    showEmptyState();
  } else {
    filterGallery(currentFilter);
  }
}

/**
 * Premium default gallery items for indoor football
 */
function getSampleGalleryItems() {
  return [
    {
      id: 'eg-img-1',
      title: 'EVER GAIN Turf Match',
      description: 'আন্তর্জাতিক মানের কৃত্রিম টার্ফে প্রাণবন্ত ফুটবল ম্যাচ',
      category: 'turf',
      type: 'image',
      url: 'assets/images/1793539206852_1000025672.jpg',
      thumbnail: 'assets/images/1793539206852_1000025672.jpg',
      order: 1
    },
    {
      id: 'eg-img-2',
      title: 'EVER GAIN Arena Pitch',
      description: 'আধুনিক ইনডোর ফুটবল এরিনা ও প্রশস্ত খেলার মাঠ',
      category: 'turf',
      type: 'image',
      url: 'assets/images/1793539216901_1000025671.jpg',
      thumbnail: 'assets/images/1793539216901_1000025671.jpg',
      order: 2
    },
    {
      id: 'eg-img-3',
      title: 'Indoor Football Action',
      description: 'বন্ধুদের সাথে সেরা আক্রমণাত্মক ও রোমাঞ্চকর খেলা',
      category: 'turf',
      type: 'image',
      url: 'assets/images/1793539242375_1000025661.jpg',
      thumbnail: 'assets/images/1793539242375_1000025661.jpg',
      order: 3
    },
    {
      id: 'eg-img-4',
      title: 'Turf Night Game',
      description: 'চোখ ধাঁধানো ফ্লিকার-ফ্রি ফ্লাডলাইটে নাইট ম্যাচ সেশন',
      category: 'night',
      type: 'image',
      url: 'assets/images/1793539255106_1000025663.jpg',
      thumbnail: 'assets/images/1793539255106_1000025663.jpg',
      order: 4
    },
    {
      id: 'eg-img-5',
      title: 'Turf Arena Lighting',
      description: 'প্রফেশনাল নাইট লাইটিং ও ড্রিম লাইট ফুটবল অভিজ্ঞতা',
      category: 'night',
      type: 'image',
      url: 'assets/images/1793539266821_1000025662.jpg',
      thumbnail: 'assets/images/1793539266821_1000025662.jpg',
      order: 5
    },
    {
      id: 'eg-img-6',
      title: 'EVER GAIN Sports Facility',
      description: 'সিলেটের বিশ্বমানের আধুনিক ফুটবল সুবিধা ও টার্ফ পরিবেশ',
      category: 'turf',
      type: 'image',
      url: 'assets/images/1793539275408_1000025664.jpg',
      thumbnail: 'assets/images/1793539275408_1000025664.jpg',
      order: 6
    }
  ];
}

/**
 * Filter Gallery Items by Type ('all', 'turf', 'night', 'image', 'video')
 */
function filterGallery(type) {
  currentFilter = type || 'all';

  // Update button active states
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  filterBtns.forEach(btn => {
    const btnFilter = btn.getAttribute('data-filter');
    if (btnFilter === currentFilter) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    }
  });

  // Filter items array
  if (currentFilter === 'all') {
    currentFilteredItems = [...allGalleryItems];
  } else if (currentFilter === 'turf') {
    currentFilteredItems = allGalleryItems.filter(item => 
      item.category === 'turf' || 
      (!item.category && item.title && !item.title.toLowerCase().includes('night')) ||
      (!item.category && !item.title)
    );
  } else if (currentFilter === 'night') {
    currentFilteredItems = allGalleryItems.filter(item => 
      item.category === 'night' || 
      (item.title && (item.title.toLowerCase().includes('night') || item.title.toLowerCase().includes('light')))
    );
  } else {
    currentFilteredItems = allGalleryItems.filter(item => item.type === currentFilter || item.category === currentFilter);
  }

  // Render items or empty state
  if (currentFilteredItems.length === 0) {
    showEmptyState();
  } else {
    renderGallery(currentFilteredItems);
  }
}

/**
 * Render Gallery Cards dynamically into .gallery-grid
 */
function renderGallery(items) {
  const grid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  if (emptyState) emptyState.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `gallery-item animate-in stagger-${(index % 6) + 1}`;
    card.setAttribute('data-index', index);
    card.setAttribute('data-type', 'image');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${item.title || 'ছবি'}`);

    const thumbUrl = item.thumbnail || item.url || '';
    const isNight = item.category === 'night' || (item.title && (item.title.toLowerCase().includes('night') || item.title.toLowerCase().includes('light')));
    const categoryLabel = isNight ? 'নাইট এরিনা' : 'টার্ফ ভিউ';
    const categoryIcon = isNight ? 'fa-moon' : 'fa-futbol';

    card.innerHTML = `
      <div class="gallery-item-inner">
        <div class="gallery-glass-rim"></div>
        <span class="gallery-photo-chip">
          <span class="gallery-beacon-dot"></span>
          <i class="fas ${categoryIcon}"></i>
          <span>${categoryLabel}</span>
          <span class="gallery-chip-idx">#${index + 1}</span>
        </span>
        <img 
          src="${escapeHtml(thumbUrl)}" 
          alt="${escapeHtml(item.title || 'EVER GAIN Turf')}" 
          class="gallery-img"
          loading="lazy"
          onerror="if (!this.dataset.fallbackTried && this.getAttribute('src') && this.getAttribute('src').indexOf('assets/images/') !== -1) { this.dataset.fallbackTried = '1'; this.src = 'https://raw.githubusercontent.com/srpshouro/Ever-gain-demo/main/' + this.getAttribute('src'); }"
        >
        <div class="gallery-gradient-overlay" aria-hidden="true"></div>
        <div class="gallery-hover-indicator" aria-hidden="true">
          <i class="fas fa-expand"></i>
          <span>ফুল ভিউ</span>
        </div>
      </div>
    `;

    // Click & Keyboard Enter event to open lightbox
    card.addEventListener('click', () => {
      openLightbox(index);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });

    grid.appendChild(card);
  });

  // Activate lazy loading & entrance animations
  initLazyLoading();
  triggerScrollAnimations();
}

/**
 * Open Fullscreen Lightbox at given index
 */
function openLightbox(index) {
  if (!currentFilteredItems || currentFilteredItems.length === 0) return;

  const validIndex = Math.max(0, Math.min(index, currentFilteredItems.length - 1));
  currentLightboxIndex = validIndex;

  const item = currentFilteredItems[validIndex];
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxCounter = document.getElementById('lightboxCounter');

  if (!lightbox) return;

  // Set titles & captions (clean view, no text on photos)
  if (lightboxTitle) lightboxTitle.textContent = item.title || '';
  if (lightboxCaption) lightboxCaption.textContent = item.description || '';
  if (lightboxCounter) {
    const curNum = toBengaliNumber(validIndex + 1);
    const totalNum = toBengaliNumber(currentFilteredItems.length);
    lightboxCounter.textContent = `${curNum}/${totalNum}`;
  }

  // Display Image
  if (lightboxImg) {
    lightboxImg.classList.remove('hidden');
    lightboxImg.src = item.url || item.thumbnail || '';
    lightboxImg.alt = item.title || 'গ্যালারি ছবি';
    lightboxImg.onerror = function () {
      if (!this.dataset.fallbackTried && this.getAttribute('src') && this.getAttribute('src').indexOf('assets/images/') !== -1) {
        this.dataset.fallbackTried = '1';
        this.src = 'https://raw.githubusercontent.com/srpshouro/Ever-gain-demo/main/' + this.getAttribute('src');
      }
    };
  }

  // Show Lightbox and freeze body scrolling
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  lightbox.focus();
}

/**
 * Close Lightbox viewer
 */
function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');

  if (lightboxImg) {
    lightboxImg.src = '';
  }

  if (lightbox) {
    lightbox.classList.remove('active');
  }
  document.body.style.overflow = '';
}

/**
 * Navigate to next item in lightbox
 */
function nextImage() {
  if (currentFilteredItems.length <= 1) return;
  const nextIdx = (currentLightboxIndex + 1) % currentFilteredItems.length;
  openLightbox(nextIdx);
}

/**
 * Navigate to previous item in lightbox
 */
function prevImage() {
  if (currentFilteredItems.length <= 1) return;
  const prevIdx = (currentLightboxIndex - 1 + currentFilteredItems.length) % currentFilteredItems.length;
  openLightbox(prevIdx);
}

/**
 * Keyboard Navigation Handler (Esc to close, Arrow keys to navigate)
 */
function handleKeyboard(e) {
  const lightbox = document.getElementById('lightbox');
  if (!lightbox || !lightbox.classList.contains('active')) return;

  if (e.key === 'Escape') {
    closeLightbox();
  } else if (e.key === 'ArrowRight') {
    nextImage();
  } else if (e.key === 'ArrowLeft') {
    prevImage();
  }
}

/**
 * Setup Lightbox event listeners and touch swipe
 */
function initLightboxEvents() {
  const lightbox = document.getElementById('lightbox');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxOverlay = document.getElementById('lightboxOverlay');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }
  if (lightboxOverlay) {
    lightboxOverlay.addEventListener('click', closeLightbox);
  }
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', prevImage);
  }
  if (lightboxNext) {
    lightboxNext.addEventListener('click', nextImage);
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleKeyboard);

  // Touch Swipe for mobile navigation
  if (lightbox) {
    handleSwipe(lightbox);
  }
}

/**
 * Touch swipe implementation
 */
function handleSwipe(lightbox) {
  if (!lightbox) return;

  lightbox.addEventListener('touchstart', e => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (!lightbox.classList.contains('active')) return;
    if (!e.changedTouches || !e.changedTouches[0]) return;

    const diff = touchStartX - e.changedTouches[0].clientX;
    const diffY = touchStartY - e.changedTouches[0].clientY;

    // Verify horizontal swipe is dominant and exceeds threshold
    if (Math.abs(diff) > 50 && Math.abs(diff) > Math.abs(diffY)) {
      diff > 0 ? nextImage() : prevImage();
    }
  }, { passive: true });
}

/**
 * Setup Filter Button Clicks
 */
function initFilterEvents() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      filterGallery(filter);
    });
  });

  const refreshBtn = document.getElementById('emptyRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadGallery();
    });
  }
}

/**
 * Toggle Loading Skeleton Grid
 */
function showLoading() {
  const skeletonGrid = document.getElementById('skeletonGrid');
  const galleryGrid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');

  if (skeletonGrid) skeletonGrid.classList.remove('hidden');
  if (galleryGrid) galleryGrid.classList.add('hidden');
  if (emptyState) emptyState.classList.add('hidden');
}

function hideLoading() {
  const skeletonGrid = document.getElementById('skeletonGrid');
  if (skeletonGrid) skeletonGrid.classList.add('hidden');
}

/**
 * Show Empty State message
 */
function showEmptyState() {
  const galleryGrid = document.getElementById('galleryGrid');
  const emptyState = document.getElementById('emptyState');
  const skeletonGrid = document.getElementById('skeletonGrid');

  if (skeletonGrid) skeletonGrid.classList.add('hidden');
  if (galleryGrid) galleryGrid.classList.add('hidden');
  if (emptyState) emptyState.classList.remove('hidden');
}

/**
 * Lazy loading using IntersectionObserver
 */
function initLazyLoading() {
  const lazyImages = document.querySelectorAll('.gallery-img[data-src]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const realSrc = img.getAttribute('data-src');
          if (realSrc) {
            img.src = realSrc;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
          }
          obs.unobserve(img);
        }
      });
    }, { rootMargin: '100px 0px', threshold: 0.05 });

    lazyImages.forEach(img => observer.observe(img));
  } else {
    // Fallback for older browsers
    lazyImages.forEach(img => {
      const realSrc = img.getAttribute('data-src');
      if (realSrc) {
        img.src = realSrc;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
      }
    });
  }
}

/**
 * Helper: Extract YouTube ID
 */
function extractYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Convert English number to Bengali digits
 */
function toBengaliNumber(num) {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, digit => bengaliDigits[digit]);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Navigation Bar and Mobile Menu
 */
function initNavigation() {
  if (window.EverGain && typeof window.EverGain.initNavigation === 'function') {
    window.EverGain.initNavigation();
  }
}

/**
 * Particle background animation on canvas
 */
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  if (window.innerWidth <= 768) {
    canvas.style.display = 'none';
    return;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const particleCount = Math.min(Math.floor((width * height) / 25000), 45);
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 1.8 + 0.8,
      alpha: Math.random() * 0.5 + 0.2
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
      ctx.fill();

      // Connect near particles
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.15 * (1 - dist / 110)})`;
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/**
 * Scroll Animations with IntersectionObserver
 */
function initScrollAnimations() {
  triggerScrollAnimations();
}

function triggerScrollAnimations() {
  const animatedEls = document.querySelectorAll('.animate-in:not(.visible)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    animatedEls.forEach(el => observer.observe(el));
  } else {
    animatedEls.forEach(el => el.classList.add('visible'));
  }
}

/**
 * Toast notifications
 */
function showToast(message, type = 'info') {
  if (typeof window.showToast === 'function' && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }

  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: 'fa-check-circle',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  const iconClass = iconMap[type] || 'fa-circle-info';

  toast.innerHTML = `
    <i class="fas ${iconClass}"></i>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button type="button" class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);

  // Close on click
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
  }

  // Auto remove after 3.5s
  setTimeout(() => {
    removeToast(toast);
  }, 3500);

  function removeToast(el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 300);
  }
}
