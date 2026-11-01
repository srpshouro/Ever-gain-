/**
 * EVER GAIN — Indoor Football Booking Platform
 * Homepage Main Controller Script (index.html)
 *
 * Responsibilities:
 * - Initialize particle canvas background & smooth scroll navigation
 * - Setup mobile menu with body scroll-lock and accessible toggle
 * - Hero entrance animations and scroll reveal observer
 * - Realtime database data synchronization (/settings, /pricing, /gallery)
 * - Dynamic price card updating and Bengali numerals formatting
 * - Contact information live updates with fallbacks for offline mode
 */

(function (window, document) {
  'use strict';

  // Ensure EverGain global namespace exists
  window.EverGain = window.EverGain || {};

  // ==========================================================================
  // Helper Utilities
  // ==========================================================================

  /**
   * Converts English numerals (0-9) to Bengali numerals (০-৯).
   * @param {number|string} num
   * @returns {string}
   */
  function toBengaliNum(num) {
    if (window.EverGain && typeof EverGain.toBengaliNum === 'function') {
      return EverGain.toBengaliNum(num);
    }
    if (num === null || num === undefined) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, function (d) {
      return bengaliDigits[Number(d)];
    });
  }

  /**
   * Formats price amount to Bangladeshi Taka format (e.g. '৳৫৫o' or '৳550').
   * @param {number|string} amount
   * @returns {string}
   */
  function formatPriceBengali(amount) {
    if (amount === null || amount === undefined || amount === '') return '';
    const clean = Math.round(Number(amount));
    if (isNaN(clean)) return String(amount);
    const isEn = window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en';
    return isEn ? ('৳' + clean) : ('৳' + toBengaliNum(clean));
  }

  // ==========================================================================
  // Navigation & Active State
  // ==========================================================================

  /**
   * Sets active navigation links for the homepage.
   */
  function setActiveNavLink() {
    // Desktop Nav Links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === 'index.html' || href === './' || href === '/') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile Nav Links
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');
    mobileLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === 'index.html' || href === './' || href === '/') {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Mobile Bottom Nav Items
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(function (item) {
      const href = item.getAttribute('href');
      if (href === 'index.html' || href === './' || href === '/') {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  /**
   * Sets up mobile drawer menu with touch-friendly interactions and scroll lock.
   * Delegates to shared EverGain.initNavigation to prevent duplicate listener conflict.
   */
  function setupMobileMenu() {
    if (window.EverGain && typeof EverGain.initNavigation === 'function') {
      EverGain.initNavigation();
    }
  }

  // ==========================================================================
  // Hero Entrance Animations
  // ==========================================================================

  /**
   * Triggers entrance animations for the hero section immediately on page load.
   */
  function setupHeroAnimations() {
    const heroElements = document.querySelectorAll('.hero .animate-in');
    if (!heroElements || heroElements.length === 0) return;

    // Small timeout ensures styles are computed and transition triggers visibly
    setTimeout(function () {
      heroElements.forEach(function (el) {
        el.classList.add('visible');
      });
    }, 120);
  }

  // ==========================================================================
  // Dynamic Pricing Synchronization
  // ==========================================================================

  let cachedPricingData = null;

  /**
   * Updates pricing cards with live or fallback pricing data.
   * @param {Object} data - Pricing configuration object from Firebase
   */
  function updatePricing(data) {
    if (!data || typeof data !== 'object') return;
    cachedPricingData = data;

    // 1. Extract values with sensible defaults
    const dayPrice = Number(data.dayPrice || data.day || 550);
    const dayOriginalPrice = Number(data.dayOriginalPrice || data.dayOriginal || 600);

    const nightPrice = Number(data.nightPrice || data.night || 900);
    const nightOriginalPrice = data.nightOriginalPrice || data.nightOriginal || null;

    const discount = Number(data.discount || 50);

    const permDayPrice = Number(data.permanentDayPrice || data.permDay || (dayPrice - discount));
    const permDayOriginalPrice = Number(data.permanentDayOriginalPrice || data.permDayOriginal || dayPrice);

    const permNightPrice = Number(data.permanentNightPrice || data.permNight || (nightPrice - discount));
    const permNightOriginalPrice = Number(data.permanentNightOriginalPrice || data.permNightOriginal || nightPrice);

    // 2. Update Quick Booking Cards
    const quickDayPriceEl = document.getElementById('quickDayPrice');
    if (quickDayPriceEl) quickDayPriceEl.textContent = formatPriceBengali(dayPrice);

    const quickDayOrigEl = document.getElementById('quickDayOriginalPrice');
    if (quickDayOrigEl) quickDayOrigEl.textContent = formatPriceBengali(dayOriginalPrice);

    const quickNightPriceEl = document.getElementById('quickNightPrice');
    if (quickNightPriceEl) quickNightPriceEl.textContent = formatPriceBengali(nightPrice);

    // 3. Update Pricing Overview Comparison Section
    const overviewNormalDayPriceEl = document.getElementById('overviewNormalDayPrice');
    if (overviewNormalDayPriceEl) overviewNormalDayPriceEl.textContent = formatPriceBengali(dayPrice);

    const overviewNormalDayOrigEl = document.getElementById('overviewNormalDayOriginal');
    if (overviewNormalDayOrigEl) overviewNormalDayOrigEl.textContent = formatPriceBengali(dayOriginalPrice);

    const overviewNormalNightPriceEl = document.getElementById('overviewNormalNightPrice');
    if (overviewNormalNightPriceEl) overviewNormalNightPriceEl.textContent = formatPriceBengali(nightPrice);

    const overviewPermDayPriceEl = document.getElementById('overviewPermanentDayPrice');
    if (overviewPermDayPriceEl) overviewPermDayPriceEl.textContent = formatPriceBengali(permDayPrice);

    const overviewPermDayOrigEl = document.getElementById('overviewPermanentDayOriginal');
    if (overviewPermDayOrigEl) overviewPermDayOrigEl.textContent = formatPriceBengali(permDayOriginalPrice);

    const overviewPermNightPriceEl = document.getElementById('overviewPermanentNightPrice');
    if (overviewPermNightPriceEl) overviewPermNightPriceEl.textContent = formatPriceBengali(permNightPrice);

    const overviewPermNightOrigEl = document.getElementById('overviewPermanentNightOriginal');
    if (overviewPermNightOrigEl) overviewPermNightOrigEl.textContent = formatPriceBengali(permNightOriginalPrice);
  }

  // ==========================================================================
  // Contact & Settings Synchronization
  // ==========================================================================

  /**
   * Updates contact preview and footer elements with settings from Firebase.
   * @param {Object} data - Business settings object
   */
  function updateContactPreview(data) {
    if (!data || typeof data !== 'object') return;

    const phone = data.phone || data.contactPhone || data.phoneNumber;
    const whatsapp = data.whatsapp || data.whatsappNumber || phone;
    const address = data.address || data.location || data.groundAddress;
    const facebook = data.facebook || data.fbUrl || data.facebookPage;

    // Use EverGain's formatted phone if available
    const formattedPhone = (window.EverGain && typeof EverGain.formatPhone === 'function' && phone)
      ? EverGain.formatPhone(phone)
      : phone;

    // Update Phone numbers
    if (phone) {
      const cleanDigits = String(phone).replace(/\D/g, '');
      const telHref = 'tel:' + (phone.startsWith('+') ? phone : '+88' + cleanDigits);

      const contactPhoneDisplay = document.getElementById('contactPhoneDisplay');
      if (contactPhoneDisplay) contactPhoneDisplay.textContent = formattedPhone;

      const contactPhoneBtn = document.getElementById('contactPhoneBtn');
      if (contactPhoneBtn) contactPhoneBtn.setAttribute('href', telHref);

      const mobileContactPhone = document.getElementById('mobileContactPhone');
      if (mobileContactPhone) mobileContactPhone.textContent = formattedPhone;

      const footerPhone = document.getElementById('footerPhone');
      if (footerPhone) footerPhone.textContent = formattedPhone;

      const footerPhoneLink = document.getElementById('footerPhoneLink');
      if (footerPhoneLink) footerPhoneLink.setAttribute('href', telHref);
    }

    // Update WhatsApp
    if (whatsapp) {
      let cleanWa = String(whatsapp).replace(/\D/g, '');
      if (cleanWa.startsWith('01')) cleanWa = '880' + cleanWa.substring(1);
      if (!cleanWa.startsWith('880')) cleanWa = '88' + cleanWa;
      const waHref = 'https://wa.me/' + cleanWa;

      const contactWhatsappBtn = document.getElementById('contactWhatsappBtn');
      if (contactWhatsappBtn) contactWhatsappBtn.setAttribute('href', waHref);

      const footerWaLink = document.getElementById('footerWaLink');
      if (footerWaLink) footerWaLink.setAttribute('href', waHref);
    }

    // Update Location / Address
    if (address) {
      const contactAddressDisplay = document.getElementById('contactAddressDisplay');
      if (contactAddressDisplay) {
        contactAddressDisplay.innerHTML = address.replace(/\n/g, '<br>');
      }

      const footerAddress = document.getElementById('footerAddress');
      if (footerAddress) footerAddress.textContent = address;
    }

    // Update Facebook URL
    if (facebook) {
      const footerFbLink = document.getElementById('footerFbLink');
      if (footerFbLink) footerFbLink.setAttribute('href', facebook);
    }
  }

  // ==========================================================================
  // Gallery Preview Loader
  // ==========================================================================

  /**
   * Fetches latest 4-6 gallery images from Firebase /gallery.
   * If Firebase is empty or offline, fallback static cards remain visible.
   */
  function loadGalleryPreview() {
    const db = (window.EverGain && window.EverGain.db) || 
               (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);

    if (!db) {
      // Static placeholders are already rendered in HTML
      return;
    }

    try {
      const galleryRef = db.ref('gallery').limitToLast(6);

      galleryRef.once('value').then(function (snapshot) {
        const val = snapshot.val();
        if (!val) return;

        const items = [];
        Object.keys(val).forEach(function (key) {
          items.push(Object.assign({ id: key }, val[key]));
        });

        // Show latest uploaded photos first
        items.reverse();

        if (items.length > 0) {
          renderGalleryPreview(items.slice(0, 6));
        }
      }).catch(function (error) {
        console.warn('[EVER GAIN] Notice: Gallery items could not be fetched from Firebase. Default view retained.', error.message);
      });
    } catch (err) {
      console.warn('[EVER GAIN] Gallery access error:', err);
    }
  }

  /**
   * Renders dynamic gallery preview items into #galleryPreviewGrid.
   * @param {Array<Object>} items
   */
  function renderGalleryPreview(items) {
    const grid = document.getElementById('galleryPreviewGrid');
    if (!grid || !items || items.length === 0) return;

    grid.innerHTML = '';

    items.forEach(function (item, index) {
      const card = document.createElement('div');
      card.className = 'gallery-item animate-in stagger-' + ((index % 6) + 1);

      const title = item.title || item.caption || 'EVER GAIN ইনডোর গ্রাউন্ড';
      const imageUrl = item.imageUrl || item.url || item.thumbnail || '';
      const isVideo = item.type === 'video';

      card.innerHTML = 
        '<div style="position: relative; overflow: hidden; border-radius: var(--radius-md); width: 100%; height: 100%;">' +
          (imageUrl
            ? '<img src="' + imageUrl + '" alt="EVER GAIN Turf" class="gallery-img" loading="lazy" style="width: 100%; height: 220px; object-fit: cover; display: block; transition: transform var(--transition-normal);">'
            : '<div class="gallery-img" style="height: 220px; background: linear-gradient(135deg, #103318 0%, #0d1f11 100%); display: flex; align-items: center; justify-content: center;"><i class="fas fa-futbol" style="font-size: 3rem; color: rgba(16, 185, 129, 0.4);"></i></div>') +
          '<div class="gallery-hover-indicator" aria-hidden="true"><i class="fas fa-expand"></i></div>' +
        '</div>';

      card.addEventListener('click', function () {
        window.location.href = 'gallery.html';
      });

      grid.appendChild(card);
    });

    // Re-initialize scroll animations for dynamically injected items
    if (window.EverGain && typeof EverGain.initScrollAnimations === 'function') {
      EverGain.initScrollAnimations();
    }
  }

  // ==========================================================================
  // Homepage Data Loader
  // ==========================================================================

  /**
   * Fetches /settings and /pricing from Firebase Realtime Database.
   * Subscribes to realtime updates with graceful offline handling.
   */
  function loadHomepageData() {
    const db = (window.EverGain && window.EverGain.db) || 
               (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);

    if (!db) {
      console.info('[EVER GAIN] Running with static default configuration.');
      return;
    }

    // 1. Realtime listener for /pricing
    try {
      const pricingRef = db.ref('pricing');
      pricingRef.on('value', function (snapshot) {
        const pricingData = snapshot.val();
        if (pricingData) {
          updatePricing(pricingData);
        }
      }, function (error) {
        console.warn('[EVER GAIN] /pricing listener notice:', error.message);
      });
    } catch (err) {
      console.warn('[EVER GAIN] Pricing ref attachment warning:', err);
    }

    // 2. Realtime listener for /settings
    try {
      const settingsRef = db.ref('settings');
      settingsRef.on('value', function (snapshot) {
        const settingsData = snapshot.val();
        if (settingsData) {
          updateContactPreview(settingsData);
        }
      }, function (error) {
        console.warn('[EVER GAIN] /settings listener notice:', error.message);
      });
    } catch (err) {
      console.warn('[EVER GAIN] Settings ref attachment warning:', err);
    }
  }

  // ==========================================================================
  // Animated Stats Counter (Smooth requestAnimationFrame Number Ticker)
  // ==========================================================================

  let countersAnimated = false;

  function setupStatsCounter() {
    const counterElements = document.querySelectorAll('.stat-counter-value[data-target]');
    if (!counterElements || counterElements.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      counterElements.forEach(function (el) {
        const target = parseInt(el.getAttribute('data-target'), 10);
        const isEn = window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en';
        el.textContent = isEn ? (target + '+') : (toBengaliNum(target) + '+');
      });
      return;
    }

    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countersAnimated) {
          countersAnimated = true;
          animateCounters(counterElements);
          obs.disconnect();
        }
      });
    }, { threshold: 0.25 });

    const container = document.getElementById('statsCounterGrid');
    if (container) {
      observer.observe(container);
    }
  }

  function animateCounters(elements) {
    elements.forEach(function (el) {
      const target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target)) return;

      const duration = 1600; // ms
      const startTime = performance.now();

      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentVal = Math.floor(easeOut * target);

        const isEn = window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en';
        const formatted = isEn ? currentVal : toBengaliNum(currentVal);
        el.textContent = target === 100 ? (formatted + '%') : (formatted + '+');

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          const finalFormatted = isEn ? target : toBengaliNum(target);
          el.textContent = target === 100 ? (finalFormatted + '%') : (finalFormatted + '+');
        }
      }

      requestAnimationFrame(update);
    });
  }

  // ==========================================================================
  // Interactive Match Calculator (Turf Duration & Cost Estimator)
  // ==========================================================================

  let calcState = {
    session: 'day', // 'day' | 'night'
    hours: 1,       // 1, 1.5, 2, 3
    type: 'normal'  // 'normal' | 'permanent'
  };

  function setupMatchCalculator() {
    // Session buttons
    const sessionBtns = document.querySelectorAll('#calcSessionGroup .calc-pill-btn');
    sessionBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        sessionBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        calcState.session = this.getAttribute('data-session');
        calculateTurfCost();
      });
    });

    // Duration buttons
    const durationBtns = document.querySelectorAll('#calcDurationGroup .calc-pill-btn');
    durationBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        durationBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        calcState.hours = parseFloat(this.getAttribute('data-hours'));
        calculateTurfCost();
      });
    });

    // Type buttons
    const typeBtns = document.querySelectorAll('#calcTypeGroup .calc-pill-btn');
    typeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        typeBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        calcState.type = this.getAttribute('data-type');
        calculateTurfCost();
      });
    });

    calculateTurfCost();
  }

  function calculateTurfCost() {
    const isEn = window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en';

    // Pricing base
    const pricing = cachedPricingData || {};
    const dayRate = Number(pricing.dayPrice || pricing.day || 550);
    const nightRate = Number(pricing.nightPrice || pricing.night || 900);
    const discount = Number(pricing.discount || 50);

    const baseRate = calcState.session === 'day' ? dayRate : nightRate;
    const effectiveRate = calcState.type === 'permanent' ? Math.max(0, baseRate - discount) : baseRate;
    const totalCost = Math.round(effectiveRate * calcState.hours);
    const totalSavings = Math.round(discount * calcState.hours);

    // Update Price Display
    const resultPriceEl = document.getElementById('calcResultPrice');
    if (resultPriceEl) {
      resultPriceEl.textContent = formatPriceBengali(totalCost);
    }

    // Update Savings Badge
    const saveNoticeEl = document.getElementById('calcSaveNotice');
    if (saveNoticeEl) {
      if (calcState.type === 'permanent') {
        saveNoticeEl.style.display = 'inline-flex';
        saveNoticeEl.textContent = isEn
          ? ('VIP Discount: Save ৳' + totalSavings + ' (৳50/hr)')
          : ('স্থায়ী বুকিং ছাড়: মোট ৳' + toBengaliNum(totalSavings) + ' সাশ্রয় (ঘণ্টাপ্রতি ৳৫০)');
      } else {
        saveNoticeEl.style.display = 'none';
      }
    }

    // Update Summary Text
    const summaryTextEl = document.getElementById('calcSummaryText');
    if (summaryTextEl) {
      const hoursLabel = isEn
        ? (calcState.hours + (calcState.hours === 1 ? ' Hour ' : ' Hours '))
        : (toBengaliNum(calcState.hours) + ' ঘণ্টা ');
      const sessionLabel = isEn
        ? (calcState.session === 'day' ? 'Day Match • ' : 'Night Match • ')
        : (calcState.session === 'day' ? 'ডে ম্যাচ • ' : 'নাইট ম্যাচ • ');
      const typeLabel = isEn
        ? (calcState.type === 'permanent' ? 'Weekly Permanent Booking' : 'Single Normal Match')
        : (calcState.type === 'permanent' ? 'সাপ্তাহিক স্থায়ী বুকিং' : 'সাধারণ ম্যাচ');

      summaryTextEl.textContent = hoursLabel + sessionLabel + typeLabel;
    }

    // Update CTA link
    const bookBtn = document.getElementById('calcBookNowBtn');
    if (bookBtn) {
      if (calcState.type === 'permanent') {
        bookBtn.href = 'booking.html?mode=permanent&session=' + calcState.session;
      } else {
        bookBtn.href = 'booking.html?type=' + calcState.session;
      }
    }
  }

  // ==========================================================================
  // Live BST Clock & Arena Pulse
  // ==========================================================================

  function setupLiveClock() {
    const clockEl = document.getElementById('liveClockDisplay');
    if (!clockEl) return;

    function tick() {
      try {
        const now = new Date();
        const bdTime = new Date(now.getTime() + (now.getTimezoneOffset() + 360) * 60000);
        let hours = bdTime.getHours();
        const minutes = bdTime.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;

        const paddedMins = minutes < 10 ? '0' + minutes : minutes;
        const paddedHours = hours < 10 ? '0' + hours : hours;

        const isEn = window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en';
        if (isEn) {
          clockEl.textContent = 'BST: ' + paddedHours + ':' + paddedMins + ' ' + ampm + ' (24/7 Open)';
        } else {
          clockEl.textContent = 'বাংলাদেশ সময়: ' + toBengaliNum(paddedHours) + ':' + toBengaliNum(paddedMins) + ' ' + ampm + ' (২৪/৭ খোলা)';
        }
      } catch (e) {}
    }

    tick();
    setInterval(tick, 15000);
  }

  // ==========================================================================
  // Floating Actions (WhatsApp & Back-to-Top)
  // ==========================================================================

  function setupFloatingActions() {
    const topBtn = document.getElementById('floatingTopBtn');
    if (topBtn) {
      window.addEventListener('scroll', function () {
        if (window.scrollY > 380) {
          topBtn.classList.add('visible');
        } else {
          topBtn.classList.remove('visible');
        }
      }, { passive: true });

      topBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ==========================================================================
  // 3D Card Hover Interaction
  // ==========================================================================

  function setupCardHoverEffects() {
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      const cards = document.querySelectorAll('.card, .stat-counter-card, .pricing-card');
      cards.forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left - (rect.width / 2);
          const y = e.clientY - rect.top - (rect.height / 2);
          const mult = 0.03;
          card.style.transform = 'perspective(800px) rotateX(' + (-y * mult) + 'deg) rotateY(' + (x * mult) + 'deg) translateY(-4px)';
        });
        card.addEventListener('mouseleave', function () {
          card.style.transform = '';
        });
      });
    }
  }

  // ==========================================================================
  // Application Entry Point
  // ==========================================================================

  /**
   * Main initialization function for the homepage.
   */
  function init() {
    // 1. Initialize UI core behaviors from EverGain namespace
    if (window.EverGain) {
      if (typeof EverGain.initParticles === 'function') {
        EverGain.initParticles('particleCanvas');
      }
      if (typeof EverGain.initNavigation === 'function') {
        EverGain.initNavigation();
      }
      if (typeof EverGain.initScrollAnimations === 'function') {
        EverGain.initScrollAnimations();
      }
    }

    // 2. Setup interactive components
    setupMobileMenu();
    setupHeroAnimations();
    setActiveNavLink();
    setupStatsCounter();
    setupMatchCalculator();
    setupLiveClock();
    setupFloatingActions();
    setupCardHoverEffects();

    // 3. Load dynamic database values
    loadHomepageData();
    loadGalleryPreview();

    // 4. Listen for language changes
    window.addEventListener('evergain:languageChanged', function () {
      if (cachedPricingData) {
        updatePricing(cachedPricingData);
      }
      calculateTurfCost();
      setupLiveClock();
    });
  }

  // Export functions to window and EverGain for testability and extensibility
  window.init = init;
  window.loadHomepageData = loadHomepageData;
  window.loadGalleryPreview = loadGalleryPreview;
  window.updatePricing = updatePricing;
  window.updateContactPreview = updateContactPreview;
  window.setupMobileMenu = setupMobileMenu;
  window.setupHeroAnimations = setupHeroAnimations;

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
