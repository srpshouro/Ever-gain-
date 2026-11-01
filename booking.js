/**
 * EVER GAIN Indoor Football Booking Platform
 * booking.js — Complete Booking System Logic
 * Bengali Language, Responsive, Realtime Firebase Integration
 */

// ==========================================
// 1. STATE MANAGEMENT
// ==========================================
let bookingState = {
  step: 1,
  type: '', // 'normal' or 'permanent'
  session: '', // 'day' or 'night'
  date: '', // for normal booking ('YYYY-MM-DD')
  weekday: null, // for permanent booking (0-6)
  slotId: '',
  slotTime: '',
  teamName: '',
  captainName: '',
  customerName: '',
  customerPhone: '',
  message: '',
  conditionAccepted: false,
  price: 0
};

// Global pricing state (default business values, updated via Firebase)
let pricingState = {
  normalDay: 550,
  normalDayOriginal: 600,
  normalNight: 900,
  normalNightOriginal: null,
  permanentDay: 500,
  permanentDayOriginal: 550,
  permanentNight: 850,
  permanentNightOriginal: 900
};

// Submission lock to prevent double clicks
let isSubmitting = false;

// ==========================================
// 2. CONSTANTS & LOCALIZATION DATA
// ==========================================
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

const BENGALI_WEEKDAYS = [
  'রবিবার',     // 0: Sunday
  'সোমবার',     // 1: Monday
  'মঙ্গলবার',   // 2: Tuesday
  'বুধবার',     // 3: Wednesday
  'বৃহস্পতিবার', // 4: Thursday
  'শুক্রবার',    // 5: Friday
  'শনিবার'      // 6: Saturday
];

const ENGLISH_WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

const BENGALI_WEEKDAYS_SHORT = [
  'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'
];

const ENGLISH_WEEKDAYS_SHORT = [
  'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
];

const BENGALI_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const BENGALI_MONTHS_SHORT = [
  'জানু', 'ফেব', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'
];

const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Weekday ordering for recurring permanent picker (Starting from Saturday as typical in BD)
const WEEKDAY_ORDER = [6, 0, 1, 2, 3, 4, 5];

// Standard Turf Time Slots
const DAY_SLOTS = [
  { id: 'slot_06_07', time: '০৬:০০ - ০৭:০০', label: 'সকাল ০৬:০০ - ০৭:০০', labelEn: '06:00 AM - 07:00 AM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_07_08', time: '০৭:০০ - ০৮:০০', label: 'সকাল ০৭:০০ - ০৮:০০', labelEn: '07:00 AM - 08:00 AM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_08_09', time: '০৮:০০ - ০৯:০০', label: 'সকাল ০৮:০০ - ০৯:০০', labelEn: '08:00 AM - 09:00 AM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_09_10', time: '০৯:০০ - ১০:০০', label: 'সকাল ০৯:০০ - ১০:০০', labelEn: '09:00 AM - 10:00 AM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_10_11', time: '১০:০০ - ১১:০০', label: 'সকাল ১০:০০ - ১১:০০', labelEn: '10:00 AM - 11:00 AM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_11_12', time: '১১:০০ - ১২:০০', label: 'সকাল ১১:০০ - দুপুর ১২:০০', labelEn: '11:00 AM - 12:00 PM', period: 'সকাল', periodEn: 'Morning' },
  { id: 'slot_12_13', time: '১২:০০ - ০১:০০', label: 'দুপুর ১২:০০ - ০১:০০', labelEn: '12:00 PM - 01:00 PM', period: 'দুপুর', periodEn: 'Afternoon' },
  { id: 'slot_13_14', time: '০১:০০ - ০২:০০', label: 'দুপুর ০১:০০ - ০২:০০', labelEn: '01:00 PM - 02:00 PM', period: 'দুপুর', periodEn: 'Afternoon' },
  { id: 'slot_14_15', time: '০২:০০ - ০৩:০০', label: 'দুপুর ০২:০০ - ০৩:০০', labelEn: '02:00 PM - 03:00 PM', period: 'দুপুর', periodEn: 'Afternoon' },
  { id: 'slot_15_16', time: '০৩:০০ - ০৪:০০', label: 'দুপুর ০৩:০০ - বিকাল ০৪:০০', labelEn: '03:00 PM - 04:00 PM', period: 'দুপুর', periodEn: 'Afternoon' },
  { id: 'slot_16_17', time: '০৪:০০ - ০৫:০০', label: 'বিকাল ০৪:০০ - ০৫:০০', labelEn: '04:00 PM - 05:00 PM', period: 'বিকাল', periodEn: 'Afternoon' },
  { id: 'slot_17_18', time: '০৫:০০ - ০৬:০০', label: 'বিকাল ০৫:০০ - সন্ধ্যা ০৬:০০', labelEn: '05:00 PM - 06:00 PM', period: 'বিকাল', periodEn: 'Evening' }
];

const NIGHT_SLOTS = [
  { id: 'slot_18_19', time: '০৬:০০ - ০৭:০০', label: 'সন্ধ্যা ০৬:০০ - ০৭:০০', labelEn: '06:00 PM - 07:00 PM', period: 'সন্ধ্যা', periodEn: 'Evening' },
  { id: 'slot_19_20', time: '০৭:০০ - ০৮:০০', label: 'সন্ধ্যা ০৭:০০ - রাত ০৮:০০', labelEn: '07:00 PM - 08:00 PM', period: 'সন্ধ্যা', periodEn: 'Night' },
  { id: 'slot_20_21', time: '০৮:০০ - ০৯:০০', label: 'রাত ০৮:০০ - ০৯:০০', labelEn: '08:00 PM - 09:00 PM', period: 'রাত', periodEn: 'Night' },
  { id: 'slot_21_22', time: '০৯:০০ - ১০:০০', label: 'রাত ০৯:০০ - ১০:০০', labelEn: '09:00 PM - 10:00 PM', period: 'রাত', periodEn: 'Night' },
  { id: 'slot_22_23', time: '১০:০০ - ১১:০০', label: 'রাত ১০:০০ - ১১:০০', labelEn: '10:00 PM - 11:00 PM', period: 'রাত', periodEn: 'Night' },
  { id: 'slot_23_24', time: '১১:০০ - ১২:০০', label: 'রাত ১১:০০ - ১২:০০', labelEn: '11:00 PM - 12:00 AM', period: 'রাত', periodEn: 'Night' }
];

// ==========================================
// 3. HELPER FUNCTIONS & FORMATTERS
// ==========================================

function isEnglishLang() {
  return (window.EverGain && typeof window.EverGain.getLanguage === 'function' && window.EverGain.getLanguage() === 'en');
}

/**
 * Convert numbers to Bengali digits
 */
