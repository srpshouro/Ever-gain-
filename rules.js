/**
 * EVER GAIN Indoor Football - Ground Rules Page Script
 * Dynamic rules loader with Firebase Realtime Database integration,
 * elegant fallback default rules, animations, particles, and responsive navigation.
 */

// Default / Placeholder Rules (shown if Firebase not configured or empty)
const DEFAULT_RULES = [
  {
    id: 'rule-1',
    icon: 'fa-regular fa-clock',
    emoji: '🕐',
    title: 'সময়মতো উপস্থিত থাকুন',
    description: 'বুকিং সময়ের অন্তত ১০-১৫ মিনিট পূর্বে গ্রাউন্ডে উপস্থিত হতে হবে। বিলম্ব হলে অতিরিক্ত সময় বরাদ্দ করা সম্ভব হবে না।',
    order: 1
  },
  {
    id: 'rule-2',
    icon: 'fa-solid fa-shoe-prints',
    emoji: '👟',
    title: 'অবশ্যই স্পোর্টস শু পরে খেলতে হবে',
    description: 'টার্ফের সুরক্ষার জন্য শুধুমাত্র অনুমোদিত টার্ফ শু বা ফ্ল্যাট ইনডোর স্পোর্টস শু পরিধান বাধ্যতামূলক। মেটাল স্পাইক বা শক্ত জুতো সম্পূর্ণ নিষিদ্ধ।',
    order: 2
  },
  {
    id: 'rule-3',
    icon: 'fa-solid fa-ban-smoking',
    emoji: '🚫',
    title: 'গ্রাউন্ডে ধূমপান নিষেধ',
    description: 'গ্রাউন্ড, ডাগআউট ও সংলগ্ন প্রাঙ্গণে ধূমপান, পান বা যেকোনো প্রকার তামাকজাত ও নেশাজাতীয় দ্রব্য সেবন সম্পূর্ণ নিষিদ্ধ।',
    order: 3
  },
  {
    id: 'rule-4',
    icon: 'fa-solid fa-handshake',
    emoji: '🤝',
    title: 'সকলের সাথে সৌজন্যমূলক আচরণ করুন',
    description: 'খেলার মাঠে স্পোর্টসম্যানশিপ ও শৃঙ্খলা বজায় রাখুন। রেফারি, মাঠকর্মী ও অন্য দলের খেলোয়াড়দের প্রতি পারস্পরিক সম্মান প্রদর্শন করুন।',
    order: 4
  },
  {
    id: 'rule-5',
    icon: 'fa-solid fa-futbol',
    emoji: '⚽',
    title: 'গ্রাউন্ডের সরঞ্জাম যত্নে ব্যবহার করুন',
    description: 'গোলপোস্ট, জাল, ফ্লাডলাইট এবং সরবরাহকৃত বল সতর্কতার সাথে ব্যবহার করুন। কোনো সরঞ্জাম ইচ্ছাকৃত ক্ষতিগ্রস্ত হলে ক্ষতিপূরণ দিতে হবে।',
    order: 5
  },
  {
    id: 'rule-6',
    icon: 'fa-solid fa-trash-can',
    emoji: '🗑️',
    title: 'গ্রাউন্ড পরিষ্কার রাখুন',
    description: 'গ্রাউন্ডের পরিচ্ছন্নতা রক্ষা করা আমাদের সবার দায়িত্ব। পানির বোতল, খাবারের প্যাকেট বা ময়লা-আবর্জনা মাঠে না ফেলে নির্দিষ্ট ডাস্টবিনে ফেলুন।',
    order: 6
  },
  {
    id: 'rule-7',
    icon: 'fa-solid fa-phone-volume',
    emoji: '📱',
    title: 'বুকিং সংক্রান্ত সমস্যায় যোগাযোগ করুন',
    description: 'বুকিং সময়সূচি পরিবর্তন, জরুরি তথ্য বা যেকোনো অসঙ্গতির ক্ষেত্রে গ্রাউন্ড ম্যানেজার অথবা হেল্পলাইনে সরাসরি কল বা হোয়াটসঅ্যাপ করুন।',
    order: 7
  }
];

let cachedRules = [];

/**
 * Initialize on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
  init();
});

// React to global language toggle
window.addEventListener('evergain:languageChanged', () => {
  if (cachedRules && cachedRules.length > 0) {
    renderRules(cachedRules);
  } else {
    showDefaultRules();
  }
});

/**
 * Master Initialization
 */
function init() {
  initParticles();
  initNavigation();
  initScrollAnimations();
  loadRules();
}

/**
 * Fetch rules from Firebase Realtime Database (/rules)
 */
