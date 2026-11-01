/**
 * EVER GAIN — Indoor Football Booking Platform
 * Firebase Configuration & Shared Utilities
 *
 * Requirements for HTML pages:
 * <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
 * <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-storage-compat.js"></script>
 * <script src="firebase-config.js"></script>
 */

(function (window) {
  'use strict';

  // Initialize global namespace
  const EverGain = window.EverGain || {};

  // ==========================================================================
  // 1. Firebase Configuration & Initialization
  // ==========================================================================

  /**
   * Firebase credentials placeholder.
   * Replace these with your actual Firebase Project Settings.
   */
  const firebaseConfig = {
    apiKey: "AIzaSyAvKNyE6EMYD5TfxhoP_9AKZngKXetiuF4",
    authDomain: "evergain109.firebaseapp.com",
    databaseURL: "https://evergain109-default-rtdb.firebaseio.com",
    projectId: "evergain109",
    storageBucket: "evergain109.firebasestorage.app",
    messagingSenderId: "465959115596",
    appId: "1:465959115596:web:2e2190cf7da1dd43da0de9",
    measurementId: "G-814P2L61V5"
  };

  let app = null;
  let db = null;
  let auth = null;
  let storage = null;

  try {
    if (typeof firebase !== 'undefined') {
      if (!firebase.apps || firebase.apps.length === 0) {
        app = firebase.initializeApp(firebaseConfig);
      } else {
        app = firebase.app();
      }

      db = firebase.database();
      auth = firebase.auth();
      storage = firebase.storage();
    } else {
      console.warn('[EVER GAIN] Firebase compat SDK not detected in window. Ensure Firebase scripts are loaded before firebase-config.js.');
    }
  } catch (error) {
    console.error('[EVER GAIN] Error initializing Firebase:', error);
  }

  // Attach core instances to namespace
  EverGain.firebaseConfig = firebaseConfig;
  EverGain.app = app;
  EverGain.db = db;
  EverGain.auth = auth;
  EverGain.storage = storage;

  // Also expose to window for convenience
  window.db = db;
  window.auth = auth;
  window.storage = storage;

  // ==========================================================================
  // 2. Shared Utility Functions
  // ==========================================================================

  /**
   * Converts English numerals (0-9) to Bengali numerals (০-৯).
   * @param {number|string} num
   * @returns {string}
   */
  function toBengaliNum(num) {
    if (num === null || num === undefined) return '';
    const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, function (d) {
      return bengaliDigits[Number(d)];
    });
  }

  /**
   * Displays a toast notification inside #toastContainer.
   * Auto-dismisses after 3 seconds with smooth animation.
   * @param {string} message - Message text to display (Bengali supported)
   * @param {string} [type='info'] - 'success' | 'error' | 'warning' | 'info'
   */
  function showToast(message, type) {
    type = type || 'info';

    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    let iconClass = 'fa-circle-info';
    if (type === 'success') {
      iconClass = 'fa-circle-check';
    } else if (type === 'error') {
      iconClass = 'fa-circle-exclamation';
    } else if (type === 'warning') {
      iconClass = 'fa-triangle-exclamation';
    }

    toast.innerHTML = 
      '<div class="toast-content">' +
        '<i class="fas ' + iconClass + ' toast-icon" aria-hidden="true"></i>' +
        '<span class="toast-message">' + message + '</span>' +
      '</div>' +
      '<button type="button" class="toast-close" aria-label="বন্ধ করুন">&times;</button>';

    const closeBtn = toast.querySelector('.toast-close');
    let isDismissed = false;

    function dismissToast() {
      if (isDismissed) return;
      isDismissed = true;
      toast.classList.add('fade-out');
      setTimeout(function () {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }

    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissToast();
    });

    toast.addEventListener('click', dismissToast);

    container.appendChild(toast);

    // Auto dismiss after 3 seconds
    setTimeout(dismissToast, 3000);
  }

  /**
   * Formats a date string, timestamp, or Date object to Bengali format.
   * Example: '১৫ অক্টোবর ২০২৬, বৃহস্পতিবার'
   * @param {string|number|Date} dateStr
   * @returns {string}
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';

    let d;
    if (dateStr instanceof Date) {
      d = dateStr;
    } else if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD parse without timezone drift
      const parts = dateStr.split('-');
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(dateStr);
    }

    if (isNaN(d.getTime())) return String(dateStr);

    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const bengaliDays = [
      'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
    ];

    const day = toBengaliNum(d.getDate());
    const month = bengaliMonths[d.getMonth()];
    const year = toBengaliNum(d.getFullYear());
    const dayOfWeek = bengaliDays[d.getDay()];

    return day + ' ' + month + ' ' + year + ', ' + dayOfWeek;
  }

  /**
   * Formats amount to Bangladeshi Taka standard format (e.g. '৳550').
   * @param {number|string} amount
   * @returns {string}
   */
  function formatPrice(amount) {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '৳0';
    }
    const cleanAmount = Math.round(Number(amount));
    return '৳' + cleanAmount;
  }

  /**
   * Formats a Bangladeshi phone number into standard display format.
   * Example: '01712-345678' or '+880 1712-345678'
   * @param {string} phone
   * @returns {string}
   */
  function formatPhone(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');

    // If starts with 880 (13 digits total)
    if (digits.startsWith('880') && digits.length === 13) {
      const part1 = digits.substring(3, 8); // e.g. 01712
      const part2 = digits.substring(8);    // e.g. 345678
      return '+880 ' + part1 + '-' + part2;
    }

    // If starts with 01 (11 digits total)
    if (digits.startsWith('01') && digits.length === 11) {
      const part1 = digits.substring(0, 5); // 01712
      const part2 = digits.substring(5);    // 345678
      return part1 + '-' + part2;
    }

    // Default clean output
    return String(phone).trim();
  }

  /**
   * Validates Bangladeshi mobile phone numbers.
   * Valid formats: +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX (Operators 3-9)
   * @param {string} phone
   * @returns {boolean}
   */
  function validatePhone(phone) {
    if (!phone) return false;
    const clean = String(phone).replace(/[\s\-\(\)]/g, '');
    const bdPhoneRegex = /^(?:\+?880|0)?1[3-9]\d{8}$/;
    return bdPhoneRegex.test(clean);
  }

  /**
   * Validates customer name (Bengali and Latin letters, spaces, dots, hyphens).
   * Minimum 2 characters, maximum 60 characters.
   * @param {string} name
   * @returns {boolean}
   */
  function validateName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) return false;
    // Allow Bengali Unicode block (\u0980-\u09FF), Latin letters, spaces, dots, hyphens
    const nameRegex = /^[\u0980-\u09FFA-Za-z\s\.\-']+$/;
    return nameRegex.test(trimmed);
  }

  /**
   * Generates a unique booking/transaction identifier.
   * Format: EG-YYMMDD-XXXX (e.g. EG-261031-7K9A)
   * @returns {string}
   */
  function generateId() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'EG-' + yy + mm + dd + '-' + randomHex;
  }

  /**
   * Returns current time and date in Asia/Dhaka timezone (UTC+6).
   * @returns {{
   *   date: Date,
   *   timestamp: number,
   *   dateStr: string,
   *   timeStr: string,
   *   fullISO: string,
   *   bengaliDate: string
   * }}
   */
  function getCurrentBDTime() {
    const now = new Date();
    // UTC offset in milliseconds
    const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
    // Dhaka is UTC + 6 hours
    const dhakaMs = utcMs + (6 * 3600000);
    const dhakaDate = new Date(dhakaMs);

    const year = dhakaDate.getFullYear();
    const month = String(dhakaDate.getMonth() + 1).padStart(2, '0');
    const day = String(dhakaDate.getDate()).padStart(2, '0');
    const hours = String(dhakaDate.getHours()).padStart(2, '0');
    const minutes = String(dhakaDate.getMinutes()).padStart(2, '0');

    const dateStr = year + '-' + month + '-' + day;
    const timeStr = hours + ':' + minutes;

    return {
      date: dhakaDate,
      timestamp: dhakaDate.getTime(),
      dateStr: dateStr,
      timeStr: timeStr,
      fullISO: dhakaDate.toISOString(),
      bengaliDate: formatDate(dateStr)
    };
  }

  /**
   * Debounces a function execution.
   * @param {Function} fn
   * @param {number} [delay=300]
   * @returns {Function}
   */
  function debounce(fn, delay) {
    delay = delay || 300;
    let timer = null;
    return function () {
      const context = this;
      const args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(context, args);
      }, delay);
    };
  }

  // ==========================================================================
  // 3. UI Background & Interactive Systems
  // ==========================================================================

  /**
   * Initializes the particle background system.
   * Subtle floating green dots with faint linking lines.
   * Performance-optimized: max 30 particles.
   * @param {string} [canvasId='particleCanvas']
   */
  function initParticles(canvasId) {
    canvasId = canvasId || 'particleCanvas';
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Disable canvas loop on mobile (<= 768px) and for reduced-motion to ensure 120 FPS zero-lag scrolling
    if (window.innerWidth <= 768 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      canvas.style.display = 'none';
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId = null;
    let isScrolling = false;
    let scrollTimer = null;

    function resize() {
      if (window.innerWidth <= 768) {
        canvas.style.display = 'none';
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
      }
      canvas.style.display = 'block';
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener('resize', debounce(resize, 200), { passive: true });

    // Pause particle rendering during active scroll to reserve 100% GPU for 120 FPS scroll response
    window.addEventListener('scroll', function () {
      isScrolling = true;
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        isScrolling = false;
      }, 150);
    }, { passive: true });

    // Particle pool: 24 lightweight particles
    const MAX_PARTICLES = 24;
    const particles = [];
    const colors = [
      'rgba(16, 185, 129, ', // Primary emerald
      'rgba(52, 211, 153, ', // Light emerald
      'rgba(132, 204, 22, '  // Accent lime
    ];

    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.4 + 1.0,
        colorBase: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.22 + 0.12,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35
      });
    }

    function render() {
      // If user is actively scrolling, skip drawing this frame
      if (isScrolling) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Draw faint connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 85) {
            const lineAlpha = (1 - dist / 85) * 0.10;
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(16, 185, 129, ' + lineAlpha + ')';
            ctx.lineWidth = 0.7;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      for (let k = 0; k < particles.length; k++) {
        const p = particles[k];

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries smoothly
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + p.alpha + ')';
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    }

    render();

    // Pause animation when tab is inactive to save battery
    document.addEventListener('visibilitychange', function () {
      if (document.hidden && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      } else if (!document.hidden && !animationFrameId && window.innerWidth > 768) {
        animationFrameId = requestAnimationFrame(render);
      }
    });

    // Clean up on page unload
    window.addEventListener('beforeunload', function () {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    });
  }

  /**
   * Initializes navigation bar behaviors:
   * - Scroll effect (adds shadow and background elevation on scroll)
   * - Mobile slide menu open/close toggle
   * - Sets active nav link according to current URL
   */
  function initNavigation() {
    const navbar = document.querySelector('.navbar') || document.getElementById('navbar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn') || document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobileMenu') || document.querySelector('.mobile-menu');

    // 1. Scroll shadow effect
    function handleScroll() {
      if (!navbar) return;
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // 2. Mobile Menu Toggle
    if (mobileMenuBtn && mobileMenu) {
      if (mobileMenuBtn.dataset.navBound === 'true') {
        return;
      }
      mobileMenuBtn.dataset.navBound = 'true';

      mobileMenuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = mobileMenu.classList.toggle('active');
        mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';

        // Change icon between fa-bars and fa-xmark
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
          if (isOpen) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-xmark');
          } else {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
          }
        }
      });

      // Close mobile menu when clicking close button
      const closeButtons = mobileMenu.querySelectorAll('#mobileMenuClose, .mobile-menu-close, .modal-close');
      closeButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          mobileMenu.classList.remove('active');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          const icon = mobileMenuBtn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
          }
        });
      });

      // Close mobile menu when clicking any link inside it
      const mobileLinks = mobileMenu.querySelectorAll('a');
      mobileLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          mobileMenu.classList.remove('active');
          mobileMenuBtn.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
          const icon = mobileMenuBtn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-xmark');
            icon.classList.add('fa-bars');
          }
        });
      });

      // Close mobile menu on outside click
      document.addEventListener('click', function (e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          if (mobileMenu.classList.contains('active')) {
            mobileMenu.classList.remove('active');
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
              icon.classList.remove('fa-xmark');
              icon.classList.add('fa-bars');
            }
          }
        }
      });
    }

    // 3. Set active link based on current page
    let currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (!currentPath || currentPath === '') {
      currentPath = 'index.html';
    }

    // Top desktop nav links
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href) {
        const linkPage = href.split('/').pop();
        if (linkPage === currentPath || (currentPath === 'index.html' && (linkPage === '' || linkPage === './'))) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      }
    });

    // Mobile bottom nav items
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    bottomNavItems.forEach(function (item) {
      const href = item.getAttribute('href');
      if (href) {
        const linkPage = href.split('/').pop();
        if (linkPage === currentPath || (currentPath === 'index.html' && (linkPage === '' || linkPage === './'))) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });
  }

  /**
   * Initializes scroll animations using IntersectionObserver for elements
   * with the .animate-in CSS class.
   */
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-in');
    if (!animatedElements || animatedElements.length === 0) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      });

      animatedElements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      animatedElements.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  // ==========================================================================
  // 4. Admin Authentication & Role Verification
  // ==========================================================================

  /**
   * Checks whether the current user is an authenticated administrator.
   * Verifies Firebase Auth user existence and validates against the /admins node.
   * @returns {Promise<{isAdmin: boolean, user: Object|null}>}
   */
  function checkAdminAuth() {
    return new Promise(function (resolve) {
      if (!auth) {
        console.warn('[EVER GAIN] Firebase Auth instance not available.');
        resolve({ isAdmin: false, user: null });
        return;
      }

      // Check current auth state
      const unsubscribe = auth.onAuthStateChanged(function (user) {
        unsubscribe();

        if (!user) {
          resolve({ isAdmin: false, user: null });
          return;
        }

        // Validate user against Realtime Database /admins node
        if (!db) {
          // If DB is offline or not configured, allow fallback check if custom claims or placeholder
          resolve({ isAdmin: false, user: user });
          return;
        }

        const adminRef = db.ref('admins/' + user.uid);
        adminRef.once('value').then(function (snapshot) {
          const val = snapshot.val();
          if (val === true || (val && val.role === 'admin') || (val && val.active === true)) {
            resolve({ isAdmin: true, user: user });
          } else {
            resolve({ isAdmin: false, user: user });
          }
        }).catch(function (err) {
          console.error('[EVER GAIN] Error verifying admin permissions:', err);
          resolve({ isAdmin: false, user: user });
        });
      });
    });
  }

  /**
   * Signs out the current admin and redirects to the public home page.
   * @returns {Promise<void>}
   */
  function signOutAdmin() {
    if (!auth) {
      window.location.href = 'index.html';
      return Promise.resolve();
    }

    return auth.signOut().then(function () {
      showToast('সফলভাবে লগআউট হয়েছে', 'info');
      setTimeout(function () {
        window.location.href = 'index.html';
      }, 500);
    }).catch(function (err) {
      console.error('[EVER GAIN] Sign out error:', err);
      window.location.href = 'index.html';
    });
  }

  // ==========================================================================
  // 4.5. Bilingual Localization System (Bangla / English)
  // ==========================================================================
  const TRANSLATIONS = {
    bn: {
      // Navigation & Global
      navHome: 'হোম',
      navBooking: 'বুকিং',
      navGallery: 'গ্যালারি',
      navRules: 'নিয়মাবলী',
      navContact: 'যোগাযোগ',
      navAdmin: 'এডমিন',
      adminEntry: 'অ্যাডমিন প্রবেশ',
      allRights: '© ২০২৬ EVER GAIN. সর্বস্বত্ব সংরক্ষিত।',
      openHours: '২৪/৭ খোলা (সার্বক্ষণিক উন্মুক্ত)',
      open247Badge: '২৪/৭ সার্বক্ষণিক খোলা',
      quickLinks: 'প্রয়োজনীয় লিংক',
      hoursPricing: 'গ্রাউন্ড তথ্য',
      callUs: 'সরাসরি কল দিন',
      messageUs: 'হোয়াটসঅ্যাপ চ্যাট',
      mapDirections: 'গুগল ম্যাপে দিকনির্দেশনা',
      footerDesc: 'আপনার ইনডোর ফুটবলের সেরা গন্তব্য। আধুনিক সিন্থেটিক টার্ফ ও আন্তর্জাতিক মানের ফ্লাডলাইটে দিন ও রাতে সেরা খেলার অভিজ্ঞতা।',
      hotlineLabel: 'সরাসরি হোয়াটসঅ্যাপে বুকিং সহায়তা',
      bookNow: 'এখনই বুকিং দিন',
      viewGallery: 'গ্যালারি দেখুন',
      perHour: '/ ঘণ্টা',

      // Hero Section
      heroBadge: 'প্রিমিয়াম ইনডোর ফুটবল গ্রাউন্ড',
      heroHeadline: 'আপনার ইনডোর ফুটবলের সেরা গন্তব্য',
      heroDesc: 'বৃষ্টি, কাদা কিংবা প্রখর রোদের চিন্তা ছেড়ে দিন! বিশ্বমানের সিন্থেটিক টার্ফ, শক্তিশালী ফ্লিকার-ফ্রি লাইটিং ও বন্ধুসুলভ পরিবেশে দিন ও রাতে বন্ধুদের নিয়ে উপভোগ করুন ইনডোর ফুটবলের আসল উন্মাদনা।',

      // Quick Booking Section
      quickBooking: 'বুকিং ক্যাটাগরি',
      quickBookingSubtitle: 'আপনার সুবিধাজনক সময়ে ইনডোর ফুটবলের অনন্য অভিজ্ঞতা উপভোগ করুন',
      dayBooking: 'ডে বুকিং',
      daySaveBadge: '৳৫০ বিশেষ ছাড়',
      dayBookingDesc: 'সকাল ৬:০০ টা থেকে বিকেল ৫:০০ টা পর্যন্ত। খোলামেলা মনোরম পরিবেশ ও প্রাকৃতিক আলোয় প্রাণবন্ত ফুটবল ম্যাচ খেলুন বন্ধুদের সাথে।',
      bookDaySlot: 'স্লট বুক করুন',
      nightBooking: 'নাইট বুকিং',
      nightSaveBadge: 'আন্তর্জাতিক ফ্লাডলাইট',
      nightBookingDesc: 'সন্ধ্যা ৬:০০ টা থেকে মধ্যরাত ও ২৪/৭। হাই-লুমেন এনার্জি-সেভিং ফ্লিকার-ফ্রি ফ্লাডলাইট ও আরামদায়ক রাতের আবহাওয়ায় সেরা খেলা।',
      bookNightSlot: 'স্লট বুক করুন',

      // Pricing Section
      pricingTitle: 'মূল্য তালিকা ও সাশ্রয়ী অফার',
      pricingSubtitle: 'সকলের সাধ্যের মধ্যে সেরা সুবিধা ও পেশাদার ইনডোর গ্রাউন্ডের নিশ্চয়তা',
      normalDayPricing: 'সাধারণ ডে বুকিং',
      normalNightPricing: 'সাধারণ নাইট বুকিং',
      permanentDayPricing: 'স্থায়ী ডে বুকিং',
      permanentNightPricing: 'স্থায়ী নাইট বুকিং',
      hourlyDiscountNote: 'ঘণ্টাপ্রতি সরাসরি ৳৫০ নিশ্চিত সাশ্রয়',

      // Why Choose Us
      whyChooseTitle: 'কেন EVER GAIN বেছে নিবেন?',
      whyChooseSubtitle: 'আন্তর্জাতিক মান ও সর্বোচ্চ স্বাচ্ছন্দ্যের আধুনিক ইনডোর ফুটবল টার্ফ',
      feature1Title: 'আন্তর্জাতিক মানের সিন্থেটিক টার্ফ',
      feature1Desc: 'উন্নত শক-অ্যাবজর্বিং টার্ফ যা খেলোয়াড়দের ইনজুরি ঝুঁকি কমায় এবং মসৃণ বল রোলিং নিশ্চিত করে।',
      feature2Title: 'পেশাদার অ্যান্টি-গ্লেয়ার ফ্লাডলাইটিং',
      feature2Desc: 'চোখে কোনো বিভ্রান্তি ছাড়া প্রতিটি কর্নার স্পষ্ট দেখার জন্য আন্তর্জাতিক মানের ব্যালেন্সড আলো।',
      feature3Title: '২৪/৭ সার্বক্ষণিক গ্রাউন্ড উন্মুক্ত',
      feature3Desc: 'দিন হোক কিংবা গভীর রাত—যেকোনো সময়ে আপনার দল নিয়ে খেলা শুরু করার পূর্ণ স্বাধীনতা।',
      feature4Title: 'সহজ ও নির্ভরযোগ্য অনলাইন বুকিং',
      feature4Desc: 'মোবাইল থেকে মাত্র ৩ ক্লিকেই পছন্দের স্লট নির্বাচন ও রিয়েল-টাইম বুকিং রিকোয়েস্ট জমা দেওয়ার সুবিধা।',
      feature5Title: 'নিরাপদ, পরিচ্ছন্ন ও সুশৃঙ্খল পরিবেশ',
      feature5Desc: 'খেলোয়াড় ও দর্শকদের জন্য স্বাস্থ্যকর বসার জায়গা, বিশুদ্ধ পানি এবং সার্বক্ষণিক নিরাপত্তা নজরদারি।',
      feature6Title: 'স্থায়ী বুকিংয়ে নিশ্চিত সাশ্রয়',
      feature6Desc: 'সাপ্তাহিক স্থায়ী বুকিংয়ে প্রতিটি ম্যাচের প্রতি ঘণ্টায় সরাসরি ৳৫০ নিশ্চিত ছাড় এবং স্লট লক সুবিধা।',

      // Gallery Preview
      gallerySectionTitle: 'আমাদের ইনডোর গ্রাউন্ড',
      gallerySectionSubtitle: 'বিশ্বমানের টার্ফ, আলোকসজ্জা এবং প্রাণবন্ত ফুটবল মুহূর্তের এক ঝলক',
      viewFullGallery: 'সম্পূর্ণ গ্যালারি দেখুন',

      // Permanent Booking Highlight
      permanentBadge: 'বিশেষ নিয়মিত অফার',
      permanentTitle: 'স্থায়ী বুকিং',
      permanentSubtitle: 'আপনার প্রিয় দলের জন্য প্রতি সপ্তাহের নির্দিষ্ট দিন ও স্লট নিশ্চিত করুন',
      permanentDesc: 'আপনি বা আপনার টিম কি নিয়মিত ফুটবল খেলেন? EVER GAIN স্থায়ী বুকিং সুবিধার মাধ্যমে আপনি প্রতি সপ্তাহের জন্য একটি নির্দিষ্ট দিন ও নির্দিষ্ট সময় স্থায়ীভাবে বুক করে রাখতে পারবেন। স্লট হারিয়ে যাওয়ার কোনো ঝুঁকি নেই এবং প্রতিটি ম্যাচের প্রতি ঘণ্টায় উপভোগ করবেন সরাসরি ৳৫০ নিশ্চিত ছাড়!',
      permanentCondTitle: 'স্থায়ী বুকিংয়ের প্রধান শর্তাবলী',
      permanentCondHighlight: 'প্রতি সপ্তাহে অন্তত ১টি ম্যাচ খেলতে হবে',
      permanentCondNote: 'স্থায়ী বুকিং সচল রাখতে সপ্তাহে ন্যূনতম একটি ম্যাচ আয়োজন করা আবশ্যক। কোনো সপ্তাহে অপারগ হলে অন্তত ২৪ ঘণ্টা পূর্বে জানিয়ে রিশিডিউল করতে হবে।',
      permPoint1Title: 'নির্দিষ্ট স্লট নিশ্চিত',
      permPoint1Desc: 'অন্য কেউ আপনার স্লট বুক করতে পারবে না',
      permPoint2Title: 'ঘণ্টাপ্রতি ৳৫০ সাশ্রয়',
      permPoint2Desc: 'ডে ও নাইট উভয় স্লটেই প্রযোজ্য',
      permPoint3Title: 'ভিআইপি হেল্পলাইন',
      permPoint3Desc: 'সরাসরি হোয়াটসঅ্যাপে সার্বক্ষণিক সহায়তা',
      permanentCta: 'স্থায়ী বুকিং করুন',

      // Contact Preview
      contactPreviewTitle: 'যোগাযোগ ও অবস্থান',
      contactPreviewSubtitle: 'যেকোনো প্রশ্ন, স্লট যাচাই কিংবা সরাসরি কথা বলতে আমাদের সাথে যোগাযোগ করুন',
      phoneCardTitle: 'মোবাইল ফোন',
      phoneCardDesc: 'সরাসরি বুকিং ও অনুসন্ধানের জন্য কল দিন',
      waCardTitle: 'হোয়াটসঅ্যাপ',
      waCardDesc: 'তাৎক্ষণিক চ্যাট ও স্লট ভেরিফিকেশন',
      locCardTitle: 'গ্রাউন্ড লোকেশন',
      locCardDesc: 'আমাদের ইনডোর ফুটবল গ্রাউন্ডে পৌঁছান',
      viewMapBtn: 'গুগল ম্যাপে দেখুন',

      // Booking Page Wizard
      bookingPageTitle: 'টার্ফ অনলাইন বুকিং',
      bookingPageSubtitle: 'আপনার প্রিয় স্লটটি বেছে নিন এবং ঝামেলাহীনভাবে ফুটবল খেলার আনন্দ উপভোগ করুন',
      step1: 'ক্যাটাগরি',
      step2: 'তারিখ ও সময়',
      step3: 'তথ্য',
      step4: 'নিশ্চিত',
      step1Title: 'ধাপ ১: বুকিং ক্যাটাগরি ও সেশন নির্বাচন করুন',
      step1Subtitle: 'সাধারণ একক ম্যাচের বুকিং নাকি নিয়মিত দল হিসেবে স্থায়ী সাপ্তাহিক বুকিং?',
      normalCardTitle: 'সাধারণ বুকিং',
      normalCardDesc: 'একক ম্যাচ বা অনিয়মিত খেলার জন্য',
      permanentCardTitle: 'স্থায়ী বুকিং',
      permanentCardDesc: 'সাপ্তাহিক নিয়মিত দল ও ফিক্সড স্লট',
      daySessionTitle: 'ডে সেশন',
      daySessionHours: 'সকাল ৬:০০ - বিকাল ৫:০০',
      nightSessionTitle: 'নাইট সেশন',
      nightSessionHours: 'সন্ধ্যা ৬:০০ - রাত ১২:০০+',
      nextStepBtn: 'পরবর্তী ধাপ',
      prevStepBtn: 'পূর্ববর্তী ধাপ',
      step2TitleNormal: 'ধাপ ২: তারিখ ও সময় স্লট নির্বাচন করুন',
      step2TitlePermanent: 'ধাপ ২: সাপ্তাহিক দিন ও সময় স্লট নির্বাচন করুন',
      chooseDateLabel: 'খেলার তারিখ বেছে নিন (পরবর্তী ১৪ দিন):',
      chooseWeekdayLabel: 'সাপ্তাহিক স্থায়ী দিন বেছে নিন:',
      chooseSlotLabel: 'উপলব্ধ সময় স্লট নির্বাচন করুন:',
      legendAvailable: 'খালি স্লট',
      legendSelected: 'নির্বাচিত স্লট',
      legendBooked: 'বুকড',
      legendPending: 'অপেক্ষমাণ',
      step3Title: 'ধাপ ৩: আপনার যোগাযোগের তথ্য দিন',
      step3Subtitle: 'বুকিং নিশ্চিত করতে নাম ও মোবাইল নম্বর পূরণ করুন',
      nameLabel: 'আপনার নাম *',
      namePlaceholder: 'আপনার পূর্ণ নাম লিখুন',
      phoneLabel: 'মোবাইল নম্বর *',
      phonePlaceholder: '১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)',
      msgLabel: 'অতিরিক্ত বার্তা (ঐচ্ছিক)',
      msgPlaceholder: 'কোনো বিশেষ অনুরোধ থাকলে লিখুন...',
      mandatoryCondLabel: 'স্থায়ী বুকিং করলে প্রতি সপ্তাহে অন্তত ১টি ম্যাচ খেলতে হবে। এটি বাধ্যতামূলক।',
      step4Title: 'ধাপ ৪: বুকিংয়ের বিস্তারিত পর্যালোচনা ও নিশ্চিতকরণ',
      step4Subtitle: 'সব তথ্য সঠিক আছে কিনা যাচাই করে বুকিং সাবমিট করুন',
      summaryTypeLabel: 'বুকিং ধরন:',
      summarySessionLabel: 'সেশন:',
      summaryDateLabel: 'খেলার তারিখ:',
      summarySlotLabel: 'সময় স্লট:',
      summaryNameLabel: 'গ্রাহকের নাম:',
      summaryPhoneLabel: 'মোবাইল নম্বর:',
      summaryPriceLabel: 'মোট বুকিং ফি:',
      disclaimerText: 'বুকিং জমা দেওয়ার পর অনুমোদনের জন্য অপেক্ষা করুন। এডমিন কনফার্ম করলে বুকিং চূড়ান্ত হবে।',
      submitBtnText: 'বুকিং জমা দিন',
      modalSuccessTitle: 'বুকিং সফলভাবে জমা হয়েছে!',
      modalSuccessMsg: 'আপনার বুকিং রিকোয়েস্ট জমা হয়েছে। অনুমোদনের জন্য অপেক্ষা করুন। আমাদের টিম দ্রুত আপনার সাথে যোগাযোগ করবে।',
      newBookingBtn: 'নতুন বুকিং করুন',
      viewStatusBtn: 'স্ট্যাটাস দেখুন',
      searchStatusTitle: 'বুকিং স্ট্যাটাস অনুসন্ধান',
      searchStatusSubtitle: 'আপনার মোবাইল নম্বর দিয়ে পূর্বে করা বুকিংয়ের বর্তমান অবস্থা ও ইতিহাস দেখুন',
      searchStatusBtn: 'স্ট্যাটাস অনুসন্ধান করুন',
      statusPhonePlaceholder: 'আপনার ১১ ডিজিটের মোবাইল নম্বর দিন',

      // Rules Page
      rulesTitle: 'গ্রাউন্ড নিয়মাবলী',
      rulesSubtitle: 'EVER GAIN ইনডোর ফুটবল গ্রাউন্ডে সবার জন্য আনন্দদায়ক ও নিরাপদ খেলার পরিবেশ বজায় রাখার নির্দেশিকা',
      rulesBadge: 'সুশৃঙ্খল ও নিরাপদ খেলা',
      rule1Title: 'সময়মতো উপস্থিত থাকুন',
      rule1Desc: 'আপনার বুকিং শুরুর অন্তত ১০ মিনিট আগে গ্রাউন্ডে পৌঁছান। নির্ধারিত সময় শেষে পরবর্তী দলের জন্য মাঠ ছেড়ে দিন।',
      rule2Title: 'সঠিক স্পোর্টস জুতো ব্যবহার',
      rule2Desc: 'টার্ফে শুধুমাত্র টার্ফ শু বা ফ্ল্যাট স্নিকার্স পরে খেলতে হবে। মেটাল স্পাইক বা ব্লেডযুক্ত বুট সম্পূর্ণ নিষিদ্ধ।',
      rule3Title: 'ধূমপান ও মাদক সম্পূর্ণ নিষেধ',
      rule3Desc: 'গ্রাউন্ড ও ড্রেসিং এরিয়ায় ধূমপান, পান বা যেকোনো ধরনের মাদক সম্পূর্ণ নিষিদ্ধ। নিয়ম ভঙ্গ করলে বুকিং বাতিল করা হবে।',
      rule4Title: 'সৌজন্য ও ফেয়ার-প্লে বজায় রাখুন',
      rule4Desc: 'প্রতিপক্ষ দল ও গ্রাউন্ড কর্তৃপক্ষের সাথে সৌজন্যমূলক আচরণ করুন। কোনো প্রকার গালাগালি বা হাতাহাতি গ্রহণযোগ্য নয়।',
      rule5Title: 'গ্রাউন্ড ও সরঞ্জামের যত্ন নিন',
      rule5Desc: 'টার্ফ, জাল, ফ্লাডলাইট এবং বল সাবধানে ব্যবহার করুন। ইচ্ছাকৃত ক্ষতির জন্য ক্ষতিপূরণ দিতে হবে।',
      rule6Title: 'গ্রাউন্ড পরিষ্কার-পরিচ্ছন্ন রাখুন',
      rule6Desc: 'প্লাস্টিক বোতল ও ময়লা আবর্জনা নির্ধারিত বিনে ফেলুন। মাঠ নোংরা করা থেকে বিরত থাকুন।',
      rule7Title: 'বুকিং সংক্রান্ত সমস্যায় যোগাযোগ করুন',
      rule7Desc: 'বুকিং সময়সূচি পরিবর্তন, জরুরি তথ্য বা যেকোনো অসঙ্গতির ক্ষেত্রে গ্রাউন্ড ম্যানেজার অথবা হেল্পলাইনে সরাসরি কল বা হোয়াটসঅ্যাপ করুন।',
      ruleLabel: 'নিয়ম',
      rulesCtaTitle: 'আজই আপনার ম্যাচ স্লট বুক করুন',
      rulesCtaDesc: 'সব নিয়ম মেনে সুন্দর ও বন্ধুত্বপূর্ণ পরিবেশে ফুটবল খেলার আনন্দ উপভোগ করুন।',
      rulesBookBtn: 'স্লট বুকিং করুন',
      rulesWaBtn: 'সরাসরি হোয়াটসঅ্যাপে যোগাযোগ',

      // Contact Page
      contactTitle: 'যোগাযোগ ও লোকেশন',
      contactSubtitle: 'EVER GAIN ইনডোর ফুটবল গ্রাউন্ডের সাথে সরাসরি যোগাযোগ করুন ও দিকনির্দেশনা পান',
      cardHoursTitle: 'সময়সূচি',
      cardHoursDesc: 'সার্বক্ষণিক খেলাধুলার সুবিধা',
      formTitle: 'আমাদের বার্তা পাঠান',
      formSubtitle: 'যেকোনো মতামত, পরামর্শ বা অনুসন্ধানের জন্য মেসেজ দিন',
      sendMsgBtn: 'মেসেজ পাঠান',

      // Gallery Page
      galleryTitle: 'আমাদের গ্যালারি',
      gallerySubtitle: 'EVER GAIN ইনডোর ফুটবল গ্রাউন্ডের ছবি ও ভিডিও',
      filterAll: 'সব',
      filterImages: 'ছবি',
      filterVideos: 'ভিডিও',
      emptyGalleryMsg: 'গ্যালারিতে এখনো কিছু যোগ করা হয়নি',

      // New Ultra-Premium Homepage Additions
      heroLivePill: '🟢 লাইভ এরেনা: ২৪/৭ খোলা • প্রিমিয়াম কৃত্রিম টার্ফ • ইনস্ট্যান্ট অনলাইন কনফার্মেশন',
      heroTourBtn: 'গ্রাউন্ড লাইভ ট্যুর',
      badgeRating: '৪.৯/৫ রেটিং (৫০০+ সন্তুষ্ট দল)',
      badgeTurf: 'উন্নত মানের শক-প্যাড কৃত্রিম টার্ফ (জিরো ইনজুরি)',
      badgeLight: '৪K আল্ট্রা এইচডি ফ্লাডলাইট (ফ্লিকার-ফ্রি)',
      statMatches: 'সফল ম্যাচ অনুষ্ঠিত',
      statOpen: 'সার্বক্ষণিক খোলা',
      statTeams: 'নিবন্ধিত নিয়মিত দল',
      statSatisfied: 'গ্রাহক সন্তুষ্টি',
      calcTitle: 'ম্যাচ খরচ ক্যালকুলেটর',
      calcSubtitle: 'আপনার ম্যাচ সময় ও সেশন অনুযায়ী তাৎক্ষণিক খরচ ও সাশ্রয় হিসাব করুন',
      calcDurationLabel: 'খেলার সময়কাল বেছে নিন:',
      calcSessionLabel: 'সেশন নির্বাচন করুন:',
      calcTypeLabel: 'বুকিং প্যাকেজ ধরন:',
      calcSingleMatch: 'সাধারণ ম্যাচ',
      calcPermMatch: '👑 সাপ্তাহিক স্থায়ী বুকিং',
      calcEstCost: 'আনুমানিক ম্যাচ ফি',
      calcSaveLabel: 'স্থায়ী বুকিং ছাড়: প্রতি ঘণ্টায় ৳৫০ সাশ্রয়',
      calcBookBtn: 'এই প্যাকেজে স্লট বুক করুন',
      livePulseTitle: 'আজকের এরেনা স্ট্যাটাস ও লাইভ পালস',
      livePulseDay: '☀️ ডে সেশন: স্লট খোলা',
      livePulseNight: '🌙 নাইট সেশন: বুকিং চলছে',
      livePulseCta: 'আজকের স্লট দেখুন',
      testimonialsTitle: 'খেলোয়াড়দের অভিজ্ঞতা ও মতামত',
      testimonialsSubtitle: 'বগুড়ার শীর্ষ ফুটবল দল ও খেলোয়াড়রা EVER GAIN সম্পর্কে যা বলছেন',
      testi1Text: '"বগুড়ায় গ্রামের মনোরম পরিবেশে এরকম প্রিমিয়াম টার্ফ আগে দেখিনি! লাইটিং এবং গ্রাউন্ড কোয়ালিটি সত্যিই অসাধারণ।"',
      testi1Name: 'তানভীর আহমেদ',
      testi1Team: 'ক্যাপ্টেন, বগুড়া থান্ডার ফুটবল ক্লাব',
      testi2Text: '"আমরা প্রতি শুক্রবার নাইট স্লটে স্থায়ী বুকিং নিয়ে খেলি। ৫০ টাকা ছাড় এবং নিশ্চিত স্লট—সব মিলিয়ে দারুণ সার্ভিস!"',
      testi2Name: 'সাকিব আল হাসান',
      testi2Team: 'টিম লিডার, রেড ডেভিলস স্কোয়াড',
      testi3Text: '"মোবাইল দিয়ে ৩ মিনিটে বুকিং করা যায়। বৃষ্টি কিংবা কাদার কোনো চিন্তা নেই। লকার রুম ও সার্ভিসও ফ্রেশ।"',
      testi3Name: 'মাহিন চৌধুরী',
      testi3Team: 'টিম ক্যাপ্টেন, ইলেভেন স্টারস'
    },
    en: {
      // Navigation & Global
      navHome: 'Home',
      navBooking: 'Booking',
      navGallery: 'Gallery',
      navRules: 'Rules',
      navContact: 'Contact',
      navAdmin: 'Admin',
      adminEntry: 'Admin Portal',
      allRights: '© 2026 EVER GAIN. All rights reserved.',
      openHours: 'Open 24/7 (Round the Clock)',
      open247Badge: 'Open 24/7 Always',
      quickLinks: 'Quick Links',
      hoursPricing: 'Arena Information',
      callUs: 'Direct Call',
      messageUs: 'WhatsApp Chat',
      mapDirections: 'Google Map Directions',
      footerDesc: 'Your ultimate indoor football destination. World-class artificial turf with professional lighting for day and night games.',
      hotlineLabel: 'Direct WhatsApp Booking Assistance',
      bookNow: 'Book Slot Now',
      viewGallery: 'View Gallery',
      perHour: '/ hour',

      // Hero Section
      heroBadge: 'Premium Indoor Football Turf',
      heroHeadline: 'Your Ultimate Indoor Football Destination',
      heroDesc: 'Play without worry of rain, heat, or mud! World-class artificial turf and premium floodlights for day and night football.',

      // Quick Booking Section
      quickBooking: 'Booking Categories',
      quickBookingSubtitle: 'Enjoy the finest indoor football experience at your convenient schedule',
      dayBooking: 'Day Booking',
      daySaveBadge: '৳50 Special Discount',
      dayBookingDesc: 'From 6:00 AM to 5:00 PM. Enjoy active, lively football matches in natural daylight and pleasant open breeze.',
      bookDaySlot: 'Book Slot',
      nightBooking: 'Night Booking',
      nightSaveBadge: 'International Floodlights',
      nightBookingDesc: 'From 6:00 PM to midnight & 24/7. High-lumen energy-saving flicker-free floodlights and cool evening temperatures.',
      bookNightSlot: 'Book Slot',

      // Pricing Section
      pricingTitle: 'Pricing & Special Offers',
      pricingSubtitle: 'Guaranteed professional turf quality at budget-friendly rates for everyone',
      normalDayPricing: 'Normal Day Booking',
      normalNightPricing: 'Normal Night Booking',
      permanentDayPricing: 'Permanent Day Booking',
      permanentNightPricing: 'Permanent Night Booking',
      hourlyDiscountNote: 'Save ৳50 guaranteed on every single hour',

      // Why Choose Us
      whyChooseTitle: 'Why Choose EVER GAIN?',
      whyChooseSubtitle: 'International turf standards and ultimate comfort for your matches',
      feature1Title: 'World-Class Synthetic Turf',
      feature1Desc: 'Shock-absorbing artificial turf that minimizes injury risks and ensures smooth, authentic ball roll.',
      feature2Title: 'Anti-Glare Floodlight System',
      feature2Desc: 'High-lumen balanced floodlights lighting up every inch of the pitch with zero glare.',
      feature3Title: 'Open 24/7 Round the Clock',
      feature3Desc: 'Day or late night—enjoy complete freedom to play whenever your squad is ready.',
      feature4Title: 'Quick & Easy Online Booking',
      feature4Desc: 'Select your preferred time slot and submit your booking in just 3 taps from your phone.',
      feature5Title: 'Safe & Clean Environment',
      feature5Desc: 'Hygienic seating areas, fresh drinking water, and safe, respectful surroundings for players.',
      feature6Title: 'Guaranteed Recurring Savings',
      feature6Desc: 'Lock in your weekly match slot and enjoy guaranteed ৳50 discount on every single hour.',

      // Gallery Preview
      gallerySectionTitle: 'Our Turf Arena',
      gallerySectionSubtitle: 'A visual tour of our world-class turf, floodlights, and exciting match moments',
      viewFullGallery: 'View Full Gallery',

      // Permanent Booking Highlight
      permanentBadge: 'Exclusive Weekly Offer',
      permanentTitle: 'Permanent Weekly Reservation',
      permanentSubtitle: 'Lock in your team’s preferred day and time slot every week',
      permanentDesc: 'Does your team play football every week? Lock in a fixed day and time slot with zero risk of losing your spot, plus enjoy ৳50 direct discount on every single hour!',
      permanentCondTitle: 'Permanent Booking Terms',
      permanentCondHighlight: 'Must play at least 1 match per week',
      permanentCondNote: 'Playing at least one weekly match is mandatory to retain your recurring reserved slot.',
      permPoint1Title: 'Guaranteed Reserved Slot',
      permPoint1Desc: 'No one else can book your reserved time',
      permPoint2Title: 'Save ৳50 Every Hour',
      permPoint2Desc: 'Valid on both day and night sessions',
      permPoint3Title: 'VIP Priority Support',
      permPoint3Desc: 'Direct priority assistance on WhatsApp',
      permanentCta: 'Reserve Weekly Slot',

      // Contact Preview
      contactPreviewTitle: 'Contact & Location',
      contactPreviewSubtitle: 'Reach out for inquiries, slot verification, or directions to the ground',
      phoneCardTitle: 'Phone Number',
      phoneCardDesc: 'Call us directly for bookings and inquiries',
      waCardTitle: 'WhatsApp Hotline',
      waCardDesc: 'Instant chat and slot confirmation',
      locCardTitle: 'Ground Location',
      locCardDesc: 'Visit our indoor football arena',
      viewMapBtn: 'View on Google Maps',

      // Booking Page Wizard
      bookingPageTitle: 'Online Turf Booking',
      bookingPageSubtitle: 'Select your preferred slot and enjoy a seamless football experience',
      step1: 'Category',
      step2: 'Date & Time',
      step3: 'Information',
      step4: 'Confirmation',
      step1Title: 'Step 1: Select Category & Session',
      step1Subtitle: 'Single match booking or permanent weekly team reservation?',
      normalCardTitle: 'Normal Booking',
      normalCardDesc: 'For casual single match bookings',
      permanentCardTitle: 'Permanent Booking',
      permanentCardDesc: 'Fixed weekly slot with recurring discount',
      daySessionTitle: 'Day Session',
      daySessionHours: '6:00 AM - 5:00 PM',
      nightSessionTitle: 'Night Session',
      nightSessionHours: '6:00 PM - 12:00 AM+',
      nextStepBtn: 'Next Step',
      prevStepBtn: 'Previous Step',
      step2TitleNormal: 'Step 2: Select Date & Time Slot',
      step2TitlePermanent: 'Step 2: Select Weekly Day & Slot',
      chooseDateLabel: 'Select Match Date (Next 14 Days):',
      chooseWeekdayLabel: 'Select Weekly Recurring Day:',
      chooseSlotLabel: 'Select Available Time Slot:',
      legendAvailable: 'Available',
      legendSelected: 'Selected',
      legendBooked: 'Booked',
      legendPending: 'Pending',
      step3Title: 'Step 3: Enter Your Contact Information',
      step3Subtitle: 'Provide your name and phone number to verify booking',
      nameLabel: 'Your Full Name *',
      namePlaceholder: 'Enter your full name',
      phoneLabel: 'Mobile Number *',
      phonePlaceholder: '11-digit mobile number (e.g. 01712345678)',
      msgLabel: 'Additional Note (Optional)',
      msgPlaceholder: 'Any special requests or team details...',
      mandatoryCondLabel: 'Permanent booking requires playing at least 1 match per week. This condition is mandatory.',
      step4Title: 'Step 4: Review Details & Confirm Booking',
      step4Subtitle: 'Verify all details and submit your booking request',
      summaryTypeLabel: 'Booking Type:',
      summarySessionLabel: 'Session:',
      summaryDateLabel: 'Match Date:',
      summarySlotLabel: 'Selected Time Slot:',
      summaryNameLabel: 'Customer Name:',
      summaryPhoneLabel: 'Mobile Number:',
      summaryPriceLabel: 'Total Booking Fee:',
      disclaimerText: 'Slot will be finalized after admin review and approval.',
      submitBtnText: 'Submit Booking',
      modalSuccessTitle: 'Booking Request Submitted Successfully!',
      modalSuccessMsg: 'Your booking request has been submitted. Please wait for admin approval. Our team will contact you soon.',
      newBookingBtn: 'New Booking',
      viewStatusBtn: 'Check Status',
      searchStatusTitle: 'Search Booking Status',
      searchStatusSubtitle: 'Check your booking request status and history using your phone number',
      searchStatusBtn: 'Check Status',
      statusPhonePlaceholder: 'Enter your 11-digit phone number',

      // Rules Page
      rulesTitle: 'Ground Rules',
      rulesSubtitle: 'Guidelines and sports etiquette for an enjoyable and safe match at EVER GAIN',
      rulesBadge: 'Safe & Respectful Play',
      rule1Title: 'Arrive on Time',
      rule1Desc: 'Arrive at least 10 minutes prior to your booking. Please vacate the pitch promptly when your session ends.',
      rule2Title: 'Wear Proper Sports Shoes',
      rule2Desc: 'Only flat athletic sneakers or turf shoes are permitted. Metal studs or cleats are strictly forbidden.',
      rule3Title: 'Strictly No Smoking or Drugs',
      rule3Desc: 'Smoking and any intoxicating substances are strictly prohibited inside the arena.',
      rule4Title: 'Sportsmanship & Fair Play',
      rule4Desc: 'Respect match opponents and ground staff. Violent conduct or foul language will not be tolerated.',
      rule5Title: 'Care for Pitch & Equipment',
      rule5Desc: 'Treat the artificial turf, goalposts, and netting with care. Intentional damage will incur penalty fees.',
      rule6Title: 'Keep the Arena Clean',
      rule6Desc: 'Dispose of used water bottles and waste in designated trash bins. Keep the pitch clean.',
      rule7Title: 'Contact for Booking Inquiries',
      rule7Desc: 'For slot reschedule, urgent info, or any discrepancies, call our ground manager or WhatsApp hotline directly.',
      ruleLabel: 'Rule',
      rulesCtaTitle: 'Book Your Match Slot Today',
      rulesCtaDesc: 'Follow all guidelines and enjoy the true excitement of football with your squad.',
      rulesBookBtn: 'Book a Slot Now',
      rulesWaBtn: 'Contact via WhatsApp',

      // Contact Page
      contactTitle: 'Contact & Location',
      contactSubtitle: 'Get in touch with EVER GAIN Avenue Indoor Football Turf or get turn-by-turn directions',
      cardHoursTitle: 'Business Hours',
      cardHoursDesc: 'Open round the clock for football',
      formTitle: 'Send Us a Message',
      formSubtitle: 'Feel free to send questions, feedback, or general inquiries',
      sendMsgBtn: 'Send Message',

      // Gallery Page
      galleryTitle: 'Our Gallery',
      gallerySubtitle: 'Photos and match highlight videos of EVER GAIN Avenue',
      filterAll: 'All',
      filterImages: 'Photos',
      filterVideos: 'Videos',
      emptyGalleryMsg: 'No media items added yet',

      // New Ultra-Premium Homepage Additions
      heroLivePill: '🟢 EVERGAIN AVENUE: OPEN 24/7 • PREMIUM ARTIFICIAL TURF • INSTANT CONFIRMATION',
      heroTourBtn: 'Avenue Video Tour',
      badgeRating: '4.9/5 Rating (500+ Happy Teams)',
      badgeTurf: 'Premium Quality Shock-Pad Turf (Zero Injury)',
      badgeLight: '4K Ultra HD Anti-Glare Lights (Flicker-Free)',
      statMatches: 'Matches Played',
      statOpen: 'Round the Clock',
      statTeams: 'Registered Teams',
      statSatisfied: 'Player Satisfaction',
      calcTitle: 'Turf Match Cost Calculator',
      calcSubtitle: 'Instantly calculate your match cost and permanent booking savings',
      calcDurationLabel: 'Select Match Duration:',
      calcSessionLabel: 'Choose Session:',
      calcTypeLabel: 'Booking Package Type:',
      calcSingleMatch: 'Single Match',
      calcPermMatch: '👑 Permanent Weekly VIP',
      calcEstCost: 'Estimated Match Fee',
      calcSaveLabel: 'Permanent VIP Discount: Save ৳50/hr',
      calcBookBtn: 'Book With This Package',
      livePulseTitle: 'Today’s Arena Status & Live Pulse',
      livePulseDay: '☀️ Day Session: Slots Open',
      livePulseNight: '🌙 Night Session: Booking Active',
      livePulseCta: 'View Today’s Slots',
      testimonialsTitle: 'Player Reviews & Community Feedback',
      testimonialsSubtitle: 'What team captains and regular footballers say about EVER GAIN',
      testi1Text: '"Never seen such a premium quality turf in a peaceful village environment in Bogura! Top notch lighting and pitch."',
      testi1Name: 'Tanveer Ahmed',
      testi1Team: 'Captain, Bogura Thunder FC',
      testi2Text: '"We play every Friday night on a permanent reserved slot. Saving ৳50 every hour plus guaranteed slots—awesome!"',
      testi2Name: 'Sakib Al Hasan',
      testi2Team: 'Team Lead, Red Devils Squad',
      testi3Text: '"Booked in 3 minutes from phone. Zero worry about rain or mud. Clean locker rooms and great staff hospitality."',
      testi3Name: 'Mahin Chowdhury',
      testi3Team: 'Team Captain, Eleven Stars'
    }
  };

  let currentLang = 'bn';
  try {
    currentLang = localStorage.getItem('evergain_lang') || 'bn';
  } catch (e) {
    currentLang = 'bn';
  }

  function getLanguage() {
    return currentLang;
  }

  function setLanguage(lang) {
    if (lang !== 'bn' && lang !== 'en') lang = 'bn';
    currentLang = lang;
    try {
      localStorage.setItem('evergain_lang', lang);
    } catch (e) {}

    document.documentElement.lang = lang;
    applyTranslations();
    updateLangToggleUI();
  }

  function toggleLanguage() {
    const nextLang = (currentLang === 'bn') ? 'en' : 'bn';
    setLanguage(nextLang);
    showToast(nextLang === 'bn' ? 'বাংলা ভাষা নির্বাচন করা হয়েছে' : 'Language switched to English', 'info');
  }

  function updateLangToggleUI() {
    const toggleBtns = document.querySelectorAll('.lang-toggle-btn');
    toggleBtns.forEach(btn => {
      const bnText = btn.querySelector('.lang-bn');
      const enText = btn.querySelector('.lang-en');
      if (bnText && enText) {
        if (currentLang === 'bn') {
          bnText.classList.add('active');
          enText.classList.remove('active');
        } else {
          enText.classList.add('active');
          bnText.classList.remove('active');
        }
      }
    });

    const mobileToggles = document.querySelectorAll('#langToggleBtnMobile');
    mobileToggles.forEach(mobileToggle => {
      const span = mobileToggle.querySelector('span');
      if (span) {
        span.textContent = (currentLang === 'bn') ? 'Language: English (Switch to বাংলা)' : 'ভাষা: বাংলা (Switch to English)';
      }
    });
  }

  function applyTranslations() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS.bn;

    // 1. All data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) {
        const childSpan = el.querySelector('span');
        const childIcon = el.querySelector('i, svg');
        if (childSpan && childIcon && !childSpan.hasAttribute('data-i18n')) {
          childSpan.textContent = t[key];
        } else {
          el.textContent = t[key];
        }
      }
    });

    // 2. All data-i18n-html elements
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (t[key]) {
        el.innerHTML = t[key];
      }
    });

    // 3. All data-i18n-placeholder elements
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key]) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    // 3. Navigation mappings
    const navMap = {
      'হোম': t.navHome, 'Home': t.navHome,
      'বুকিং': t.navBooking, 'Booking': t.navBooking,
      'গ্যালারি': t.navGallery, 'Gallery': t.navGallery,
      'নিয়মাবলী': t.navRules, 'Rules': t.navRules,
      'যোগাযোগ': t.navContact, 'Contact': t.navContact
    };

    // Update desktop nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const txt = link.textContent.trim();
      if (navMap[txt]) {
        link.textContent = navMap[txt];
      }
    });

    // Update mobile menu drawer links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      const span = link.querySelector('span');
      if (span) {
        const txt = span.textContent.trim();
        if (navMap[txt]) span.textContent = navMap[txt];
      } else {
        Array.from(link.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const raw = node.textContent.trim();
            if (navMap[raw]) {
              node.textContent = ' ' + navMap[raw];
            }
          }
        });
      }
    });

    // Update mobile bottom nav items
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const span = item.querySelector('span');
      if (span) {
        const txt = span.textContent.trim();
        if (navMap[txt]) span.textContent = navMap[txt];
      }
    });

    // Update 24/7 Hours label
    document.querySelectorAll('.hours-display, .open-hours-text, #contactHoursDisplay').forEach(el => {
      const beacon = el.querySelector('.beacon-dot');
      if (beacon) {
        el.innerHTML = '<span class="beacon-dot"></span> ' + t.openHours;
      } else {
        el.textContent = t.openHours;
      }
    });

    // Notify other components
    window.dispatchEvent(new CustomEvent('evergain:languageChanged', { detail: { lang: currentLang } }));
  }

  // ==========================================================================
  // Global Settings Synchronization (Footers, WhatsApp, Phone, Address across all pages)
  // ==========================================================================

  let cachedSettingsData = null;

  function applyGlobalSettingsToDOM(settings) {
    if (!settings || typeof settings !== 'object') return;
    cachedSettingsData = settings;
    try {
      localStorage.setItem('evergain_cached_settings', JSON.stringify(settings));
    } catch (e) {}

    const phone = settings.phone || settings.contactPhone || settings.phoneNumber || '';
    const whatsapp = settings.whatsapp || settings.whatsappNumber || phone || '';
    const address = settings.address || settings.location || settings.groundAddress || 'Evergain Avenue, Birdal, Sonapur 3180';
    const mapLink = settings.mapLink || settings.googleMapLink || settings.mapUrl || 'https://maps.app.goo.gl/wP7QLcu8zdaeKqDt8?g_st=ac';
    const facebook = settings.socialFacebook || settings.facebook || settings.fbUrl || settings.facebookPage || '';

    const isBn = getLanguage() === 'bn';

    // 1. Phone number & Call links
    if (phone) {
      let cleanDigits = String(phone).replace(/\D/g, '');
      if (cleanDigits.startsWith('01')) cleanDigits = '880' + cleanDigits.substring(1);
      const telHref = 'tel:' + (phone.startsWith('+') ? phone : '+' + cleanDigits);

      const formatted = formatPhone(phone);
      const displayPhone = isBn ? toBengaliNum(formatted) : formatted;

      // Update all phone text displays
      const phoneDisplays = document.querySelectorAll('#footerPhone, #footerPhoneText, .footer-phone-display, #contactPhoneDisplay, #mobileContactPhone, .phone-display');
      phoneDisplays.forEach(function (el) {
        el.textContent = displayPhone;
      });

      // Update all call/tel links
      const phoneLinks = document.querySelectorAll('#footerPhoneLink, #contactPhoneLink, #contactPhoneBtn, #footerSocialPhone, #quickCallBtn, .footer-phone-link, a.phone-link');
      phoneLinks.forEach(function (el) {
        el.setAttribute('href', telHref);
      });
    }

    // 2. WhatsApp links and displays
    if (whatsapp) {
      let cleanWa = String(whatsapp).replace(/\D/g, '');
      if (cleanWa.startsWith('01')) cleanWa = '880' + cleanWa.substring(1);
      if (!cleanWa.startsWith('880') && cleanWa.length > 0) cleanWa = '88' + cleanWa;
      const waHref = cleanWa ? ('https://wa.me/' + cleanWa) : '';

      const formattedWa = formatPhone(whatsapp);
      const displayWa = isBn ? toBengaliNum(formattedWa) : formattedWa;

      // WhatsApp text displays
      const waDisplays = document.querySelectorAll('#contactWhatsappDisplay, .whatsapp-display');
      waDisplays.forEach(function (el) {
        el.textContent = displayWa;
      });

      // WhatsApp links
      const waLinks = document.querySelectorAll('#footerWhatsappBtn, #footerWaLink, #footerSocialWhatsapp, #floatingWaBtn, #contactWhatsappBtn, #quickWaBtn, #rulesWaBtn, .footer-wa-link, a[href*="wa.me"]');
      waLinks.forEach(function (el) {
        el.setAttribute('href', waHref);
      });
    }

    // 3. Address
    if (address) {
      const addressDisplays = document.querySelectorAll('#footerAddress, #footerAddressText, .footer-address-display, #contactAddressDisplay, .address-display');
      addressDisplays.forEach(function (el) {
        if (el.id === 'contactAddressDisplay') {
          el.innerHTML = address.replace(/\n/g, '<br>');
        } else {
          el.textContent = address;
        }
      });
    }

    // 4. Google Maps Link
    if (mapLink) {
      const mapLinks = document.querySelectorAll('#contactMapLink, #footerMapLink, .map-link');
      mapLinks.forEach(function (el) {
        el.setAttribute('href', mapLink);
      });
    }

    // 5. Facebook Link
    if (facebook) {
      const fbLinks = document.querySelectorAll('#footerSocialFacebook, #footerFbLink, a[aria-label="Facebook"]');
      fbLinks.forEach(function (el) {
        el.setAttribute('href', facebook);
      });
    }

    if (window.EverGain) {
      window.EverGain.settings = settings;
    }
    window.dispatchEvent(new CustomEvent('evergain:settingsLoaded', { detail: settings }));
  }

  function initGlobalSettingsSync() {
    // 1. Immediate render from localStorage cache
    try {
      const cached = localStorage.getItem('evergain_cached_settings');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          applyGlobalSettingsToDOM(parsed);
        }
      }
    } catch (e) {}

    // 2. Re-apply formatting if language changes
    window.addEventListener('evergain:languageChanged', function () {
      if (cachedSettingsData) {
        applyGlobalSettingsToDOM(cachedSettingsData);
      }
    });

    // 3. Realtime sync from Firebase Database
    function attachFirebaseSettingsListener() {
      const firebaseDb = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!firebaseDb) {
        setTimeout(attachFirebaseSettingsListener, 300);
        return;
      }
      try {
        firebaseDb.ref('settings').on('value', function (snapshot) {
          const val = snapshot.val();
          if (val) {
            applyGlobalSettingsToDOM(val);
          }
        }, function (err) {
          console.warn('[EverGain] /settings realtime sync note:', err.message);
        });
      } catch (err) {
        console.warn('[EverGain] /settings attach error:', err);
      }
    }

    attachFirebaseSettingsListener();
  }

  // ==========================================================================
  // 5. Expose Functions on EverGain Namespace & Window
  // ==========================================================================

  EverGain.getLanguage = getLanguage;
  EverGain.setLanguage = setLanguage;
  EverGain.toggleLanguage = toggleLanguage;
  EverGain.applyTranslations = applyTranslations;
  EverGain.applyGlobalSettingsToDOM = applyGlobalSettingsToDOM;
  EverGain.initGlobalSettingsSync = initGlobalSettingsSync;

  EverGain.showToast = showToast;
  EverGain.formatDate = formatDate;
  EverGain.formatPrice = formatPrice;
  EverGain.formatPhone = formatPhone;
  EverGain.generateId = generateId;
  EverGain.getCurrentBDTime = getCurrentBDTime;
  EverGain.toBengaliNum = toBengaliNum;
  EverGain.validatePhone = validatePhone;
  EverGain.validateName = validateName;
  EverGain.debounce = debounce;
  EverGain.initParticles = initParticles;
  EverGain.initNavigation = initNavigation;
  EverGain.initScrollAnimations = initScrollAnimations;
  EverGain.checkAdminAuth = checkAdminAuth;
  EverGain.signOutAdmin = signOutAdmin;

  // Global window references for quick access
  window.EverGain = EverGain;
  window.showToast = showToast;
  window.formatDate = formatDate;
  window.formatPrice = formatPrice;
  window.formatPhone = formatPhone;
  window.generateId = generateId;
  window.toBengaliNum = toBengaliNum;

  // Auto-initialize standard DOM behaviors once ready
  function initCommon() {
    initNavigation();
    initScrollAnimations();
    initParticles('particleCanvas');
    applyTranslations();
    updateLangToggleUI();
    initGlobalSettingsSync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCommon);
  } else {
    initCommon();
  }

})(window);