function getBengaliDigits(num) {
  if (num === null || num === undefined) return '';
  const str = String(num);
  return str.replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Format numbers according to active language
 */
function formatNum(num) {
  if (num === null || num === undefined) return '';
  return isEnglishLang() ? String(num) : getBengaliDigits(num);
}

/**
 * Return Bengali weekday name for a day number (0-6)
 */
function getWeekdayName(num) {
  const index = parseInt(num, 10);
  if (isNaN(index) || index < 0 || index > 6) return '';
  return BENGALI_WEEKDAYS[index] || '';
}

/**
 * Format standard date string (YYYY-MM-DD) into full Bengali date
 */
function formatDateBengali(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  const weekdayName = getWeekdayName(d.getDay());
  const monthName = BENGALI_MONTHS[month] || '';
  const dayBn = getBengaliDigits(day);
  const yearBn = getBengaliDigits(year);

  return `${weekdayName}, ${dayBn} ${monthName} ${yearBn}`;
}

/**
 * Format standard date string (YYYY-MM-DD) into full English date
 */
function formatDateEnglish(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const d = new Date(year, month, day);
  const weekdayName = ENGLISH_WEEKDAYS[d.getDay()] || '';
  const monthName = ENGLISH_MONTHS_SHORT[month] || '';

  return `${weekdayName}, ${monthName} ${day}, ${year}`;
}

/**
 * Helper to clean and normalize Bangladeshi phone number to 11 digits.
 * Automatically converts Bengali numerals (০-৯) to English digits (0-9).
 */
function cleanPhoneNumber(phone) {
  if (!phone) return '';
  const bnDigits = '০১২৩৪৫৬৭৮৯';
  let cleaned = String(phone).trim()
    .replace(/[০-৯]/g, d => '0123456789'[bnDigits.indexOf(d)])
    .replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

/**
 * Validate phone number format (01XXXXXXXXX)
 */
function isValidBDPhone(phone) {
  const cleaned = cleanPhoneNumber(phone);
  return /^01[3-9]\d{8}$/.test(cleaned);
}

/**
 * Firebase Realtime Database accessor helper
 */
function getDb() {
  if (window.db) return window.db;
  if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
    return firebase.database();
  }
  return null;
}

/**
 * Toast Notification Helper
 */
function showToast(message, type = 'info') {
  if (window.showToast && window.showToast !== showToast) {
    window.showToast(message, type);
    return;
  }

  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} animate-in`;

  let icon = 'info-circle';
  if (type === 'success') icon = 'check-circle';
  if (type === 'error') icon = 'times-circle';
  if (type === 'warning') icon = 'exclamation-triangle';

  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Make showToast accessible globally
window.showToast = showToast;

// ==========================================
// 4. INITIALIZATION & PRICING
// ==========================================

/**
 * Page initialization
 */
function init() {
  initParticles();
  initNavigation();
  loadPricing();
  renderStepIndicator();

  // Handle URL parameters if any (e.g. ?type=permanent&session=night)
  const urlParams = new URLSearchParams(window.location.search);
  const paramType = urlParams.get('type');
  const paramSession = urlParams.get('session');
  if (paramType && (paramType === 'normal' || paramType === 'permanent')) {
    const s = (paramSession === 'night') ? 'night' : 'day';
    selectCategory(paramType, s);
  }

  // Pre-fill phone if available in localStorage
  const savedPhone = localStorage.getItem('evergain_user_phone');
  if (savedPhone) {
    const phoneInput = document.getElementById('customerPhone');
    const statusInput = document.getElementById('statusPhoneInput');
    if (phoneInput) phoneInput.value = savedPhone;
    if (statusInput) statusInput.value = savedPhone;
  }
}

/**
 * Load pricing from Firebase and update DOM
 */
function loadPricing() {
  const db = getDb();
  if (!db) {
    updatePricingDisplay();
    return;
  }

  db.ref('pricing').once('value')
    .then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.normalDay) pricingState.normalDay = Number(data.normalDay);
        if (data.normalDayOriginal) pricingState.normalDayOriginal = Number(data.normalDayOriginal);
        if (data.normalNight) pricingState.normalNight = Number(data.normalNight);
        if (data.normalNightOriginal) pricingState.normalNightOriginal = Number(data.normalNightOriginal);
        if (data.permanentDay) pricingState.permanentDay = Number(data.permanentDay);
        if (data.permanentDayOriginal) pricingState.permanentDayOriginal = Number(data.permanentDayOriginal);
        if (data.permanentNight) pricingState.permanentNight = Number(data.permanentNight);
        if (data.permanentNightOriginal) pricingState.permanentNightOriginal = Number(data.permanentNightOriginal);
      }
      updatePricingDisplay();
    })
    .catch((err) => {
      console.warn('Firebase pricing fetch note:', err.message);
      updatePricingDisplay();
    });
}

/**
 * Update pricing text across elements
 */
function updatePricingDisplay() {
  const isEn = isEnglishLang();
  const normDay = document.getElementById('displayNormalDay');
  const normDayOrig = document.getElementById('displayNormalDayOrig');
  const normNight = document.getElementById('displayNormalNight');
  const permDay = document.getElementById('displayPermanentDay');
  const permDayOrig = document.getElementById('displayPermanentDayOrig');
  const permNight = document.getElementById('displayPermanentNight');
  const permNightOrig = document.getElementById('displayPermanentNightOrig');

  if (normDay) normDay.textContent = `৳${formatNum(pricingState.normalDay)}`;
  if (normDayOrig) {
    normDayOrig.textContent = pricingState.normalDayOriginal ? `৳${formatNum(pricingState.normalDayOriginal)}` : '';
  }
  if (normNight) normNight.textContent = `৳${formatNum(pricingState.normalNight)}`;
  
  if (permDay) permDay.textContent = `৳${formatNum(pricingState.permanentDay)}`;
  if (permDayOrig) {
    permDayOrig.textContent = pricingState.permanentDayOriginal ? `৳${formatNum(pricingState.permanentDayOriginal)}` : '';
  }
  
  if (permNight) permNight.textContent = `৳${formatNum(pricingState.permanentNight)}`;
  if (permNightOrig) {
    permNightOrig.textContent = pricingState.permanentNightOriginal ? `৳${formatNum(pricingState.permanentNightOriginal)}` : '';
  }

  // If a category is currently chosen, sync current price
  if (bookingState.type && bookingState.session) {
    syncCurrentPrice();
  }
}

/**
 * Sync price into bookingState based on active selection
 */
function syncCurrentPrice() {
  if (bookingState.type === 'normal') {
    bookingState.price = (bookingState.session === 'night') 
      ? pricingState.normalNight 
      : pricingState.normalDay;
  } else if (bookingState.type === 'permanent') {
    bookingState.price = (bookingState.session === 'night') 
      ? pricingState.permanentNight 
      : pricingState.permanentDay;
  }
}

// ==========================================
// 5. STEP 1: CATEGORY SELECTION
// ==========================================

/**
 * Select category and session
 */
function selectCategory(type, session) {
  bookingState.type = type;
  bookingState.session = session;
  syncCurrentPrice();

  const isEn = isEnglishLang();

  // Reset selected slot if category changed
  bookingState.slotId = '';
  bookingState.slotTime = '';

  // Update card highlighting in Step 1
  const allSubcards = document.querySelectorAll('.pricing-card');
  allSubcards.forEach(card => card.classList.remove('selected', 'active-plan'));

  // Reset all select buttons text
  document.querySelectorAll('.category-select-btn').forEach(btn => {
    btn.innerHTML = `<i class="fas fa-hand-pointer"></i> ${isEn ? 'Select' : 'নির্বাচন করুন'}`;
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  });

  const cardNormal = document.getElementById('cardNormal');
  const cardPermanent = document.getElementById('cardPermanent');
  if (cardNormal) cardNormal.classList.remove('selected');
  if (cardPermanent) cardPermanent.classList.remove('selected');

  let activeTarget = null;
  if (type === 'normal') {
    if (cardNormal) cardNormal.classList.add('selected');
    activeTarget = (session === 'day') ? document.getElementById('optNormalDay') : document.getElementById('optNormalNight');
  } else {
    if (cardPermanent) cardPermanent.classList.add('selected');
    activeTarget = (session === 'day') ? document.getElementById('optPermanentDay') : document.getElementById('optPermanentNight');
  }

  if (activeTarget) {
    activeTarget.classList.add('selected', 'active-plan');
    const btn = activeTarget.querySelector('.category-select-btn');
    if (btn) {
      btn.innerHTML = `<i class="fas fa-check-circle"></i> ${isEn ? 'Selected' : 'নির্বাচিত হয়েছে'}`;
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
    }
  }

  // Enable Next button in Step 1
  const step1NextBtn = document.getElementById('step1NextBtn');
  if (step1NextBtn) {
    step1NextBtn.disabled = false;
    step1NextBtn.classList.add('pulse');
  }
}

// ==========================================
// 6. STEP NAVIGATION & PROGRESS
// ==========================================

/**
 * Update step progress indicator
 */
function renderStepIndicator() {
  const steps = document.querySelectorAll('.booking-step');
  steps.forEach(stepEl => {
    const s = parseInt(stepEl.getAttribute('data-step'), 10);
    stepEl.classList.remove('active', 'completed');
    if (s === bookingState.step) {
      stepEl.classList.add('active');
    } else if (s < bookingState.step) {
      stepEl.classList.add('completed');
    }
  });
}

/**
 * Navigate to step with validation
 */
function goToStep(targetStep) {
  // Validate transitions
  if (targetStep === 2) {
    if (!bookingState.type || !bookingState.session) {
      showToast('অনুগ্রহ করে একটি বুকিং ক্যাটাগরি ও সেশন নির্বাচন করুন', 'warning');
      return;
    }
    setupStep2();
  } else if (targetStep === 3) {
    if (!bookingState.slotId || !bookingState.slotTime) {
      showToast('অনুগ্রহ করে একটি উপলব্ধ সময় স্লট নির্বাচন করুন', 'warning');
      return;
    }
    setupStep3();
  } else if (targetStep === 4) {
    if (!validateForm()) {
      return;
    }
    renderSummary();
  }

  bookingState.step = targetStep;
  renderStepIndicator();

  // Hide all step sections, show target
  const stepContainers = [
    document.getElementById('step1Container'),
    document.getElementById('step2Container'),
    document.getElementById('step3Container'),
    document.getElementById('step4Container')
  ];

  stepContainers.forEach((el, index) => {
    if (!el) return;
    if (index + 1 === targetStep) {
      el.classList.remove('hidden');
      el.style.opacity = '1';
    } else {
      el.classList.add('hidden');
    }
  });

  // Smooth scroll up to step progress indicator with fixed navbar offset
  const stepsContainer = document.getElementById('bookingSteps');
  if (stepsContainer) {
    const navbarOffset = 90;
    const targetY = stepsContainer.getBoundingClientRect().top + window.pageYOffset - navbarOffset;
    window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
  }

  if (window.EverGain && typeof window.EverGain.applyTranslations === 'function') {
    window.EverGain.applyTranslations();
  }
}

// ==========================================
// 7. STEP 2: DATE & TIME SELECTION
// ==========================================

/**
 * Setup view for Step 2 based on chosen booking type
 */
function setupStep2() {
  const isEn = isEnglishLang();
  const normalWrapper = document.getElementById('normalDatePickerWrapper');
  const permanentWrapper = document.getElementById('permanentWeekdayWrapper');
  const step2Title = document.getElementById('step2HeaderTitle');
  const badgeCat = document.getElementById('badgeCategorySummary');
  const badgePrice = document.getElementById('badgePriceSummary');

  const typeLabel = (bookingState.type === 'normal') 
    ? (isEn ? 'Normal Booking' : 'সাধারণ বুকিং') 
    : (isEn ? 'Permanent Booking' : 'স্থায়ী বুকিং');
  const sessionLabel = (bookingState.session === 'day') 
    ? (isEn ? 'Day Session' : 'ডে সেশন') 
    : (isEn ? 'Night Session' : 'নাইট সেশন');

  if (badgeCat) {
    badgeCat.textContent = `${typeLabel} (${sessionLabel})`;
  }
  if (badgePrice) {
    badgePrice.textContent = `৳${formatNum(bookingState.price)} / ${isEn ? 'Hour' : 'ঘণ্টা'}`;
  }

  // Disable Next button until a slot is chosen
  const nextBtn = document.getElementById('step2NextBtn');
  if (nextBtn) {
    nextBtn.disabled = !bookingState.slotId;
  }

  if (bookingState.type === 'normal') {
    if (normalWrapper) normalWrapper.classList.remove('hidden');
    if (permanentWrapper) permanentWrapper.classList.add('hidden');
    if (step2Title) step2Title.textContent = isEn ? 'Step 2: Select Date & Time Slot' : 'ধাপ ২: তারিখ ও সময় স্লট নির্বাচন করুন';

    renderDatePicker();
  } else {
    if (normalWrapper) normalWrapper.classList.add('hidden');
    if (permanentWrapper) permanentWrapper.classList.remove('hidden');
    if (step2Title) step2Title.textContent = isEn ? 'Step 2: Select Weekday & Recurring Time Slot' : 'ধাপ ২: সাপ্তাহিক দিন ও সময় স্লট নির্বাচন করুন';

    renderWeekdayPicker();
  }
}

/**
 * Render next 14 days as date cards for Normal booking
 */
function renderDatePicker() {
  const container = document.getElementById('dateCardsContainer');
  if (!container) return;
  container.innerHTML = '';

  const isEn = isEnglishLang();
  const today = new Date();

  // If no date currently selected, select today or keep existing
  let defaultDateSelected = bookingState.date;

  for (let i = 0; i < 14; i++) {
    const curDate = new Date();
    curDate.setDate(today.getDate() + i);

    const year = curDate.getFullYear();
    const month = String(curDate.getMonth() + 1).padStart(2, '0');
    const day = String(curDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const weekdayShort = isEn ? ENGLISH_WEEKDAYS_SHORT[curDate.getDay()] : BENGALI_WEEKDAYS_SHORT[curDate.getDay()];
    const dayDisplay = isEn ? String(curDate.getDate()) : getBengaliDigits(curDate.getDate());
    const monthShort = isEn ? ENGLISH_MONTHS_SHORT[curDate.getMonth()] : BENGALI_MONTHS_SHORT[curDate.getMonth()];

    const isToday = (i === 0);
    const isSelected = (defaultDateSelected ? defaultDateSelected === dateStr : isToday);

    if (isSelected && !bookingState.date) {
      bookingState.date = dateStr;
    }

    const card = document.createElement('div');
    card.className = `booking-date available ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-date', dateStr);
    card.onclick = () => selectDate(dateStr);

    const todayBadge = isToday 
      ? `<span class="badge badge-info" style="font-size: 0.65rem; padding: 2px 4px; margin-top: 4px;">${isEn ? 'Today' : 'আজ'}</span>` 
      : '';

    card.innerHTML = `
      <div class="booking-date-weekday">${weekdayShort}</div>
      <div class="booking-date-day">${dayDisplay}</div>
      <div class="booking-date-month">${monthShort}</div>
      ${todayBadge}
    `;

    container.appendChild(card);
  }

  // Load slots for selected date
  if (bookingState.date) {
    selectDate(bookingState.date);
  }
}