function loadRules() {
  showLoading();

  let database = null;
  if (typeof db !== 'undefined' && db) {
    database = db;
  } else if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
    database = firebase.database();
  }

  if (!database) {
    console.warn('Firebase Database not detected. Displaying default ground rules.');
    showDefaultRules();
    return;
  }

  try {
    const rulesRef = database.ref('rules');

    rulesRef.orderByChild('order').once('value')
      .then((snapshot) => {
        if (snapshot.exists()) {
          const rules = [];
          snapshot.forEach((child) => {
            const data = child.val();
            rules.push({
              id: child.key,
              icon: data.icon || 'fa-solid fa-futbol',
              emoji: data.emoji || '',
              title: data.title || '',
              description: data.description || '',
              order: typeof data.order === 'number' ? data.order : 999
            });
          });

          // Sort ascending by order
          rules.sort((a, b) => (a.order || 0) - (b.order || 0));

          cachedRules = rules;

          if (rules.length > 0) {
            renderRules(rules);
          } else {
            showDefaultRules();
          }
        } else {
          showDefaultRules();
        }
      })
      .catch((error) => {
        console.error('Error fetching rules from Firebase:', error);
        showDefaultRules();
      });
  } catch (err) {
    console.error('Unexpected error loading rules:', err);
    showDefaultRules();
  }
}

/**
 * Display rules dynamically as premium cards
 */
function renderRules(rules) {
  hideLoading();
  const container = document.getElementById('rulesContainer');
  if (!container) return;

  const isEn = (window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en');
  container.innerHTML = '';

  rules.forEach((rule, index) => {
    const card = document.createElement('div');
    card.className = `card card-premium animate-in stagger-${(index % 6) + 1}`;
    card.setAttribute('data-id', rule.id || `rule-${index + 1}`);

    const iconHtml = formatRuleIcon(rule.icon, rule.emoji);
    const indexStr = isEn ? (index + 1) : toBengaliNumber(index + 1);
    const ruleNum = index + 1;

    card.innerHTML = `
      <div class="rule-card-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
        <div class="card-icon" style="margin-bottom: 0;">
          ${iconHtml}
        </div>
        <span class="badge badge-available" style="font-size: 0.8rem; font-weight: 600;">
          <span data-i18n="ruleLabel">${isEn ? 'Rule' : 'নিয়ম'}</span> #${indexStr}
        </span>
      </div>
      <h3 class="card-title" data-i18n="rule${ruleNum}Title" style="margin-bottom: 0.75rem; font-size: 1.25rem;">${escapeHtml(rule.title)}</h3>
      <p class="card-text text-secondary" data-i18n="rule${ruleNum}Desc" style="line-height: 1.6; font-size: 0.95rem;">${escapeHtml(rule.description)}</p>
    `;

    container.appendChild(card);
  });

  if (window.EverGain && typeof window.EverGain.applyTranslations === 'function') {
    window.EverGain.applyTranslations();
  }

  triggerScrollAnimations();
}

/**
 * Show placeholder rules if Firebase is not configured or returns empty
 */
function showDefaultRules() {
  renderRules(DEFAULT_RULES);
}

/**
 * Format icon representation (Font Awesome class or emoji)
 */
function formatRuleIcon(iconClass, emoji) {
  if (iconClass) {
    // If it's a font awesome class string
    if (iconClass.includes('fa-') || iconClass.startsWith('fas') || iconClass.startsWith('far') || iconClass.startsWith('fab')) {
      return `<i class="${escapeHtml(iconClass)}"></i>`;
    }
    // If it's an emoji string
    if (/\p{Emoji}/u.test(iconClass)) {
      return `<span style="font-size: 1.8rem; line-height: 1;">${iconClass}</span>`;
    }
    return `<i class="fas fa-${escapeHtml(iconClass)}"></i>`;
  }

  if (emoji) {
    return `<span style="font-size: 1.8rem; line-height: 1;">${emoji}</span>`;
  }

  return '<i class="fas fa-shield-halved"></i>';
}

/**
 * Loading skeleton toggle
 */
function showLoading() {
  const skeleton = document.getElementById('rulesSkeleton');
  const container = document.getElementById('rulesContainer');
  if (skeleton) skeleton.classList.remove('hidden');
  if (container) container.classList.add('hidden');
}

function hideLoading() {
  const skeleton = document.getElementById('rulesSkeleton');
  const container = document.getElementById('rulesContainer');
  if (skeleton) skeleton.classList.add('hidden');
  if (container) container.classList.remove('hidden');
}

/**
 * Convert number to Bengali digits
 */
function toBengaliNumber(num) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, digit => bnDigits[digit]);
}

/**
 * Safe HTML escaping
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Top Navbar & Mobile Menu Setup
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
 * Scroll Animations
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
 * Toast Notifications
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

  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      removeToast(toast);
    });
  }

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