/**
 * Render 7 weekday cards for Permanent booking
 */
function renderWeekdayPicker() {
  const container = document.getElementById('weekdayCardsContainer');
  if (!container) return;
  container.innerHTML = '';

  const isEn = isEnglishLang();

  // Default to Saturday (6) if none selected
  if (bookingState.weekday === null || bookingState.weekday === undefined || bookingState.weekday === '') {
    bookingState.weekday = 6;
  }

  WEEKDAY_ORDER.forEach(weekdayId => {
    const isSelected = (parseInt(bookingState.weekday, 10) === weekdayId);
    const dayName = isEn ? ENGLISH_WEEKDAYS[weekdayId] : BENGALI_WEEKDAYS[weekdayId];
    const shortName = isEn ? ENGLISH_WEEKDAYS_SHORT[weekdayId] : BENGALI_WEEKDAYS_SHORT[weekdayId];
    const repeatLabel = isEn ? 'Every Week' : 'প্রতি সপ্তাহ';

    const card = document.createElement('div');
    card.className = `booking-date available ${isSelected ? 'selected' : ''}`;
    card.setAttribute('data-weekday', weekdayId);
    card.onclick = () => selectWeekday(weekdayId);

    card.innerHTML = `
      <div class="booking-date-weekday">${repeatLabel}</div>
      <div class="booking-date-day" style="font-size: 1.1rem; padding: 0.25rem 0;">${shortName}</div>
      <div class="booking-date-month">${dayName}</div>
    `;

    container.appendChild(card);
  });

  // Load recurring slots for selected weekday
  selectWeekday(bookingState.weekday);
}

/**
 * Select a specific date for normal booking
 */
function selectDate(dateStr) {
  bookingState.date = dateStr;
  bookingState.slotId = '';
  bookingState.slotTime = '';

  // Update card styles
  const allCards = document.querySelectorAll('#dateCardsContainer .booking-date');
  allCards.forEach(card => {
    if (card.getAttribute('data-date') === dateStr) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  // Update date label in slots section
  const dateLabel = document.getElementById('selectedDateLabel');
  if (dateLabel) {
    const isEn = isEnglishLang();
    const formattedDate = isEn ? formatDateEnglish(dateStr) : formatDateBengali(dateStr);
    const sessionName = isEn 
      ? (bookingState.session === 'night' ? 'Night Session' : 'Day Session')
      : (bookingState.session === 'night' ? 'নাইট সেশন' : 'ডে সেশন');
    dateLabel.textContent = isEn ? `Date: ${formattedDate} (${sessionName})` : `তারিখ: ${formattedDate} (${sessionName})`;
  }

  // Disable Next button until slot selected
  const nextBtn = document.getElementById('step2NextBtn');
  if (nextBtn) nextBtn.disabled = true;

  // Load available slots
  loadAvailableSlots(dateStr, bookingState.session);
}

/**
 * Select a weekday for permanent booking
 */
function selectWeekday(weekdayId) {
  bookingState.weekday = parseInt(weekdayId, 10);
  bookingState.slotId = '';
  bookingState.slotTime = '';

  // Update card styles
  const allCards = document.querySelectorAll('#weekdayCardsContainer .booking-date');
  allCards.forEach(card => {
    if (parseInt(card.getAttribute('data-weekday'), 10) === bookingState.weekday) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  // Update date label in slots section
  const dateLabel = document.getElementById('selectedDateLabel');
  if (dateLabel) {
    const isEn = isEnglishLang();
    const dayName = isEn ? ENGLISH_WEEKDAYS[bookingState.weekday] : getWeekdayName(bookingState.weekday);
    const sessionName = isEn 
      ? (bookingState.session === 'night' ? 'Night Session' : 'Day Session')
      : (bookingState.session === 'night' ? 'নাইট সেশন' : 'ডে সেশন');
    dateLabel.textContent = isEn ? `Recurring Day: Every ${dayName} (${sessionName})` : `স্থায়ী দিন: প্রতি ${dayName} (${sessionName})`;
  }

  // Disable Next button until slot selected
  const nextBtn = document.getElementById('step2NextBtn');
  if (nextBtn) nextBtn.disabled = true;

  // Load recurring slots
  loadRecurringSlots(bookingState.weekday, bookingState.session);
}

/**
 * Load available slots for Normal booking on a specific date and session
 */
function loadAvailableSlots(date, session) {
  const skeleton = document.getElementById('slotsSkeleton');
  const grid = document.getElementById('slotsGrid');
  const emptyMsg = document.getElementById('slotsEmptyMessage');

  if (skeleton) skeleton.classList.remove('hidden');
  if (grid) grid.classList.add('hidden');
  if (emptyMsg) emptyMsg.classList.add('hidden');

  const baseSlots = (session === 'night') ? NIGHT_SLOTS : DAY_SLOTS;

  // Calculate day-of-week for date to also cross-check recurring permanent bookings
  const parts = date.split('-');
  const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const dateWeekday = dateObj.getDay();

  const db = getDb();
  if (!db) {
    // Offline fallback: render base slots as available
    setTimeout(() => {
      const slots = baseSlots.map(s => ({ ...s, status: 'available' }));
      renderSlots(slots);
      if (skeleton) skeleton.classList.add('hidden');
      if (grid) grid.classList.remove('hidden');
    }, 200);
    return;
  }

  // Query 1: Normal bookings for this date
  const bookingsPromise = db.ref('bookings')
    .orderByChild('date')
    .equalTo(date)
    .once('value');

  // Query 2: Permanent confirmed bookings for this weekday
  const permanentPromise = db.ref('permanentBookings')
    .orderByChild('weekday')
    .equalTo(dateWeekday)
    .once('value');

  // Query 3: Manual availability overrides for this date & session
  const availabilityPromise = db.ref(`availability/${date}/${session}`)
    .once('value');

  Promise.all([bookingsPromise, permanentPromise, availabilityPromise])
    .then(([bookingsSnap, permSnap, availSnap]) => {
      const slotStatusMap = {};

      // Process manual overrides
      if (availSnap.exists()) {
        const availData = availSnap.val();
        Object.keys(availData).forEach(sId => {
          slotStatusMap[sId] = availData[sId];
        });
      }

      // Process normal bookings for this date — only confirmed bookings mark the slot as booked
      if (bookingsSnap.exists()) {
        const bookings = bookingsSnap.val();
        Object.keys(bookings).forEach(key => {
          const b = bookings[key];
          if (b && b.session === session && b.status === 'confirmed') {
            slotStatusMap[b.slotId] = 'booked';
          }
        });
      }

      // Process recurring permanent bookings on this weekday — only confirmed or active mark as booked
      if (permSnap.exists()) {
        const permBookings = permSnap.val();
        Object.keys(permBookings).forEach(key => {
          const pb = permBookings[key];
          if (pb && pb.session === session && (pb.status === 'confirmed' || pb.status === 'active')) {
            slotStatusMap[pb.slotId] = 'booked';
          }
        });
      }

      // Assemble final slot list
      const finalSlots = baseSlots.map(slot => {
        const status = slotStatusMap[slot.id] || 'available';
        return {
          ...slot,
          status: status
        };
      });

      renderSlots(finalSlots);
    })
    .catch(err => {
      console.warn('Slot availability fetch error:', err);
      // Fallback: render default available slots
      const fallbackSlots = baseSlots.map(s => ({ ...s, status: 'available' }));
      renderSlots(fallbackSlots);
    })
    .finally(() => {
      if (skeleton) skeleton.classList.add('hidden');
      if (grid) grid.classList.remove('hidden');
    });
}

/**
 * Load recurring slots for Permanent booking on a specific weekday and session
 */
function loadRecurringSlots(weekday, session) {
  const skeleton = document.getElementById('slotsSkeleton');
  const grid = document.getElementById('slotsGrid');
  const emptyMsg = document.getElementById('slotsEmptyMessage');

  if (skeleton) skeleton.classList.remove('hidden');
  if (grid) grid.classList.add('hidden');
  if (emptyMsg) emptyMsg.classList.add('hidden');

  const baseSlots = (session === 'night') ? NIGHT_SLOTS : DAY_SLOTS;
  const db = getDb();

  if (!db) {
    setTimeout(() => {
      const slots = baseSlots.map(s => ({ ...s, status: 'available' }));
      renderSlots(slots);
      if (skeleton) skeleton.classList.add('hidden');
      if (grid) grid.classList.remove('hidden');
    }, 200);
    return;
  }

  // Fetch permanent bookings for this weekday and session
  db.ref('permanentBookings')
    .orderByChild('weekday')
    .equalTo(weekday)
    .once('value')
    .then((snap) => {
      const slotStatusMap = {};
      if (snap.exists()) {
        const bookings = snap.val();
        Object.keys(bookings).forEach(key => {
          const pb = bookings[key];
          if (pb && pb.session === session && (pb.status === 'confirmed' || pb.status === 'active')) {
            slotStatusMap[pb.slotId] = 'booked';
          }
        });
      }

      const finalSlots = baseSlots.map(slot => {
        const status = slotStatusMap[slot.id] || 'available';
        return {
          ...slot,
          status: status
        };
      });

      renderSlots(finalSlots);
    })
    .catch(err => {
      console.warn('Permanent slots fetch error:', err);
      const fallbackSlots = baseSlots.map(s => ({ ...s, status: 'available' }));
      renderSlots(fallbackSlots);
    })
    .finally(() => {
      if (skeleton) skeleton.classList.add('hidden');
      if (grid) grid.classList.remove('hidden');
    });
}

/**
 * Render slot grid with status indicators
 */
function renderSlots(slots) {
  const grid = document.getElementById('slotsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const isEn = isEnglishLang();
  const emptyMsg = document.getElementById('slotsEmptyMessage');

  if (!slots || slots.length === 0) {
    if (emptyMsg) {
      emptyMsg.classList.remove('hidden');
      emptyMsg.innerHTML = `<i class="fas fa-calendar-times fa-2x mb-2 text-warning"></i><p>${isEn ? 'No available slots found for this date/day' : 'এই তারিখে বা দিনে কোনো উপলব্ধ স্লট পাওয়া যায়নি'}</p>`;
    }
    return;
  }

  if (emptyMsg) {
    emptyMsg.classList.add('hidden');
  }

  slots.forEach(slot => {
    const isSelected = (bookingState.slotId === slot.id);
    const slotEl = document.createElement('div');

    let statusClass = slot.status || 'available';
    if (isSelected) {
      statusClass = 'selected';
    }

    const slotLabel = isEn ? (slot.labelEn || slot.label) : slot.label;
    slotEl.className = `booking-slot ${statusClass}`;
    slotEl.setAttribute('data-slot-id', slot.id);
    slotEl.setAttribute('data-slot-time', slotLabel);

    let statusBadgeText = isEn ? 'Available' : 'খালি';
    let iconClass = 'fa-check';

    if (slot.status === 'booked') {
      statusBadgeText = isEn ? 'Booked' : 'বুকড';
      iconClass = 'fa-lock';
    } else if (slot.status === 'pending') {
      statusBadgeText = isEn ? 'Pending' : 'অপেক্ষমাণ';
      iconClass = 'fa-clock';
    } else if (isSelected) {
      statusBadgeText = isEn ? 'Selected' : 'নির্বাচিত';
      iconClass = 'fa-check-circle';
    }

    slotEl.innerHTML = `
      <div class="booking-slot-time">
        <i class="far fa-clock"></i> ${slotLabel}
      </div>
      <div class="booking-slot-status">
        <i class="fas ${iconClass}"></i> ${statusBadgeText}
      </div>
    `;

    // Click handler
    slotEl.onclick = () => {
      if (slot.status === 'booked') {
        showToast(isEn ? 'Sorry, this slot is already booked. Please choose another slot.' : 'দুঃখিত, এই সময় স্লটটি ইতিমধ্যে বুক করা হয়েছে। অন্য স্লট বেছে নিন।', 'error');
        return;
      }
      if (slot.status === 'pending') {
        showToast(isEn ? 'Another customer requested this slot. Awaiting admin approval.' : 'এই স্লটটির জন্য অন্য একজন বুকিং রিকোয়েস্ট পাঠিয়েছেন। অনুমোদনের অপেক্ষায় রয়েছে।', 'warning');
        return;
      }
      selectSlot(slot.id, slotLabel);
    };

    grid.appendChild(slotEl);
  });
}

/**
 * Select a time slot
 */
function selectSlot(slotId, slotTime) {
  bookingState.slotId = slotId;
  bookingState.slotTime = slotTime;
  const isEn = isEnglishLang();

  // Update UI classes
  const allSlotEls = document.querySelectorAll('#slotsGrid .booking-slot');
  allSlotEls.forEach(el => {
    const id = el.getAttribute('data-slot-id');
    const isThis = (id === slotId);

    if (isThis) {
      el.className = 'booking-slot selected';
      const statusSpan = el.querySelector('.booking-slot-status');
      if (statusSpan) {
        statusSpan.innerHTML = `<i class="fas fa-check-circle"></i> ${isEn ? 'Selected' : 'নির্বাচিত'}`;
      }
    } else {
      if (el.classList.contains('selected')) {
        el.className = 'booking-slot available';
        const statusSpan = el.querySelector('.booking-slot-status');
        if (statusSpan) {
          statusSpan.innerHTML = `<i class="fas fa-check"></i> ${isEn ? 'Available' : 'খালি'}`;
        }
      }
    }
  });

  // Enable Next button in Step 2
  const nextBtn = document.getElementById('step2NextBtn');
  if (nextBtn) {
    nextBtn.disabled = false;
  }

  showToast(isEn ? `Slot selected: ${slotTime}` : `স্লট নির্বাচিত: ${slotTime}`, 'success');
}

// ==========================================
// 8. STEP 3: CUSTOMER INFORMATION FORM
// ==========================================

/**
 * Setup view for Step 3
 */
function setupStep3() {
  const permBox = document.getElementById('permanentConditionBox');
  const condCheckbox = document.getElementById('conditionAccept');
  const permTeamFields = document.getElementById('permanentTeamFields');
  const nameLabelText = document.getElementById('customerNameLabelText');
  const teamNameInput = document.getElementById('teamName');
  const isEn = isEnglishLang();

  if (bookingState.type === 'permanent') {
    if (permBox) permBox.classList.remove('hidden');
    if (condCheckbox) condCheckbox.checked = bookingState.conditionAccepted;
    if (permTeamFields) permTeamFields.classList.remove('hidden');
    if (nameLabelText) nameLabelText.textContent = isEn ? 'Captain Name *' : 'অধিনায়কের নাম *';
    if (teamNameInput && bookingState.teamName) teamNameInput.value = bookingState.teamName;
  } else {
    if (permBox) permBox.classList.add('hidden');
    if (permTeamFields) permTeamFields.classList.add('hidden');
    if (nameLabelText) nameLabelText.textContent = isEn ? 'Your Name *' : 'আপনার নাম *';
  }

  // Pre-populate fields from state
  const nameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('customerPhone');
  const messageInput = document.getElementById('bookingMessage');

  if (nameInput && (bookingState.captainName || bookingState.customerName)) {
    nameInput.value = bookingState.captainName || bookingState.customerName;
  }
  if (phoneInput && bookingState.customerPhone) phoneInput.value = bookingState.customerPhone;
  if (messageInput && bookingState.message) messageInput.value = bookingState.message;
}

/**
 * Validate customer info form fields
 */
function validateForm() {
  const nameInput = document.getElementById('customerName');
  const phoneInput = document.getElementById('customerPhone');
  const messageInput = document.getElementById('bookingMessage');
  const condCheckbox = document.getElementById('conditionAccept');
  const teamNameInput = document.getElementById('teamName');

  const nameError = document.getElementById('customerNameError');
  const phoneError = document.getElementById('customerPhoneError');
  const condError = document.getElementById('conditionAcceptError');
  const teamError = document.getElementById('teamNameError');

  // Reset errors
  if (nameError) nameError.classList.add('hidden');
  if (phoneError) phoneError.classList.add('hidden');
  if (condError) condError.classList.add('hidden');
  if (teamError) teamError.classList.add('hidden');

  let isValid = true;

  // Permanent booking validation: Team Name
  let teamName = '';
  if (bookingState.type === 'permanent') {
    teamName = teamNameInput ? teamNameInput.value.trim() : '';
    if (!teamName || teamName.length < 2) {
      if (teamError) teamError.classList.remove('hidden');
      isValid = false;
    }
  }

  // Name (Captain Name for permanent) validation
  const name = nameInput ? nameInput.value.trim() : '';
  if (!name || name.length < 2) {
    if (nameError) nameError.classList.remove('hidden');
    isValid = false;
  }

  // Phone validation
  const phone = phoneInput ? phoneInput.value.trim() : '';
  if (!isValidBDPhone(phone)) {
    if (phoneError) phoneError.classList.remove('hidden');
    isValid = false;
  }

  // Permanent condition checkbox validation
  let conditionAccepted = false;
  if (bookingState.type === 'permanent') {
    conditionAccepted = condCheckbox ? condCheckbox.checked : false;
    if (!conditionAccepted) {
      if (condError) condError.classList.remove('hidden');
      isValid = false;
      showToast('স্থায়ী বুকিং নিশ্চিত করতে শর্তাবলী মেনে নেওয়া বাধ্যতামূলক', 'warning');
    }
  }

  if (isValid) {
    bookingState.customerName = name;
    bookingState.captainName = name;
    bookingState.teamName = teamName;
    bookingState.customerPhone = cleanPhoneNumber(phone);
    bookingState.message = messageInput ? messageInput.value.trim() : '';
    bookingState.conditionAccepted = conditionAccepted;

    // Cache phone number for subsequent visits
    try {
      localStorage.setItem('evergain_user_phone', bookingState.customerPhone);
      localStorage.setItem('evergain_user_name', bookingState.customerName);
      if (teamName) localStorage.setItem('evergain_user_team', teamName);
    } catch (e) {
      // LocalStorage access might be restricted in some webviews
    }
  }

  return isValid;
}

/**
 * Render customer info form helper
 */
function renderBookingForm() {
  setupStep3();
}

// ==========================================
// 9. STEP 4: SUMMARY & SUBMISSION
// ==========================================

/**
 * Render booking summary in Step 4
 */
function renderSummary() {
  const sumType = document.getElementById('sumType');
  const sumSession = document.getElementById('sumSession');
  const sumDateLabel = document.getElementById('sumDateLabel');
  const sumDateValue = document.getElementById('sumDateValue');
  const sumSlot = document.getElementById('sumSlot');
  const sumCustomerName = document.getElementById('sumCustomerName');
  const sumCustomerPhone = document.getElementById('sumCustomerPhone');
  const sumCustomerMessage = document.getElementById('sumCustomerMessage');
  const sumMessageRow = document.getElementById('sumMessageRow');
  const sumConditionRow = document.getElementById('sumConditionRow');
  const sumPrice = document.getElementById('sumPrice');

  const lang = (window.EverGain && typeof window.EverGain.getLanguage === 'function') ? window.EverGain.getLanguage() : 'bn';
  const isEn = (lang === 'en');

  if (sumType) {
    if (bookingState.type === 'normal') {
      sumType.textContent = isEn ? 'Normal Booking (Single Match)' : 'সাধারণ বুকিং (একক ম্যাচ)';
    } else {
      sumType.textContent = isEn ? 'Permanent Booking (Weekly Slot)' : 'স্থায়ী বুকিং (সাপ্তাহিক স্লট)';
    }
  }

  if (sumSession) {
    if (bookingState.session === 'night') {
      sumSession.textContent = isEn ? 'Night Session (Floodlights)' : 'নাইট সেশন (ফ্লাডলাইট)';
    } else {
      sumSession.textContent = isEn ? 'Day Session' : 'ডে সেশন';
    }
  }

  const sumTeamRow = document.getElementById('sumTeamRow');
  const sumTeamName = document.getElementById('sumTeamName');
  const sumNameLabel = document.getElementById('sumNameLabel');

  if (bookingState.type === 'normal') {
    if (sumDateLabel) sumDateLabel.textContent = isEn ? 'Match Date:' : 'খেলার তারিখ:';
    if (sumDateValue) sumDateValue.textContent = isEn ? bookingState.date : formatDateBengali(bookingState.date);
    if (sumConditionRow) sumConditionRow.classList.add('hidden');
    if (sumTeamRow) sumTeamRow.classList.add('hidden');
    if (sumNameLabel) sumNameLabel.textContent = isEn ? 'Your Name:' : 'গ্রাহকের নাম:';
  } else {
    if (sumDateLabel) sumDateLabel.textContent = isEn ? 'Recurring Day:' : 'স্থায়ী দিন:';
    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = isEn ? `Every ${dayNamesEn[bookingState.weekday]}` : `প্রতি ${getWeekdayName(bookingState.weekday)}`;
    if (sumDateValue) sumDateValue.textContent = dayName;
    if (sumConditionRow) sumConditionRow.classList.remove('hidden');
    if (sumTeamRow) {
      sumTeamRow.classList.remove('hidden');
      if (sumTeamName) sumTeamName.textContent = bookingState.teamName || '-';
    }
    if (sumNameLabel) sumNameLabel.textContent = isEn ? 'Captain Name:' : 'অধিনায়কের নাম:';
  }

  if (sumSlot) sumSlot.textContent = bookingState.slotTime;
  if (sumCustomerName) sumCustomerName.textContent = bookingState.captainName || bookingState.customerName;
  if (sumCustomerPhone) sumCustomerPhone.textContent = bookingState.customerPhone;

  if (sumCustomerMessage && sumMessageRow) {
    if (bookingState.message) {
      sumCustomerMessage.textContent = bookingState.message;
      sumMessageRow.classList.remove('hidden');
    } else {
      sumMessageRow.classList.add('hidden');
    }
  }

  if (sumPrice) {
    sumPrice.textContent = isEn ? `৳${bookingState.price}` : `৳${getBengaliDigits(bookingState.price)}`;
  }
}

/**
 * Submit booking to Firebase with double-booking safety
 */
function submitBooking() {
  if (isSubmitting) return;

  const submitBtn = document.getElementById('submitBookingBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> বুকিং জমা হচ্ছে...';
  }
  isSubmitting = true;

  // Generate unique human-readable Booking ID: EG-YYYYMMDD-XXXX
  const now = new Date();
  const dateCompact = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingId = `EG-${dateCompact}-${randomSuffix}`;

  const serverTimestamp = (typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue)
    ? firebase.database.ServerValue.TIMESTAMP
    : Date.now();

  const bookingData = {
    id: bookingId,
    customerName: bookingState.customerName,
    captainName: bookingState.captainName || bookingState.customerName,
    teamName: bookingState.teamName || '',
    customerPhone: bookingState.customerPhone,
    type: bookingState.type,
    session: bookingState.session,
    date: (bookingState.type === 'normal') ? bookingState.date : null,
    weekday: (bookingState.type === 'permanent') ? parseInt(bookingState.weekday, 10) : null,
    slotId: bookingState.slotId,
    slotTime: bookingState.slotTime,
    price: bookingState.price,
    status: 'pending',
    message: bookingState.message || '',
    conditionAccepted: (bookingState.type === 'permanent'),
    createdAt: serverTimestamp
  };

  const db = getDb();

  // If Firebase is unavailable or offline, save to localStorage fallback
  if (!db) {
    saveToLocalHistory(bookingData);
    setTimeout(() => {
      finishSubmission(bookingData);
    }, 600);
    return;
  }

  // Direct Firebase submission
  const targetNode = (bookingState.type === 'normal') ? `bookings/${bookingId}` : `permanentBookings/${bookingId}`;

  db.ref(targetNode).set(bookingData)
    .then(() => {
      saveToLocalHistory(bookingData);
      finishSubmission(bookingData);
    })
    .catch((err) => {
      console.error('[EVER GAIN] Firebase Booking Submission Error:', err);
      const isPermDenied = err && (err.code === 'PERMISSION_DENIED' || (err.message && err.message.toLowerCase().includes('permission denied')));
      if (isPermDenied) {
        isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-loading');
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>' + (window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Submit Booking' : 'বুকিং জমা দিন') + '</span>';
        }
        showToast('ফায়ারবেস পারমিশন এরর: অনুগ্রহ করে Firebase Console -> Realtime Database -> Rules ট্যাবে write পারমিশন চালু করুন।', 'error');
      } else {
        handleSubmitError(err, bookingData);
      }
    });
}

/**
 * Handle successful booking submission
 */
function finishSubmission(bookingData) {
  isSubmitting = false;
  const submitBtn = document.getElementById('submitBookingBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('btn-loading');
    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>' + (window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Submit Booking' : 'বুকিং জমা দিন') + '</span>';
  }

  showToast(window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Booking submitted successfully!' : 'আপনার বুকিং রিকোয়েস্ট সফলভাবে জমা হয়েছে!', 'success');
  showConfirmation(bookingData);
}

/**
 * Handle submission errors
 */
function handleSubmitError(err, bookingData) {
  isSubmitting = false;
  const submitBtn = document.getElementById('submitBookingBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('btn-loading');
    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> <span>' + (window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Submit Booking' : 'বুকিং জমা দিন') + '</span>';
  }

  if (err && err.message === 'SLOT_TAKEN') {
    showToast(window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Slot already taken, please choose another.' : 'দুঃখিত! এই স্লটটি ইতিমধ্যে বুক করা হয়েছে। অন্য সময় বেছে নিন।', 'error');
    goToStep(2);
  } else {
    console.error('Booking submission fallback:', err);
    saveToLocalHistory(bookingData);
    showToast(window.EverGain && window.EverGain.getLanguage() === 'en' ? 'Booking saved locally.' : 'বুকিং রিকোয়েস্ট লোকালি সংরক্ষিত হয়েছে।', 'warning');
    showConfirmation(bookingData);
  }
}

/**
 * Save booking record to browser localStorage history
 */
function saveToLocalHistory(bookingData) {
  try {
    const raw = localStorage.getItem('evergain_local_bookings');
    const list = raw ? JSON.parse(raw) : [];
    list.unshift({ ...bookingData, localSavedAt: Date.now() });
    localStorage.setItem('evergain_local_bookings', JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

// ==========================================
// 10. BOOKING CONFIRMATION MODAL
// ==========================================

/**
 * Show confirmation modal with booking details
 */
function showConfirmation(bookingData) {
  const modalOverlay = document.getElementById('confirmModalOverlay');
  const modalBookingId = document.getElementById('modalBookingId');
  const modalBookingStatus = document.getElementById('modalBookingStatus');
  const modalBookingType = document.getElementById('modalBookingType');
  const modalBookingSlot = document.getElementById('modalBookingSlot');
  const modalBookingPrice = document.getElementById('modalBookingPrice');

  const lang = (window.EverGain && typeof window.EverGain.getLanguage === 'function') ? window.EverGain.getLanguage() : 'bn';
  const isEn = (lang === 'en');

  if (modalBookingId) modalBookingId.textContent = bookingData.id;
  if (modalBookingStatus) {
    modalBookingStatus.textContent = isEn ? 'Pending Approval' : 'অনুমোদনের অপেক্ষায় (Pending)';
    modalBookingStatus.className = 'badge badge-pending';
  }

  if (modalBookingType) {
    const typeLabel = (bookingData.type === 'normal') 
      ? (isEn ? 'Normal Booking' : 'সাধারণ বুকিং') 
      : (isEn ? 'Permanent Booking' : 'স্থায়ী বুকিং');
    const sessLabel = (bookingData.session === 'night') 
      ? (isEn ? 'Night Session' : 'নাইট সেশন') 
      : (isEn ? 'Day Session' : 'ডে সেশন');
    modalBookingType.textContent = `${typeLabel} (${sessLabel})`;
  }

  if (modalBookingSlot) {
    if (bookingData.type === 'normal') {
      const dateStr = isEn ? bookingData.date : formatDateBengali(bookingData.date);
      modalBookingSlot.textContent = `${dateStr}, ${bookingData.slotTime}`;
    } else {
      const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayStr = isEn ? `Every ${dayNamesEn[bookingData.weekday]}` : `প্রতি ${getWeekdayName(bookingData.weekday)}`;
      modalBookingSlot.textContent = `${dayStr}, ${bookingData.slotTime}`;
    }
  }

  if (modalBookingPrice) {
    modalBookingPrice.textContent = isEn ? `৳${bookingData.price}` : `৳${getBengaliDigits(bookingData.price)}`;
  }

  if (modalOverlay) {
    modalOverlay.classList.add('active');
  }
}

/**
 * Close confirmation modal
 */
function closeConfirmationModal() {
  const modalOverlay = document.getElementById('confirmModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

/**
 * Reset booking wizard to Step 1
 */
function resetBookingWizard() {
  bookingState = {
    step: 1,
    type: '',
    session: '',
    date: '',
    weekday: null,
    slotId: '',
    slotTime: '',
    teamName: '',
    captainName: '',
    customerName: '',
    customerPhone: localStorage.getItem('evergain_user_phone') || '',
    message: '',
    conditionAccepted: false,
    price: 0
  };

  const nameInput = document.getElementById('customerName');
  const teamInput = document.getElementById('teamName');
  const msgInput = document.getElementById('bookingMessage');
  const condCheckbox = document.getElementById('conditionAccept');

  if (nameInput) nameInput.value = '';
  if (teamInput) teamInput.value = '';
  if (msgInput) msgInput.value = '';
  if (condCheckbox) condCheckbox.checked = false;

  const step1NextBtn = document.getElementById('step1NextBtn');
  if (step1NextBtn) step1NextBtn.disabled = true;

  const allSubcards = document.querySelectorAll('.pricing-card');
  allSubcards.forEach(card => card.classList.remove('selected', 'active-plan'));

  goToStep(1);
}

/**
 * Direct user to status checker from modal
 */
function viewMyBookingsFromModal() {
  closeConfirmationModal();
  const phone = bookingState.customerPhone;
  const statusInput = document.getElementById('statusPhoneInput');
  if (statusInput && phone) {
    statusInput.value = phone;
  }
  const section = document.getElementById('bookingStatusCheckSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
  checkBookingStatus();
}

// ==========================================
// 11. BOOKING STATUS CHECK
// ==========================================

/**
 * Check booking status by phone number
 */
function checkBookingStatus() {
  const phoneInput = document.getElementById('statusPhoneInput');
  const resultsContainer = document.getElementById('bookingStatusResults');
  const searchBtn = document.getElementById('searchStatusBtn');

  if (!phoneInput || !resultsContainer) return;

  const rawPhone = phoneInput.value.trim();
  const phone = cleanPhoneNumber(rawPhone);

  if (!isValidBDPhone(phone)) {
    showToast('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)', 'warning');
    return;
  }

  // Loading state
  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> অনুসন্ধান চলছে...';
  }

  resultsContainer.innerHTML = `
    <div class="skeleton-container p-3">
      <div class="skeleton skeleton-card mb-2" style="height: 80px;"></div>
      <div class="skeleton skeleton-card" style="height: 80px;"></div>
    </div>
  `;

  const db = getDb();
  if (!db) {
    // Offline search through local storage
    setTimeout(() => {
      const localBookings = getLocalBookingsByPhone(phone);
      renderBookingHistory(localBookings);
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> স্ট্যাটাস অনুসন্ধান করুন';
      }
    }, 300);
    return;
  }

  // Query both /bookings and /permanentBookings
  const normalQuery = db.ref('bookings')
    .orderByChild('customerPhone')
    .equalTo(phone)
    .once('value');

  const permanentQuery = db.ref('permanentBookings')
    .orderByChild('customerPhone')
    .equalTo(phone)
    .once('value');

  Promise.all([normalQuery, permanentQuery])
    .then(([normalSnap, permSnap]) => {
      const combinedBookings = [];

      if (normalSnap.exists()) {
        const data = normalSnap.val();
        Object.keys(data).forEach(id => {
          combinedBookings.push({ ...data[id], id: data[id].id || id });
        });
      }

      if (permSnap.exists()) {
        const data = permSnap.val();
        Object.keys(data).forEach(id => {
          combinedBookings.push({ ...data[id], id: data[id].id || id, isPermanent: true });
        });
      }

      // Synchronize and prune local storage: If a booking for this phone number is NOT in combinedBookings, it was deleted in Firebase
      try {
        const raw = localStorage.getItem('evergain_local_bookings');
        if (raw) {
          const list = JSON.parse(raw);
          const firebaseIds = new Set(combinedBookings.map(b => b.id));
          const updatedList = list.filter(b => {
            if (cleanPhoneNumber(b.customerPhone) === phone) {
              return firebaseIds.has(b.id);
            }
            return true;
          });
          localStorage.setItem('evergain_local_bookings', JSON.stringify(updatedList));
        }
      } catch (e) {
        console.warn('Pruning local bookings error:', e);
      }

      // Sort by newest first
      combinedBookings.sort((a, b) => {
        const timeA = a.createdAt || a.localSavedAt || 0;
        const timeB = b.createdAt || b.localSavedAt || 0;
        return timeB - timeA;
      });

      renderBookingHistory(combinedBookings);
    })
    .catch((err) => {
      console.warn('Booking status fetch failed, checking local backup:', err);
      const localBookings = getLocalBookingsByPhone(phone);
      renderBookingHistory(localBookings);
    })
    .finally(() => {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> স্ট্যাটাস অনুসন্ধান করুন';
      }
    });
}

/**
 * Fetch local bookings matching phone
 */
function getLocalBookingsByPhone(phone) {
  try {
    const raw = localStorage.getItem('evergain_local_bookings');
    if (!raw) return [];
    const list = JSON.parse(raw);
    return list.filter(b => cleanPhoneNumber(b.customerPhone) === phone);
  } catch (e) {
    return [];
  }
}

/**
 * Render list of found bookings with status badges
 */
function renderBookingHistory(bookings) {
  const container = document.getElementById('bookingStatusResults');
  if (!container) return;

  if (!bookings || bookings.length === 0) {
    container.innerHTML = `
      <div class="card text-center p-4" style="background: rgba(20, 35, 20, 0.4);">
        <i class="fas fa-inbox fa-3x mb-2 text-muted" style="opacity: 0.6;"></i>
        <h4 class="card-title" style="font-size: 1.1rem;">কোনো বুকিংয়ের তথ্য পাওয়া যায়নি</h4>
        <p class="card-text text-secondary mt-1">
          এই মোবাইল নম্বরে পূর্বে করা কোনো বুকিং ডাটাবেজে নেই। আপনি ওপরের ফর্ম ব্যবহার করে এখনই বুকিং করতে পারেন।
        </p>
      </div>
    `;
    return;
  }

  let html = `<div class="booking-history-list" style="display: flex; flex-direction: column; gap: 1rem;">`;

  bookings.forEach(b => {
    let statusBadge = '<span class="badge badge-pending"><i class="fas fa-clock"></i> অপেক্ষমাণ</span>';
    if (b.status === 'confirmed' || b.status === 'active') {
      statusBadge = '<span class="badge badge-confirmed"><i class="fas fa-check-circle"></i> নিশ্চিত</span>';
    } else if (b.status === 'rejected') {
      statusBadge = '<span class="badge badge-rejected"><i class="fas fa-times-circle"></i> অননুমোদিত</span>';
    } else if (b.status === 'cancelled') {
      statusBadge = '<span class="badge badge-cancelled"><i class="fas fa-ban"></i> বাতিল</span>';
    }

    const isPerm = (b.type === 'permanent' || b.isPermanent);
    const typeBadge = isPerm 
      ? '<span class="badge permanent-badge"><i class="fas fa-crown"></i> স্থায়ী বুকিং</span>'
      : '<span class="badge badge-info"><i class="fas fa-futbol"></i> সাধারণ বুকিং</span>';

    const sessionBadge = (b.session === 'night') 
      ? '<span class="text-accent"><i class="fas fa-moon"></i> নাইট সেশন</span>'
      : '<span class="text-primary"><i class="fas fa-sun"></i> ডে সেশন</span>';

    const timeDisplay = isPerm 
      ? `প্রতি ${getWeekdayName(b.weekday)}, ${b.slotTime}`
      : `${formatDateBengali(b.date)}, ${b.slotTime}`;

    html += `
      <div class="card p-3" style="background: rgba(18, 32, 18, 0.7); border: 1px solid var(--color-border);">
        <div class="d-flex-between mb-2" style="flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong class="text-white" style="letter-spacing: 0.5px;">আইডি: ${b.id}</strong>
            <span class="ml-2">${typeBadge}</span>
          </div>
          <div>${statusBadge}</div>
        </div>

        ${b.teamName ? `
          <div class="mb-2" style="font-size: 0.92rem; background: rgba(16, 185, 129, 0.08); padding: 0.4rem 0.6rem; border-radius: 6px;">
            <span class="text-muted"><i class="fas fa-users text-primary"></i> দল:</span> <strong class="text-white">${b.teamName}</strong>
            ${b.captainName ? `<span class="text-muted ml-2">(ক্যাপ্টেন: <strong class="text-white">${b.captainName}</strong>)</span>` : ''}
          </div>
        ` : ''}

        <div class="grid-2 mb-2" style="font-size: 0.92rem; gap: 0.5rem;">
          <div><span class="text-muted">সময় ও সেশন:</span> <strong class="text-white">${timeDisplay}</strong> (${sessionBadge})</div>
          <div><span class="text-muted">বুকিং ফি:</span> <strong class="text-accent">৳${getBengaliDigits(b.price)}</strong></div>
        </div>

        ${b.adminNote ? `
          <div class="condition-box mt-2" style="background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.3);">
            <i class="fas fa-comment-alt text-info"></i>
            <div><strong>কর্তৃপক্ষের বার্তা:</strong> ${b.adminNote}</div>
          </div>
        ` : ''}

        <div class="text-muted mt-2" style="font-size: 0.8rem; border-top: 1px dashed rgba(255,255,255,0.08); padding-top: 0.5rem;">
          <i class="fas fa-user"></i> ${b.captainName || b.customerName} &nbsp;|&nbsp; <i class="fas fa-phone"></i> ${b.customerPhone}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}

// ==========================================
// 12. ANIMATED BACKGROUND PARTICLES
// ==========================================

function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  if (window.innerWidth <= 768) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let animationFrameId;
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  const particleCount = window.innerWidth < 768 ? 25 : 50;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 1,
      color: Math.random() > 0.4 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(132, 204, 22, 0.2)',
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    animationFrameId = requestAnimationFrame(render);
  }

  render();
}

// ==========================================
// 13. NAVIGATION & MOBILE DRAWER
// ==========================================

function initNavigation() {
  if (window.EverGain && typeof window.EverGain.initNavigation === 'function') {
    window.EverGain.initNavigation();
  }
}

// ==========================================
// 14. WINDOW EVENT LISTENERS & EXPORTS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  init();
});

// Listen for global language changes and re-render dynamic content
window.addEventListener('evergain:languageChanged', () => {
  updatePricingDisplay();

  if (bookingState.step === 1) {
    const isEn = isEnglishLang();
    document.querySelectorAll('.category-select-btn').forEach(btn => {
      const isSelected = btn.closest('.pricing-card')?.classList.contains('selected');
      if (isSelected) {
        btn.innerHTML = `<i class="fas fa-check-circle"></i> ${isEn ? 'Selected' : 'নির্বাচিত হয়েছে'}`;
      } else {
        btn.innerHTML = `<i class="fas fa-hand-pointer"></i> ${isEn ? 'Select' : 'নির্বাচন করুন'}`;
      }
    });
  } else if (bookingState.step === 2) {
    setupStep2();
  } else if (bookingState.step === 4) {
    renderSummary();
  }
});

// Expose core functions to window for HTML event handlers
window.bookingState = bookingState;
window.init = init;
window.loadPricing = loadPricing;
window.selectCategory = selectCategory;
window.goToStep = goToStep;
window.renderStepIndicator = renderStepIndicator;
window.renderDatePicker = renderDatePicker;
window.renderWeekdayPicker = renderWeekdayPicker;
window.selectDate = selectDate;
window.selectWeekday = selectWeekday;
window.loadAvailableSlots = loadAvailableSlots;
window.loadRecurringSlots = loadRecurringSlots;
window.renderSlots = renderSlots;
window.selectSlot = selectSlot;
window.renderBookingForm = renderBookingForm;
window.validateForm = validateForm;
window.renderSummary = renderSummary;
window.submitBooking = submitBooking;
window.showConfirmation = showConfirmation;
window.closeConfirmationModal = closeConfirmationModal;
window.resetBookingWizard = resetBookingWizard;
window.viewMyBookingsFromModal = viewMyBookingsFromModal;
window.checkBookingStatus = checkBookingStatus;
window.renderBookingHistory = renderBookingHistory;
window.formatDateBengali = formatDateBengali;
window.getWeekdayName = getWeekdayName;
window.getBengaliDigits = getBengaliDigits;
