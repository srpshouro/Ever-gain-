/**
 * EVER GAIN — Indoor Football Booking Platform
 * Admin Dashboard Management System (admin.js)
 * 
 * Complete implementation for:
 * - Admin Authentication & Role Authorization
 * - Real-time Dashboard Statistics & Recent Activity
 * - Comprehensive Booking Management (Approve, Reject, Cancel, Details)
 * - Permanent Booking Management (Weekly/Monthly Slots, Status Handling)
 * - Dynamic Slot & Schedule Management (Day/Night, Block Dates, Working Days)
 * - Pricing Configuration System (Day/Night, Normal & Permanent)
 * - Gallery Media Management (Upload, Order, Edit, Delete)
 * - Rules & Guidelines Management (Add, Edit, Reorder, Delete)
 * - Global Website & Contact Settings Configuration
 */

(function (window, document) {
  'use strict';

  // =========================================================================
  // Core Application Namespace
  // =========================================================================
  const AdminApp = {
    currentTab: 'dashboard',
    currentUser: null,
    bookings: [],
    permanentBookings: [],
    slots: { day: [], night: [] },
    currentSlotSession: 'day',
    blockedDates: {},
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    gallery: [],
    rules: [],
    settings: {},
    pricing: {},
    listeners: [], // Tracks Firebase references to detach on logout
    pendingConfirmAction: null,
    selectedFileToUpload: null,

    // =======================================================================
    // 1. Initialization
    // =======================================================================
    init() {
      this.cacheDomElements();
      this.bindEvents();
      this.setupAuth();
    },

    cacheDomElements() {
      // Views
      this.loginSection = document.getElementById('adminLoginSection');
      this.dashboardSection = document.getElementById('adminDashboardSection');
      this.adminSidebar = document.getElementById('adminSidebar');
      this.sidebarBackdrop = document.getElementById('sidebarBackdrop');
      this.adminSidebarToggle = document.getElementById('adminSidebarToggle');

      // Auth elements
      this.loginForm = document.getElementById('adminLoginForm');
      this.loginEmailInput = document.getElementById('loginEmail');
      this.loginPasswordInput = document.getElementById('loginPassword');
      this.loginSubmitBtn = document.getElementById('loginSubmitBtn');
      this.googleLoginBtn = document.getElementById('googleLoginBtn');
      this.loginErrorAlert = document.getElementById('adminLoginError');
      this.togglePasswordBtn = document.getElementById('togglePasswordBtn');
      this.passwordEyeIcon = document.getElementById('passwordEyeIcon');
      this.adminLogoutBtn = document.getElementById('adminLogoutBtn');
      this.currentAdminEmailDisplay = document.getElementById('currentAdminEmailDisplay');

      // Modals
      this.bookingDetailOverlay = document.getElementById('bookingDetailModalOverlay');
      this.bookingDetailBody = document.getElementById('bookingDetailModalBody');
      this.bookingDetailFooter = document.getElementById('bookingDetailModalFooter');
      this.confirmOverlay = document.getElementById('confirmModalOverlay');
      this.confirmTitle = document.getElementById('confirmModalTitle');
      this.confirmMessage = document.getElementById('confirmModalMessage');
      this.executeConfirmBtn = document.getElementById('executeConfirmBtn');
      this.cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
      this.editOverlay = document.getElementById('editModalOverlay');
      this.editModalTitle = document.getElementById('editModalTitle');
      this.editModalBody = document.getElementById('editModalBody');
      this.saveEditModalBtn = document.getElementById('saveEditModalBtn');
    },

    bindEvents() {
      const self = this;

      // 1. Password Visibility Toggle
      if (this.togglePasswordBtn && this.loginPasswordInput) {
        this.togglePasswordBtn.addEventListener('click', function () {
          const isPassword = self.loginPasswordInput.type === 'password';
          self.loginPasswordInput.type = isPassword ? 'text' : 'password';
          if (self.passwordEyeIcon) {
            self.passwordEyeIcon.className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
          }
        });
      }

      // 2. Login Form Submit (Email / Password)
      if (this.loginForm) {
        this.loginForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const email = self.loginEmailInput.value.trim();
          const password = self.loginPasswordInput.value;
          self.login(email, password);
        });
      }

      // 2.1 Google Sign-In
      if (this.googleLoginBtn) {
        this.googleLoginBtn.addEventListener('click', function () {
          self.loginWithGoogle();
        });
      }

      // 3. Logout Button
      if (this.adminLogoutBtn) {
        this.adminLogoutBtn.addEventListener('click', function () {
          self.showConfirm(
            'লগআউট নিশ্চিতকরণ',
            'আপনি কি নিশ্চিত যে আপনি এডমিন প্যানেল থেকে লগআউট করতে চান?',
            function () {
              self.logout();
            }
          );
        });
      }

      // 4. Sidebar Toggle (Mobile)
      if (this.adminSidebarToggle && this.adminSidebar) {
        this.adminSidebarToggle.addEventListener('click', function () {
          self.toggleSidebar();
        });
      }

      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.addEventListener('click', function () {
          self.closeSidebar();
        });
      }

      // 5. Sidebar Navigation Links (Tab switching)
      const tabLinks = document.querySelectorAll('.admin-sidebar-link[data-tab]');
      tabLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          const tabName = this.getAttribute('data-tab');
          self.switchTab(tabName);
        });
      });

      // Quick navigation button in dashboard
      const viewAllBookingsBtn = document.getElementById('viewAllBookingsBtn');
      if (viewAllBookingsBtn) {
        viewAllBookingsBtn.addEventListener('click', function () {
          self.switchTab('bookings');
        });
      }

      const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
      if (refreshDashboardBtn) {
        refreshDashboardBtn.addEventListener('click', function () {
          self.loadDashboardStats();
          self.toast('পরিসংখ্যান আপডেট করা হয়েছে', 'info');
        });
      }

      // 6. Booking Search & Filters
      const bookingSearchInput = document.getElementById('bookingSearchInput');
      const bookingDateFilter = document.getElementById('bookingDateFilter');
      const bookingSessionFilter = document.getElementById('bookingSessionFilter');
      const bookingStatusFilter = document.getElementById('bookingStatusFilter');
      const clearBookingFiltersBtn = document.getElementById('clearBookingFiltersBtn');

      if (bookingSearchInput) {
        bookingSearchInput.addEventListener('input', function () {
          self.filterBookings();
        });
      }

      if (bookingDateFilter) {
        bookingDateFilter.addEventListener('change', function () {
          self.filterBookings();
        });
      }

      if (bookingSessionFilter) {
        bookingSessionFilter.addEventListener('change', function () {
          self.filterBookings();
        });
      }

      if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener('change', function () {
          self.filterBookings();
        });
      }

      if (clearBookingFiltersBtn) {
        clearBookingFiltersBtn.addEventListener('click', function () {
          if (bookingSearchInput) bookingSearchInput.value = '';
          if (bookingDateFilter) bookingDateFilter.value = '';
          if (bookingSessionFilter) bookingSessionFilter.value = '';
          if (bookingStatusFilter) bookingStatusFilter.value = '';
          self.filterBookings();
        });
      }

      // 7. Permanent Booking Filters
      const permanentSearchInput = document.getElementById('permanentSearchInput');
      const permanentStatusFilter = document.getElementById('permanentStatusFilter');

      if (permanentSearchInput) {
        permanentSearchInput.addEventListener('input', function () {
          self.filterPermanentBookings();
        });
      }

      if (permanentStatusFilter) {
        permanentStatusFilter.addEventListener('change', function () {
          self.filterPermanentBookings();
        });
      }

      // 8. Slot Management Controls
      const slotDayBtn = document.getElementById('slotSessionDayBtn');
      const slotNightBtn = document.getElementById('slotSessionNightBtn');
      if (slotDayBtn && slotNightBtn) {
        slotDayBtn.addEventListener('click', function () {
          self.setSlotSession('day');
        });
        slotNightBtn.addEventListener('click', function () {
          self.setSlotSession('night');
        });
      }

      const addSlotForm = document.getElementById('addSlotForm');
      if (addSlotForm) {
        addSlotForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const startTime = document.getElementById('slotStartTime').value;
          const endTime = document.getElementById('slotEndTime').value;
          self.addSlot(self.currentSlotSession, startTime, endTime);
        });
      }

      const blockDateForm = document.getElementById('blockDateForm');
      if (blockDateForm) {
        blockDateForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const date = document.getElementById('blockDateInput').value;
          const reason = document.getElementById('blockDateReasonInput').value;
          self.blockDate(date, reason);
        });
      }

      const workingDaysForm = document.getElementById('workingDaysForm');
      if (workingDaysForm) {
        workingDaysForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.saveWorkingDays();
        });
      }

      // 9. Pricing Form
      const pricingForm = document.getElementById('pricingForm');
      if (pricingForm) {
        pricingForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.savePricing();
        });
      }

      // 10. Gallery Upload Form & Drag Drop
      this.setupGalleryUploadHandlers();

      // 11. Rules Form
      const addRuleForm = document.getElementById('addRuleForm');
      if (addRuleForm) {
        addRuleForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const icon = document.getElementById('ruleIconInput').value.trim();
          const title = document.getElementById('ruleTitleInput').value.trim();
          const desc = document.getElementById('ruleDescInput').value.trim();
          self.addRule(icon, title, desc);
        });
      }

      // 12. Settings Form
      const adminSettingsForm = document.getElementById('adminSettingsForm');
      if (adminSettingsForm) {
        adminSettingsForm.addEventListener('submit', function (e) {
          e.preventDefault();
          self.saveSettings();
        });
      }

      // 12.1 One-Click Seed Database Button
      const seedDatabaseBtn = document.getElementById('seedDatabaseBtn');
      if (seedDatabaseBtn) {
        seedDatabaseBtn.addEventListener('click', function () {
          self.seedDatabase();
        });
      }

      // 13. Universal Confirmation Modal Event Listeners
      if (this.executeConfirmBtn) {
        this.executeConfirmBtn.addEventListener('click', function () {
          if (typeof self.pendingConfirmAction === 'function') {
            self.pendingConfirmAction();
          }
          self.closeConfirmModal();
        });
      }

      if (this.cancelConfirmBtn) {
        this.cancelConfirmBtn.addEventListener('click', function () {
          self.closeConfirmModal();
        });
      }

      const closeConfirmModalBtn = document.getElementById('closeConfirmModalBtn');
      if (closeConfirmModalBtn) {
        closeConfirmModalBtn.addEventListener('click', function () {
          self.closeConfirmModal();
        });
      }

      // Close Booking Detail Modal
      const closeBookingDetailModalBtn = document.getElementById('closeBookingDetailModalBtn');
      const dismissBookingDetailBtn = document.getElementById('dismissBookingDetailBtn');
      if (closeBookingDetailModalBtn) {
        closeBookingDetailModalBtn.addEventListener('click', function () {
          self.closeBookingDetailModal();
        });
      }
      if (dismissBookingDetailBtn) {
        dismissBookingDetailBtn.addEventListener('click', function () {
          self.closeBookingDetailModal();
        });
      }

      // Close Edit Modal
      const closeEditModalBtn = document.getElementById('closeEditModalBtn');
      const cancelEditModalBtn = document.getElementById('cancelEditModalBtn');
      if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', function () {
          self.closeEditModal();
        });
      }
      if (cancelEditModalBtn) {
        cancelEditModalBtn.addEventListener('click', function () {
          self.closeEditModal();
        });
      }
    },

    // =======================================================================
    // 2. Authentication & Admin Role Checking
    // =======================================================================
    setupAuth() {
      const self = this;
      const auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);

      if (!auth) {
        console.warn('[Admin] Firebase Auth unavailable.');
        self.showLoginScreen();
        return;
      }

      auth.onAuthStateChanged(function (user) {
        if (user) {
          self.currentUser = user;
          self.checkAdmin(user.uid).then(function (isAdmin) {
            if (isAdmin) {
              self.showDashboardScreen(user);
              self.initializeDashboardData();
            } else {
              const errMsg = `অননুমোদিত অ্যাক্সেস! আপনার অ্যাকাউন্টে (${user.email || 'ব্যবহারকারী'}, UID: ${user.uid}) এডমিন অধিকার নেই। এটি Firebase Realtime Database এর /admins/${user.uid} নোডে রেজিস্টার্ড থাকতে হবে।`;
              self.showLoginError(errMsg);
              self.toast('অ্যাকাউন্টে এডমিন অধিকার নেই।', 'error');
              auth.signOut();
            }
          }).catch(function (error) {
            console.error('[Admin] Error checking admin status:', error);
            self.showLoginError('এডমিন অধিকার যাচাইয়ে সমস্যা হয়েছে: ' + (error.message || 'Firebase এ অনুমতি নেই'));
            auth.signOut();
          });
        } else {
          self.currentUser = null;
          self.detachListeners();
          self.showLoginScreen();
        }
      });
    },

    checkAdmin(uid) {
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return Promise.reject(new Error('Firebase Database সংযোগ পাওয়া যায়নি'));

      const self = this;
      const SUPERADMIN_EMAILS = ['srpshourovdev1@gmail.com'];
      const userEmail = (self.currentUser && self.currentUser.email) ? self.currentUser.email.toLowerCase().trim() : '';
      const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);

      if (isSuperAdmin) {
        // Auto-register superadmin in Realtime Database /admins/${uid} node
        return db.ref('admins/' + uid).update({
          email: userEmail,
          role: 'admin',
          name: 'Super Admin',
          active: true,
          lastLogin: Date.now()
        }).then(function () {
          return true;
        }).catch(function (err) {
          console.warn('[Admin] Superadmin DB sync note:', err.message);
          return true; // Always allow superadmin access
        });
      }

      return db.ref('admins/' + uid).once('value').then(function (snapshot) {
        const val = snapshot.val();
        if (snapshot.exists() && (val === true || (val && (val.role === 'admin' || val.active === true)))) {
          return true;
        }

        // If the admins node does not exist at all in Firebase, seed the first user as admin
        return db.ref('admins').once('value').then(function (allAdmins) {
          if (!allAdmins.exists()) {
            return db.ref('admins/' + uid).set({
              email: (self.currentUser && self.currentUser.email) || 'admin@evergain.com',
              role: 'admin',
              active: true,
              createdAt: Date.now()
            }).then(() => true);
          }
          return false;
        });
      });
    },

    login(email, password) {
      const self = this;
      if (!email || !password) {
        self.showLoginError('অনুগ্রহ করে সঠিক ইমেইল ও পাসওয়ার্ড প্রদান করুন।');
        return;
      }

      const auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
      if (!auth) {
        self.showLoginError('Firebase Auth সংযোগ পাওয়া যায়নি।');
        return;
      }

      self.setButtonLoading(self.loginSubmitBtn, true, 'লগইন করা হচ্ছে...');
      self.hideLoginError();

      auth.signInWithEmailAndPassword(email, password)
        .then(function (userCredential) {
          self.setButtonLoading(self.loginSubmitBtn, false, 'ইমেইল দিয়ে লগইন করুন');
          self.toast('সফলভাবে লগইন হয়েছে!', 'success');
        })
        .catch(function (error) {
          self.setButtonLoading(self.loginSubmitBtn, false, 'ইমেইল দিয়ে লগইন করুন');
          let msg = 'লগইন ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।';
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।';
          } else if (error.code === 'auth/invalid-email') {
            msg = 'ইমেইল ঠিকানাটি সঠিক ফরম্যাটে লিখুন।';
          } else if (error.code === 'auth/too-many-requests') {
            msg = 'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িক লক করা হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
          } else if (error.message) {
            msg = error.message;
          }
          self.showLoginError(msg);
        });
    },

    loginWithGoogle() {
      const self = this;
      const auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
      if (!auth) {
        self.showLoginError('Firebase Auth সংযোগ পাওয়া যায়নি।');
        return;
      }

      self.setButtonLoading(self.googleLoginBtn, true, 'Google সংযোগ হচ্ছে...');
      self.hideLoginError();

      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(function (result) {
          self.setButtonLoading(self.googleLoginBtn, false, 'Google অ্যাকাউন্ট দিয়ে লগইন করুন');
          self.toast('Google অথেনটিকেশন সফল!', 'success');
        })
        .catch(function (error) {
          self.setButtonLoading(self.googleLoginBtn, false, 'Google অ্যাকাউন্ট দিয়ে লগইন করুন');
          let msg = 'Google দিয়ে লগইন ব্যর্থ হয়েছে।';
          if (error.code === 'auth/popup-closed-by-user') {
            msg = 'লগইন উইন্ডোটি বন্ধ করা হয়েছে।';
          } else if (error.code === 'auth/popup-blocked') {
            msg = 'ব্রাউজারের পপ-আপ ব্লক করা আছে। দয়া করে পপ-আপ অনুমতি দিন।';
          } else if (error.message) {
            msg = error.message;
          }
          self.showLoginError(msg);
        });
    },

    logout() {
      const auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
      this.detachListeners();
      if (auth) {
        auth.signOut().then(() => {
          this.toast('সফলভাবে লগআউট হয়েছে', 'info');
        });
      } else {
        this.showLoginScreen();
      }
    },

    showLoginScreen() {
      if (this.loginSection) this.loginSection.classList.remove('hidden');
      if (this.dashboardSection) this.dashboardSection.classList.add('hidden');
      if (this.loginForm) this.loginForm.reset();
      this.hideLoginError();
    },

    showDashboardScreen(user) {
      if (this.loginSection) this.loginSection.classList.add('hidden');
      if (this.dashboardSection) this.dashboardSection.classList.remove('hidden');
      if (this.currentAdminEmailDisplay && user) {
        this.currentAdminEmailDisplay.textContent = user.email || 'Admin User';
      }
    },

    showLoginError(message) {
      if (this.loginErrorAlert) {
        this.loginErrorAlert.textContent = message;
        this.loginErrorAlert.classList.remove('hidden');
      }
    },

    hideLoginError() {
      if (this.loginErrorAlert) {
        this.loginErrorAlert.classList.add('hidden');
        this.loginErrorAlert.textContent = '';
      }
    },

    // =======================================================================
    // 3. Navigation & Layout Controls
    // =======================================================================
    switchTab(tabName) {
      this.currentTab = tabName;

      // 1. Update Sidebar Links Active State
      const links = document.querySelectorAll('.admin-sidebar-link');
      links.forEach(function (link) {
        if (link.getAttribute('data-tab') === tabName) {
          link.classList.add('active');
          link.setAttribute('aria-selected', 'true');
        } else {
          link.classList.remove('active');
          link.setAttribute('aria-selected', 'false');
        }
      });

      // 2. Hide all tab sections, show target
      const sections = document.querySelectorAll('.admin-section');
      sections.forEach(function (sec) {
        sec.classList.add('hidden');
      });

      const activeSection = document.getElementById('tab-' + tabName);
      if (activeSection) {
        activeSection.classList.remove('hidden');
      }

      // Close mobile sidebar after navigation
      this.closeSidebar();

      // Trigger custom render if needed
      if (tabName === 'dashboard') {
        this.loadDashboardStats();
        this.loadRecentBookings();
      } else if (tabName === 'bookings') {
        this.filterBookings();
      } else if (tabName === 'permanent') {
        this.filterPermanentBookings();
      } else if (tabName === 'slots') {
        this.renderSlots(this.currentSlotSession);
        this.renderBlockedDates();
      } else if (tabName === 'pricing') {
        this.renderPricingInputs();
      } else if (tabName === 'gallery') {
        this.renderGalleryGrid();
      } else if (tabName === 'rules') {
        this.renderRulesList();
      } else if (tabName === 'settings') {
        this.renderSettingsInputs();
      }
    },

    toggleSidebar() {
      if (this.adminSidebar) {
        this.adminSidebar.classList.toggle('active');
        this.adminSidebar.classList.toggle('open');
      }
      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.classList.toggle('active');
      }
      document.body.classList.toggle('sidebar-open');
    },

    closeSidebar() {
      if (this.adminSidebar) {
        this.adminSidebar.classList.remove('active');
        this.adminSidebar.classList.remove('open');
      }
      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.classList.remove('active');
      }
      document.body.classList.remove('sidebar-open');
    },

    // =======================================================================
    // 4. Data Initialization & Listeners
    // =======================================================================
    initializeDashboardData() {
      this.loadBookings();
      this.loadPermanentBookings();
      this.loadSlots();
      this.loadBlockedDates();
      this.loadWorkingDays();
      this.loadPricing();
      this.loadGalleryAdmin();
      this.loadRulesAdmin();
      this.loadSettings();
    },

    detachListeners() {
      this.listeners.forEach(function (listener) {
        try {
          if (listener.ref && typeof listener.ref.off === 'function') {
            listener.ref.off(listener.event || 'value');
          }
        } catch (e) {
          console.warn('[Admin] Error detaching listener:', e);
        }
      });
      this.listeners = [];
    },

    // =======================================================================
    // 5. Dashboard Tab: Stats & Recent Activity
    // =======================================================================
    loadDashboardStats() {
      const stats = {
        total: this.bookings.length,
        pending: 0,
        confirmed: 0,
        cancelled: 0,
        permanent: 0,
        today: 0
      };

      const todayStr = this.getTodayDateString();

      this.bookings.forEach(function (b) {
        const st = (b.status || 'pending').toLowerCase();
        if (st === 'pending') stats.pending++;
        else if (st === 'confirmed') stats.confirmed++;
        else if (st === 'cancelled' || st === 'rejected') stats.cancelled++;

        if (b.date === todayStr) {
          stats.today++;
        }
      });

      // Count active permanent bookings
      this.permanentBookings.forEach(function (pb) {
        if ((pb.status || 'active').toLowerCase() === 'active') {
          stats.permanent++;
        }
      });

      this.renderStats(stats);
      this.loadRecentBookings();
    },

    renderStats(stats) {
      const elTotal = document.getElementById('statTotalBookings');
      const elPending = document.getElementById('statPendingBookings');
      const elConfirmed = document.getElementById('statConfirmedBookings');
      const elCancelled = document.getElementById('statCancelledBookings');
      const elPermanent = document.getElementById('statPermanentBookings');
      const elToday = document.getElementById('statTodayBookings');

      if (elTotal) elTotal.textContent = this.bengaliNum(stats.total);
      if (elPending) elPending.textContent = this.bengaliNum(stats.pending);
      if (elConfirmed) elConfirmed.textContent = this.bengaliNum(stats.confirmed);
      if (elCancelled) elCancelled.textContent = this.bengaliNum(stats.cancelled);
      if (elPermanent) elPermanent.textContent = this.bengaliNum(stats.permanent);
      if (elToday) elToday.textContent = this.bengaliNum(stats.today);

      // Sidebar badges
      const pendingBadge = document.getElementById('pendingBookingsBadge');
      if (pendingBadge) {
        if (stats.pending > 0) {
          pendingBadge.textContent = this.bengaliNum(stats.pending);
          pendingBadge.classList.remove('hidden');
        } else {
          pendingBadge.classList.add('hidden');
        }
      }

      const permanentBadge = document.getElementById('permanentBadge');
      if (permanentBadge) {
        if (stats.permanent > 0) {
          permanentBadge.textContent = this.bengaliNum(stats.permanent);
          permanentBadge.classList.remove('hidden');
        } else {
          permanentBadge.classList.add('hidden');
        }
      }
    },

    loadRecentBookings() {
      const tbody = document.getElementById('recentBookingsTbody');
      if (!tbody) return;

      // Sort bookings by createdAt desc, take top 8
      const sorted = this.bookings.slice().sort(function (a, b) {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      }).slice(0, 8);

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">কোন বুকিং রেকর্ড নেই</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      sorted.forEach(function (b) {
        const idDisplay = b.id ? (b.id.length > 12 ? b.id.substring(0, 10) + '...' : b.id) : '-';
        const nameDisplay = self.escapeHtml(b.customerName || b.name || 'বেনামী');
        const rawPhone = b.customerPhone || b.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const dateDisplay = self.formatDate(b.date);
        const sessionBadge = b.session === 'night'
          ? '<span class="badge" style="background: rgba(59,130,246,0.15); color: #60a5fa;"><i class="fas fa-moon"></i> নাইট</span>'
          : '<span class="badge" style="background: rgba(245,158,11,0.15); color: #fbbf24;"><i class="fas fa-sun"></i> ডে</span>';
        const slotDisplay = self.escapeHtml(b.slotTime || b.slot || b.time || '-');
        const priceDisplay = self.formatPrice(b.price || b.totalAmount || 0);
        const st = (b.status || 'pending').toLowerCase();
        const statusBadge = self.getStatusBadge(b.status);
        const isPending = (st === 'pending');

        html += `
          <tr class="booking-row" onclick="AdminApp.viewBookingDetail('${b.id}')">
            <td><code>${idDisplay}</code></td>
            <td><strong>${nameDisplay}</strong></td>
            <td>${rawPhone ? `<a href="tel:${rawPhone}" onclick="event.stopPropagation()" style="color: inherit; text-decoration: none;">${phoneDisplay}</a>` : '-'}</td>
            <td>${dateDisplay}</td>
            <td>${sessionBadge} <br><small>${slotDisplay}</small></td>
            <td>${priceDisplay}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="action-buttons">
                ${isPending ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="event.stopPropagation(); AdminApp.approveBooking('${b.id}')" title="অনুমোদন করুন">
                    <i class="fas fa-circle-check"></i> <span>কনফার্ম</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.rejectBooking('${b.id}')" title="প্রত্যাখ্যান করুন">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); AdminApp.viewBookingDetail('${b.id}')" title="বিস্তারিত দেখুন">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    },

    // =======================================================================
    // 6. Booking Management
    // =======================================================================
    loadBookings() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const bookingsRef = db.ref('bookings');
      this.listeners.push({ ref: bookingsRef, event: 'value' });

      bookingsRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.bookings = [];

        if (data) {
          Object.keys(data).forEach(function (key) {
            const item = data[key];
            if (typeof item === 'object' && item !== null) {
              item.id = item.id || key;
              self.bookings.push(item);
            }
          });
        }

        self.loadDashboardStats();
        self.filterBookings();
      }, function (err) {
        console.error('[Admin] Error loading bookings:', err);
      });
    },

    filterBookings() {
      const searchInput = document.getElementById('bookingSearchInput');
      const dateFilter = document.getElementById('bookingDateFilter');
      const sessionFilter = document.getElementById('bookingSessionFilter');
      const statusFilter = document.getElementById('bookingStatusFilter');

      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const filterDate = dateFilter ? dateFilter.value : '';
      const filterSession = sessionFilter ? sessionFilter.value : '';
      const filterStatus = statusFilter ? statusFilter.value : '';

      const filtered = this.bookings.filter(function (b) {
        // Search matches name, phone, or id
        if (query) {
          const name = (b.name || b.customerName || '').toLowerCase();
          const phone = (b.phone || '').toLowerCase();
          const id = (b.id || '').toLowerCase();
          if (!name.includes(query) && !phone.includes(query) && !id.includes(query)) {
            return false;
          }
        }

        // Date filter
        if (filterDate && b.date !== filterDate) {
          return false;
        }

        // Session filter
        if (filterSession && (b.session || '').toLowerCase() !== filterSession) {
          return false;
        }

        // Status filter
        if (filterStatus && (b.status || 'pending').toLowerCase() !== filterStatus) {
          return false;
        }

        return true;
      });

      // Sort by createdAt desc
      filtered.sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      this.renderBookings(filtered);
    },

    renderBookings(list) {
      const tbody = document.getElementById('allBookingsTbody');
      const countDisplay = document.getElementById('bookingsCountDisplay');

      if (countDisplay) {
        countDisplay.textContent = `মোট বুকিং: ${this.bengaliNum(list.length)} টি`;
      }

      if (!tbody) return;

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">কোন বুকিং খুঁজে পাওয়া যায়নি</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      list.forEach(function (b) {
        const idShort = b.id ? (b.id.length > 14 ? b.id.substring(0, 12) + '...' : b.id) : '-';
        const nameDisplay = self.escapeHtml(b.customerName || b.name || 'বেনামী');
        const rawPhone = b.customerPhone || b.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const dateDisplay = self.formatDate(b.date);
        const sessionDisplay = (b.session === 'night') ? 'নাইট (Night)' : 'ডে (Day)';
        const slotDisplay = self.escapeHtml(b.slotTime || b.slot || b.time || '-');
        const priceDisplay = self.formatPrice(b.price || b.totalAmount || 0);
        const st = (b.status || 'pending').toLowerCase();
        const statusBadge = self.getStatusBadge(b.status);
        const isPending = (st === 'pending');
        const isConfirmed = (st === 'confirmed');

        html += `
          <tr class="booking-row" onclick="AdminApp.viewBookingDetail('${b.id}')">
            <td><code title="${b.id}">${idShort}</code></td>
            <td><strong>${nameDisplay}</strong></td>
            <td>${rawPhone ? `<a href="tel:${rawPhone}" onclick="event.stopPropagation()" style="color: inherit; text-decoration: none;">${phoneDisplay}</a>` : '-'}</td>
            <td>${dateDisplay}</td>
            <td>${sessionDisplay}</td>
            <td>${slotDisplay}</td>
            <td>${priceDisplay}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="action-buttons">
                ${isPending ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="event.stopPropagation(); AdminApp.approveBooking('${b.id}')" title="অনুমোদন করুন">
                    <i class="fas fa-circle-check"></i> <span>কনফার্ম</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.rejectBooking('${b.id}')" title="প্রত্যাখ্যান করুন">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                ${isConfirmed ? `
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.cancelBooking('${b.id}')" title="বুকিং বাতিল করুন">
                    <i class="fas fa-ban"></i> <span>বাতিল</span>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); AdminApp.viewBookingDetail('${b.id}')" title="বিস্তারিত দেখুন">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    },

    approveBooking(id) {
      const self = this;
      let b = this.bookings.find(item => item.id === id);

      const executeApproval = function (bookingData) {
        const custName = bookingData.customerName || bookingData.name || 'এই গ্রাহকের';
        const dateStr = bookingData.date ? self.formatDate(bookingData.date) : 'নির্ধারিত';
        self.showConfirm(
          'বুকিং অনুমোদন নিশ্চিতকরণ',
          `আপনি কি ${custName}-এর জন্য ${dateStr} তারিখের বুকিং অনুমোদন করতে চান?`,
          function () {
            const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
            if (!db) {
              self.toast('ডাটাবেজ সংযোগ পাওয়া যায়নি', 'error');
              return;
            }

            const updates = {};
            updates[`bookings/${id}/status`] = 'confirmed';
            updates[`bookings/${id}/updatedAt`] = Date.now();

            // Mark slot in availability node if date exists
            const slotKey = bookingData.slotId || (bookingData.slotTime ? bookingData.slotTime.replace(/[^a-zA-Z0-9]/g, '_') : 'default');
            if (bookingData.date) {
              const session = bookingData.session || 'day';
              updates[`availability/${bookingData.date}/${slotKey}`] = {
                status: 'booked',
                bookingId: id,
                customerName: custName
              };
              updates[`availability/${bookingData.date}/${session}/${slotKey}`] = 'booked';
            }

            db.ref().update(updates).then(function () {
              self.toast('বুকিং সফলভাবে অনুমোদন করা হয়েছে!', 'success');
              self.closeBookingDetailModal();
              self.closeConfirmModal();
            }).catch(function (err) {
              console.error('[Admin] Error approving booking:', err);
              self.toast('অনুমোদনে সমস্যা হয়েছে।', 'error');
            });
          }
        );
      };

      if (b) {
        executeApproval(b);
      } else {
        const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
        if (db) {
          db.ref('bookings/' + id).once('value').then(function (snap) {
            const val = snap.val();
            if (val) {
              val.id = id;
              executeApproval(val);
            } else {
              self.toast('বুকিং তথ্য পাওয়া যায়নি', 'error');
            }
          }).catch(function () {
            self.toast('বুকিং তথ্য লোড করা যায়নি', 'error');
          });
        }
      }
    },

    rejectBooking(id) {
      const self = this;
      const b = this.bookings.find(item => item.id === id);
      if (!b) return;

      this.showConfirm(
        'বুকিং প্রত্যাখ্যান নিশ্চিতকরণ',
        `আপনি কি নিশ্চিত যে ${b.name || 'এই গ্রাহকের'} বুকিং প্রত্যাখ্যান করতে চান?`,
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          const updates = {};
          updates[`bookings/${id}/status`] = 'rejected';
          updates[`bookings/${id}/updatedAt`] = Date.now();

          // Free slot availability
          if (b.date && b.slotId) {
            const session = b.session || 'day';
            updates[`availability/${b.date}/${b.slotId}`] = null;
            updates[`availability/${b.date}/${session}/${b.slotId}`] = null;
          }

          db.ref().update(updates).then(function () {
            self.toast('বুকিং প্রত্যাখ্যান করা হয়েছে', 'warning');
            self.closeBookingDetailModal();
          }).catch(function (err) {
            console.error('[Admin] Error rejecting booking:', err);
            self.toast('প্রত্যাখ্যানে সমস্যা হয়েছে।', 'error');
          });
        }
      );
    },

    cancelBooking(id) {
      const self = this;
      const b = this.bookings.find(item => item.id === id);
      if (!b) return;

      this.showConfirm(
        'বুকিং বাতিল নিশ্চিতকরণ',
        `সতর্কতা: এটি একটি নিশ্চিত বুকিং। আপনি কি নিশ্চিত যে এটি বাতিল করতে চান?`,
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          const updates = {};
          updates[`bookings/${id}/status`] = 'cancelled';
          updates[`bookings/${id}/cancelledAt`] = Date.now();

          if (b.date && b.slotId) {
            const session = b.session || 'day';
            updates[`availability/${b.date}/${b.slotId}`] = null;
            updates[`availability/${b.date}/${session}/${b.slotId}`] = null;
          }

          db.ref().update(updates).then(function () {
            self.toast('বুকিং বাতিল করা হয়েছে', 'info');
            self.closeBookingDetailModal();
          }).catch(function (err) {
            console.error('[Admin] Error cancelling booking:', err);
            self.toast('বাতিল করতে ত্রুটি হয়েছে।', 'error');
          });
        }
      );
    },

    viewBookingDetail(id) {
      let b = this.bookings.find(item => item.id === id);
      if (!b) {
        b = this.permanentBookings.find(item => item.id === id);
      }
      if (!b || !this.bookingDetailBody) return;

      const nameDisplay = this.escapeHtml(b.customerName || b.name || 'বেনামী');
      const rawPhone = b.customerPhone || b.phone || '';
      const phoneDisplay = rawPhone ? this.escapeHtml(rawPhone) : '-';
      const emailDisplay = this.escapeHtml(b.customerEmail || b.email || 'তথ্য নেই');
      const dateDisplay = b.date ? this.formatDate(b.date) : (b.weekday !== undefined ? this.getWeekdayName(b.weekday) : '-');
      const sessionDisplay = (b.session === 'night') ? 'নাইট (Night)' : 'ডে (Day)';
      const slotDisplay = this.escapeHtml(b.slotTime || b.slot || b.time || '-');
      const priceDisplay = this.formatPrice(b.price || b.monthlyFee || b.totalAmount || 0);
      const categoryDisplay = this.escapeHtml(b.category || (b.type === 'permanent' ? 'স্থায়ী বুকিং' : 'সাধারণ বুকিং'));
      const playersCount = b.players ? this.bengaliNum(b.players) + ' জন' : 'তথ্য নেই';
      const notesDisplay = this.escapeHtml(b.message || b.notes || 'কোন বিশেষ বার্তা নেই');
      const createdAtDisplay = b.createdAt ? new Date(b.createdAt).toLocaleString('bn-BD') : '-';
      const st = (b.status || 'pending').toLowerCase();
      const statusBadge = this.getStatusBadge(b.status);

      this.bookingDetailBody.innerHTML = `
        <div class="booking-detail-grid">
          <div class="card mb-3" style="background: var(--color-surface); padding: 1rem;">
            <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-user"></i> গ্রাহকের তথ্য</h4>
            <p><strong>নাম:</strong> ${nameDisplay}</p>
            <p><strong>মোবাইল:</strong> ${rawPhone ? `<a href="tel:${rawPhone}">${phoneDisplay}</a>` : '-'}</p>
            <p><strong>ইমেইল:</strong> ${emailDisplay}</p>
            <p><strong>খেলোয়াড় সংখ্যা:</strong> ${playersCount}</p>
          </div>

          <div class="card mb-3" style="background: var(--color-surface); padding: 1rem;">
            <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-calendar-check"></i> স্লটের তথ্য</h4>
            <p><strong>বুকিং আইডি:</strong> <code>${b.id}</code></p>
            <p><strong>তারিখ / বার:</strong> ${dateDisplay}</p>
            <p><strong>সেশন:</strong> ${sessionDisplay}</p>
            <p><strong>সময়সূচি (স্লট):</strong> ${slotDisplay}</p>
            <p><strong>ক্যাটেগরি:</strong> ${categoryDisplay}</p>
            <p><strong>মোট মূল্য:</strong> <strong style="color: var(--color-primary);">${priceDisplay}</strong></p>
            <p><strong>বর্তমান অবস্থা:</strong> ${statusBadge}</p>
            <p><strong>আবেদনের সময়:</strong> <small>${createdAtDisplay}</small></p>
          </div>
        </div>

        <div class="card" style="background: var(--color-surface); padding: 1rem;">
          <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-comment-dots"></i> অতিরিক্ত বার্তা / নির্দেশনা</h4>
          <p class="card-text">${notesDisplay}</p>
        </div>
      `;

      // Update action buttons in modal footer
      if (this.bookingDetailFooter) {
        let footerHtml = `
          <button type="button" class="btn btn-secondary" onclick="AdminApp.closeBookingDetailModal()">বন্ধ করুন</button>
        `;

        if (st === 'pending') {
          footerHtml += `
            <button type="button" class="btn btn-danger" onclick="AdminApp.rejectBooking('${b.id}')"><i class="fas fa-xmark"></i> প্রত্যাখ্যান</button>
            <button type="button" class="btn btn-primary btn-lg" onclick="AdminApp.approveBooking('${b.id}')" style="box-shadow: 0 0 15px rgba(16,185,129,0.5); font-weight: 700;"><i class="fas fa-circle-check"></i> বুকিং কনফার্ম করুন (অনুমোদন)</button>
          `;
        } else if (st === 'confirmed') {
          footerHtml += `
            <button type="button" class="btn btn-danger" onclick="AdminApp.cancelBooking('${b.id}')"><i class="fas fa-ban"></i> বুকিং বাতিল করুন</button>
          `;
        }

        this.bookingDetailFooter.innerHTML = footerHtml;
      }

      this.openBookingDetailModal();
    },

    openBookingDetailModal() {
      if (this.bookingDetailOverlay) this.bookingDetailOverlay.classList.remove('hidden');
    },

    closeBookingDetailModal() {
      if (this.bookingDetailOverlay) this.bookingDetailOverlay.classList.add('hidden');
    },

    // =======================================================================
    // 7. Permanent Bookings Management
    // =======================================================================
    loadPermanentBookings() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const permRef = db.ref('permanentBookings');
      this.listeners.push({ ref: permRef, event: 'value' });

      permRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.permanentBookings = [];

        if (data) {
          Object.keys(data).forEach(function (key) {
            const item = data[key];
            if (typeof item === 'object' && item !== null) {
              item.id = item.id || key;
              self.permanentBookings.push(item);
            }
          });
        }

        self.loadDashboardStats();
        self.filterPermanentBookings();
      }, function (err) {
        console.error('[Admin] Error loading permanent bookings:', err);
      });
    },

    filterPermanentBookings() {
      const searchInput = document.getElementById('permanentSearchInput');
      const statusFilter = document.getElementById('permanentStatusFilter');

      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const filterStatus = statusFilter ? statusFilter.value : '';

      const filtered = this.permanentBookings.filter(function (pb) {
        if (query) {
          const name = (pb.name || pb.customerName || '').toLowerCase();
          const phone = (pb.phone || '').toLowerCase();
          if (!name.includes(query) && !phone.includes(query)) return false;
        }

        if (filterStatus && (pb.status || 'pending').toLowerCase() !== filterStatus) {
          return false;
        }

        return true;
      });

      this.renderPermanentBookings(filtered);
    },

    renderPermanentBookings(list) {
      const tbody = document.getElementById('permanentTableBody');
      if (!tbody) return;

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">কোন স্থায়ী বুকিং রেকর্ড নেই</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      list.forEach(function (pb) {
        const idDisplay = pb.id ? (pb.id.length > 12 ? pb.id.substring(0, 10) + '...' : pb.id) : '-';
        const nameDisplay = self.escapeHtml(pb.customerName || pb.name || 'গ্রাহক');
        const rawPhone = pb.customerPhone || pb.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const weekdayName = self.getWeekdayName(pb.weekday !== undefined ? pb.weekday : pb.dayOfWeek);
        const sessionDisplay = pb.session === 'night' ? 'নাইট (Night)' : 'ডে (Day)';
        const slotDisplay = self.escapeHtml(pb.slotTime || pb.slot || pb.time || '-');
        const feeDisplay = self.formatPrice(pb.monthlyFee || pb.price || 0);
        const st = (pb.status || 'pending').toLowerCase();
        const statusBadge = self.getStatusBadge(pb.status);

        html += `
          <tr>
            <td><code>${idDisplay}</code></td>
            <td><strong>${nameDisplay}</strong></td>
            <td>${rawPhone ? `<a href="tel:${rawPhone}" style="color: inherit; text-decoration: none;">${phoneDisplay}</a>` : '-'}</td>
            <td><span class="badge badge-available">${weekdayName}</span></td>
            <td>${sessionDisplay}</td>
            <td>${slotDisplay}</td>
            <td>${feeDisplay}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="action-buttons">
                ${(st === 'pending') ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="AdminApp.approvePermanent('${pb.id}')" title="অনুমোদন ও সক্রিয় করুন">
                    <i class="fas fa-circle-check"></i> <span>সক্রিয় করুন</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.rejectPermanent('${pb.id}')" title="প্রত্যাখ্যান করুন">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                ${(st === 'active') ? `
                  <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.pausePermanent('${pb.id}')" title="স্থগিত করুন">
                    <i class="fas fa-pause"></i> স্থগিত
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')" title="সমাপ্ত করুন">
                    <i class="fas fa-stop"></i> সমাপ্ত
                  </button>
                ` : ''}
                ${(st === 'paused') ? `
                  <button type="button" class="btn btn-sm btn-primary" onclick="AdminApp.approvePermanent('${pb.id}')" title="পুনরায় চালু করুন">
                    <i class="fas fa-play"></i> সক্রিয়
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')" title="সমাপ্ত করুন">
                    <i class="fas fa-stop"></i> সমাপ্ত
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    },

    approvePermanent(id) {
      const self = this;
      this.showConfirm(
        'স্থায়ী বুকিং সক্রিয়করণ',
        'আপনি কি এই গ্রাহকের স্থায়ী বুকিং অনুমোদন ও সক্রিয় করতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'active',
            activatedAt: Date.now()
          }).then(function () {
            self.toast('স্থায়ী বুকিং সক্রিয় করা হয়েছে!', 'success');
          }).catch(function (err) {
            console.error('[Admin] Error activating permanent booking:', err);
            self.toast('সক্রিয়করণে সমস্যা হয়েছে', 'error');
          });
        }
      );
    },

    rejectPermanent(id) {
      const self = this;
      this.showConfirm(
        'স্থায়ী বুকিং প্রত্যাখ্যান',
        'আপনি কি নিশ্চিত যে এই স্থায়ী বুকিং আবেদন প্রত্যাখ্যান করতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'rejected',
            rejectedAt: Date.now()
          }).then(function () {
            self.toast('স্থায়ী বুকিং আবেদন প্রত্যাখ্যাত হয়েছে', 'warning');
          });
        }
      );
    },

    pausePermanent(id) {
      const self = this;
      this.showConfirm(
        'স্থায়ী বুকিং স্থগিতকরণ',
        'গ্রাহকের অনুরোধে এই স্থায়ী বুকিং সাময়িক স্থগিত (Pause) করতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'paused',
            pausedAt: Date.now()
          }).then(function () {
            self.toast('স্থায়ী বুকিং স্থগিত করা হয়েছে', 'info');
          });
        }
      );
    },

    terminatePermanent(id) {
      const self = this;
      this.showConfirm(
        'স্থায়ী বুকিং সমাপ্তি',
        'সতর্কতা: এই স্থায়ী স্লটটি স্থায়ীভাবে বাতিল ও বন্ধ হবে। আপনি কি নিশ্চিত?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'terminated',
            terminatedAt: Date.now()
          }).then(function () {
            self.toast('স্থায়ী বুকিং সমাপ্ত করা হয়েছে', 'info');
          });
        }
      );
    },

    // =======================================================================
    // 8. Slot Management & Block Dates
    // =======================================================================
    setSlotSession(session) {
      this.currentSlotSession = session;
      const dayBtn = document.getElementById('slotSessionDayBtn');
      const nightBtn = document.getElementById('slotSessionNightBtn');

      if (session === 'day') {
        if (dayBtn) dayBtn.classList.add('active');
        if (nightBtn) nightBtn.classList.remove('active');
      } else {
        if (nightBtn) nightBtn.classList.add('active');
        if (dayBtn) dayBtn.classList.remove('active');
      }

      this.renderSlots(session);
    },

    loadSlots() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const slotsRef = db.ref('slots');
      this.listeners.push({ ref: slotsRef, event: 'value' });

      slotsRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.slots = { day: [], night: [] };

        if (data) {
          if (data.day) {
            Object.keys(data.day).forEach(function (key) {
              const item = data.day[key];
              item.id = key;
              self.slots.day.push(item);
            });
          }
          if (data.night) {
            Object.keys(data.night).forEach(function (key) {
              const item = data.night[key];
              item.id = key;
              self.slots.night.push(item);
            });
          }
        } else {
          // Setup default slots if unconfigured
          self.seedDefaultSlots();
        }

        self.renderSlots(self.currentSlotSession);
      });
    },

    seedDefaultSlots() {
      const defaultDay = [
        { startTime: '08:00', endTime: '09:00', label: 'সকাল ৮:০০ - ৯:০০' },
        { startTime: '09:00', endTime: '10:00', label: 'সকাল ৯:০০ - ১০:০০' },
        { startTime: '10:00', endTime: '11:00', label: 'সকাল ১০:০০ - ১১:০০' },
        { startTime: '11:00', endTime: '12:00', label: 'সকাল ১১:০০ - দুপুর ১২:০০' },
        { startTime: '12:00', endTime: '13:00', label: 'দুপুর ১২:০০ - ১:০০' },
        { startTime: '13:00', endTime: '14:00', label: 'দুপুর ১:০০ - ২:০০' },
        { startTime: '14:00', endTime: '15:00', label: 'দুপুর ২:০০ - ৩:০০' },
        { startTime: '15:00', endTime: '16:00', label: 'বিকাল ৩:০০ - ৪:০০' },
        { startTime: '16:00', endTime: '17:00', label: 'বিকাল ৪:০০ - ৫:০০' }
      ];

      const defaultNight = [
        { startTime: '17:00', endTime: '18:00', label: 'বিকাল ৫:০০ - সন্ধ্যা ৬:০০' },
        { startTime: '18:00', endTime: '19:00', label: 'সন্ধ্যা ৬:০০ - ৭:০০' },
        { startTime: '19:00', endTime: '20:00', label: 'সন্ধ্যা ৭:০০ - রাত ৮:০০' },
        { startTime: '20:00', endTime: '21:00', label: 'রাত ৮:০০ - ৯:০০' },
        { startTime: '21:00', endTime: '22:00', label: 'রাত ৯:০০ - ১০:০০' },
        { startTime: '22:00', endTime: '23:00', label: 'রাত ১০:০০ - ১১:০০' },
        { startTime: '23:00', endTime: '24:00', label: 'রাত ১১:০০ - ১২:০০' }
      ];

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      defaultDay.forEach(slot => db.ref('slots/day').push(slot));
      defaultNight.forEach(slot => db.ref('slots/night').push(slot));
    },

    renderSlots(session) {
      const container = document.getElementById('slotsListContainer');
      if (!container) return;

      const list = this.slots[session] || [];
      if (list.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-4">এই সেশনের জন্য কোন স্লট তৈরি করা হয়নি</p>';
        return;
      }

      // Sort chronologically by startTime
      list.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

      let html = '<div class="slots-list-grid">';
      const self = this;

      list.forEach(function (slot) {
        const timeFormatted = self.formatTimeRange(slot.startTime, slot.endTime);
        html += `
          <div class="slot-item-admin card" style="background: var(--color-surface); padding: 0.75rem 1rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong><i class="fas fa-clock text-primary"></i> ${timeFormatted}</strong>
              ${slot.label ? `<br><small class="text-muted">${self.escapeHtml(slot.label)}</small>` : ''}
            </div>
            <div class="action-buttons">
              <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.editSlotModal('${session}', '${slot.id}')" title="সম্পাদনা">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteSlot('${session}', '${slot.id}')" title="মুছে ফেলুন">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    addSlot(session, startTime, endTime) {
      const self = this;
      if (!startTime || !endTime) {
        this.toast('অনুগ্রহ করে শুরুর এবং শেষের সময় নির্বাচন করুন', 'warning');
        return;
      }

      if (startTime >= endTime && endTime !== '00:00' && endTime !== '24:00') {
        this.toast('শুরুর সময় অবশ্যই শেষের সময়ের পূর্বে হতে হবে', 'warning');
        return;
      }

      const label = this.formatTimeRange(startTime, endTime);
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      db.ref(`slots/${session}`).push({
        startTime: startTime,
        endTime: endTime,
        label: label,
        createdAt: Date.now()
      }).then(function () {
        self.toast('নতুন স্লট সফলভাবে যোগ করা হয়েছে', 'success');
        const form = document.getElementById('addSlotForm');
        if (form) form.reset();
      }).catch(function (err) {
        console.error('[Admin] Error adding slot:', err);
        self.toast('স্লট যোগ করতে সমস্যা হয়েছে', 'error');
      });
    },

    editSlotModal(session, slotId) {
      const slot = (this.slots[session] || []).find(s => s.id === slotId);
      if (!slot) return;

      const self = this;
      this.openEditModal(
        'স্লট সময় সম্পাদনা',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotStartTime">শুরুর সময়</label>
            <input type="time" id="editSlotStartTime" class="form-input" value="${slot.startTime || ''}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotEndTime">শেষ সময়</label>
            <input type="time" id="editSlotEndTime" class="form-input" value="${slot.endTime || ''}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotLabel">লেবেল (ঐচ্ছিক)</label>
            <input type="text" id="editSlotLabel" class="form-input" value="${self.escapeHtml(slot.label || '')}">
          </div>
        `,
        function () {
          const st = document.getElementById('editSlotStartTime').value;
          const et = document.getElementById('editSlotEndTime').value;
          const lb = document.getElementById('editSlotLabel').value.trim();

          if (!st || !et) {
            self.toast('সময় ফিল্ড পূরণ করুন', 'warning');
            return;
          }

          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`slots/${session}/${slotId}`).update({
            startTime: st,
            endTime: et,
            label: lb || self.formatTimeRange(st, et),
            updatedAt: Date.now()
          }).then(function () {
            self.toast('স্লট আপডেট হয়েছে', 'success');
            self.closeEditModal();
          });
        }
      );
    },

    deleteSlot(session, slotId) {
      const self = this;
      this.showConfirm(
        'স্লট মুছে ফেলা',
        'আপনি কি নিশ্চিত যে এই স্লটটি স্থায়ীভাবে মুছে ফেলতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`slots/${session}/${slotId}`).remove().then(function () {
            self.toast('স্লট মুছে ফেলা হয়েছে', 'info');
          });
        }
      );
    },

    loadBlockedDates() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const blockedRef = db.ref('blockedDates');
      this.listeners.push({ ref: blockedRef, event: 'value' });

      blockedRef.on('value', function (snapshot) {
        self.blockedDates = snapshot.val() || {};
        self.renderBlockedDates();
      });
    },

    renderBlockedDates() {
      const container = document.getElementById('blockedDatesContainer');
      if (!container) return;

      const keys = Object.keys(this.blockedDates);
      if (keys.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-2">কোন তারিখ বন্ধ ঘোষণা করা নেই</p>';
        return;
      }

      let html = '<div class="blocked-dates-chips" style="display: flex; flex-direction: column; gap: 0.5rem;">';
      const self = this;

      keys.forEach(function (k) {
        const item = self.blockedDates[k];
        const dateStr = typeof item === 'object' && item.date ? item.date : k;
        const reason = typeof item === 'object' && item.reason ? item.reason : 'টার্ফ বন্ধ';

        html += `
          <div class="card" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); padding: 0.6rem 0.9rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--color-danger);"><i class="fas fa-calendar-xmark"></i> ${self.formatDate(dateStr)}</strong>
              <small class="text-muted ml-2">(${self.escapeHtml(reason)})</small>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.unblockDate('${k}')" title="বন্ধ বাতিল করুন">
              <i class="fas fa-lock-open"></i> খুলুন
            </button>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    blockDate(date, reason) {
      const self = this;
      if (!date) {
        this.toast('তারিখ নির্বাচন করুন', 'warning');
        return;
      }

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      // Clean key for RTDB
      const safeKey = date.replace(/[^\w-]/g, '_');

      db.ref(`blockedDates/${safeKey}`).set({
        date: date,
        reason: reason || 'টার্ফ বন্ধ',
        blockedAt: Date.now()
      }).then(function () {
        self.toast(`${self.formatDate(date)} তারিখের বুকিং বন্ধ করা হয়েছে`, 'success');
        const form = document.getElementById('blockDateForm');
        if (form) form.reset();
      });
    },

    unblockDate(dateKey) {
      const self = this;
      this.showConfirm(
        'দিন উন্মুক্তকরণ',
        'আপনি কি এই তারিখের বুকিং পুনরায় উন্মুক্ত করতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`blockedDates/${dateKey}`).remove().then(function () {
            self.toast('তারিখ উন্মুক্ত করা হয়েছে', 'info');
          });
        }
      );
    },

    loadWorkingDays() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      db.ref('workingDays').once('value').then(function (snapshot) {
        const val = snapshot.val();
        if (Array.isArray(val)) {
          self.workingDays = val;
          const checkboxes = document.querySelectorAll('input[name="workingDay"]');
          checkboxes.forEach(function (cb) {
            cb.checked = self.workingDays.includes(Number(cb.value));
          });
        }
      });
    },

    saveWorkingDays() {
      const checkboxes = document.querySelectorAll('input[name="workingDay"]:checked');
      const selected = [];
      checkboxes.forEach(cb => selected.push(Number(cb.value)));

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const self = this;
      db.ref('workingDays').set(selected).then(function () {
        self.workingDays = selected;
        self.toast('কার্যদিবস সেটিংস সংরক্ষিত হয়েছে', 'success');
      }).catch(function (err) {
        console.error('[Admin] Error saving working days:', err);
        self.toast('সংরক্ষণে সমস্যা হয়েছে', 'error');
      });
    },

    // =======================================================================
    // 9. Pricing Configuration
    // =======================================================================
    loadPricing() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const priceRef = db.ref('pricing');
      this.listeners.push({ ref: priceRef, event: 'value' });

      priceRef.on('value', function (snapshot) {
        const val = snapshot.val();
        self.pricing = val || {
          normalDay: 550,
          normalNight: 900,
          permanentDay: 500,
          permanentNight: 850,
          dayOriginal: 600
        };
        self.renderPricingInputs();
      });
    },

    renderPricingInputs() {
      const p = this.pricing;
      const fNormalDay = document.getElementById('priceNormalDay');
      const fDayOriginal = document.getElementById('priceDayOriginal');
      const fNormalNight = document.getElementById('priceNormalNight');
      const fPermanentDay = document.getElementById('pricePermanentDay');
      const fPermanentNight = document.getElementById('pricePermanentNight');

      if (fNormalDay && p.normalDay !== undefined) fNormalDay.value = p.normalDay;
      if (fDayOriginal && p.dayOriginal !== undefined) fDayOriginal.value = p.dayOriginal;
      if (fNormalNight && p.normalNight !== undefined) fNormalNight.value = p.normalNight;
      if (fPermanentDay && p.permanentDay !== undefined) fPermanentDay.value = p.permanentDay;
      if (fPermanentNight && p.permanentNight !== undefined) fPermanentNight.value = p.permanentNight;
    },

    savePricing() {
      const fNormalDay = document.getElementById('priceNormalDay');
      const fDayOriginal = document.getElementById('priceDayOriginal');
      const fNormalNight = document.getElementById('priceNormalNight');
      const fPermanentDay = document.getElementById('pricePermanentDay');
      const fPermanentNight = document.getElementById('pricePermanentNight');

      const data = {
        normalDay: Number(fNormalDay.value) || 550,
        dayOriginal: Number(fDayOriginal.value) || 600,
        normalNight: Number(fNormalNight.value) || 900,
        permanentDay: Number(fPermanentDay.value) || 500,
        permanentNight: Number(fPermanentNight.value) || 850,
        updatedAt: Date.now()
      };

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const self = this;
      const saveBtn = document.getElementById('savePricingBtn');
      self.setButtonLoading(saveBtn, true, 'সংরক্ষণ হচ্ছে...');

      db.ref('pricing').set(data).then(function () {
        self.setButtonLoading(saveBtn, false, 'মূল্য সেটিংস সংরক্ষণ করুন');
        self.pricing = data;
        self.toast('মূল্য সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(saveBtn, false, 'মূল্য সেটিংস সংরক্ষণ করুন');
        console.error('[Admin] Error saving pricing:', err);
        self.toast('মূল্য সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
      });
    },

    // =======================================================================
    // 10. Gallery Management
    // =======================================================================
    setupGalleryUploadHandlers() {
      const self = this;
      const dropZone = document.getElementById('galleryUploadZone');
      const fileInput = document.getElementById('galleryFileInput');
      const fileDisplay = document.getElementById('fileSelectedDisplay');
      const uploadForm = document.getElementById('galleryUploadForm');

      if (dropZone && fileInput) {
        dropZone.addEventListener('click', function () {
          fileInput.click();
        });

        dropZone.addEventListener('dragover', function (e) {
          e.preventDefault();
          dropZone.classList.add('drag-active');
        });

        dropZone.addEventListener('dragleave', function () {
          dropZone.classList.remove('drag-active');
        });

        dropZone.addEventListener('drop', function (e) {
          e.preventDefault();
          dropZone.classList.remove('drag-active');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            self.selectedFileToUpload = e.dataTransfer.files[0];
            self.showSelectedFileName(self.selectedFileToUpload.name);
          }
        });

        fileInput.addEventListener('change', function () {
          if (fileInput.files && fileInput.files[0]) {
            self.selectedFileToUpload = fileInput.files[0];
            self.showSelectedFileName(self.selectedFileToUpload.name);
          }
        });
      }

      if (uploadForm) {
        uploadForm.addEventListener('submit', function (e) {
          e.preventDefault();
          const title = document.getElementById('galleryTitleInput').value.trim();
          const desc = document.getElementById('galleryDescInput').value.trim();
          const type = document.getElementById('galleryTypeSelect').value;
          const directUrl = document.getElementById('galleryUrlFallback').value.trim();

          self.uploadMedia(self.selectedFileToUpload, title, desc, type, directUrl);
        });
      }
    },

    showSelectedFileName(fileName) {
      const fileDisplay = document.getElementById('fileSelectedDisplay');
      if (fileDisplay) {
        fileDisplay.textContent = `নির্বাচিত ফাইল: ${fileName}`;
        fileDisplay.classList.remove('hidden');
      }
    },

    loadGalleryAdmin() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const galleryRef = db.ref('gallery');
      this.listeners.push({ ref: galleryRef, event: 'value' });

      galleryRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.gallery = [];

        if (data) {
          Object.keys(data).forEach(function (key) {
            const item = data[key];
            item.id = key;
            self.gallery.push(item);
          });
        }

        // Sort by order asc
        self.gallery.sort((a, b) => (a.order || 0) - (b.order || 0));
        self.renderGalleryGrid();
      });
    },

    renderGalleryGrid() {
      const grid = document.getElementById('adminGalleryGrid');
      if (!grid) return;

      if (this.gallery.length === 0) {
        grid.innerHTML = '<p class="form-hint text-center py-4">গ্যালারিতে এখনও কোন ছবি বা ভিডিও যুক্ত করা হয়নি</p>';
        return;
      }

      let html = '<div class="admin-media-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">';
      const self = this;

      this.gallery.forEach(function (item, index) {
        const title = self.escapeHtml(item.title || 'শিরোনামহীন');
        const desc = self.escapeHtml(item.description || '');
        const isVideo = item.type === 'video';
        const mediaPreview = isVideo
          ? `<div style="height: 140px; background: #000; display:flex; align-items:center; justify-content:center; border-radius: var(--radius-sm);"><i class="fas fa-video fa-2x text-primary"></i></div>`
          : `<img src="${item.url || 'assets/images/placeholder.jpg'}" alt="${title}" style="width: 100%; height: 140px; object-fit: cover; border-radius: var(--radius-sm);">`;

        html += `
          <div class="card card-premium media-item-card" style="padding: 0.75rem;">
            ${mediaPreview}
            <div class="mt-2">
              <strong style="font-size: 0.95rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</strong>
              <small class="text-muted">${isVideo ? 'ভিডিও' : 'ছবি'} • ক্রম: ${self.bengaliNum(index + 1)}</small>
            </div>
            <div class="action-buttons mt-3 d-flex justify-between">
              <div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveMediaOrder('${item.id}', -1)" ${index === 0 ? 'disabled' : ''} title="উপরে নিন">
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveMediaOrder('${item.id}', 1)" ${index === self.gallery.length - 1 ? 'disabled' : ''} title="নিচে নিন">
                  <i class="fas fa-arrow-down"></i>
                </button>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.editMediaModal('${item.id}')" title="সম্পাদনা">
                  <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteMedia('${item.id}', '${item.storagePath || ''}')" title="মুছে ফেলুন">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += '</div>';
      grid.innerHTML = html;
    },

    uploadMedia(file, title, desc, type, directUrl) {
      const self = this;
      const uploadBtn = document.getElementById('galleryUploadBtn');

      if (!file && !directUrl) {
        this.toast('একটি ফাইল নির্বাচন করুন অথবা সরাসরি লিঙ্ক প্রদান করুন', 'warning');
        return;
      }

      self.setButtonLoading(uploadBtn, true, 'আপলোড হচ্ছে...');

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      const storage = window.storage || (typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null);

      if (file && storage) {
        const storagePath = `gallery/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
        const storageRef = storage.ref(storagePath);

        storageRef.put(file).then(function (snapshot) {
          return snapshot.ref.getDownloadURL();
        }).then(function (downloadUrl) {
          self.saveMediaToDatabase(downloadUrl, title, desc, type, storagePath);
        }).catch(function (error) {
          console.error('[Admin] Storage upload error:', error);
          // If storage bucket isn't configured, fallback gracefully if directUrl is present
          if (directUrl) {
            self.saveMediaToDatabase(directUrl, title, desc, type, '');
          } else {
            self.setButtonLoading(uploadBtn, false, 'গ্যালারিতে যোগ করুন');
            self.toast('ফাইল আপলোড ব্যর্থ হয়েছে। সরাসরি ইমেজ লিঙ্ক প্রদান করুন।', 'error');
          }
        });
      } else if (directUrl) {
        self.saveMediaToDatabase(directUrl, title, desc, type, '');
      } else {
        self.setButtonLoading(uploadBtn, false, 'গ্যালারিতে যোগ করুন');
        self.toast('ডাটাবেজ বা স্টোরেজ অনুপলব্ধ', 'error');
      }
    },

    saveMediaToDatabase(url, title, desc, type, storagePath) {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      const uploadBtn = document.getElementById('galleryUploadBtn');

      if (!db) {
        self.setButtonLoading(uploadBtn, false, 'গ্যালারিতে যোগ করুন');
        return;
      }

      const newRef = db.ref('gallery').push();
      const mediaItem = {
        id: newRef.key,
        url: url,
        title: title,
        description: desc || '',
        type: type || 'image',
        storagePath: storagePath || '',
        order: this.gallery.length + 1,
        createdAt: Date.now()
      };

      newRef.set(mediaItem).then(function () {
        self.setButtonLoading(uploadBtn, false, 'গ্যালারিতে যোগ করুন');
        self.selectedFileToUpload = null;
        const form = document.getElementById('galleryUploadForm');
        if (form) form.reset();
        const fileDisplay = document.getElementById('fileSelectedDisplay');
        if (fileDisplay) fileDisplay.classList.add('hidden');
        self.toast('গ্যালারি আইটেম সফলভাবে যোগ হয়েছে!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(uploadBtn, false, 'গ্যালারিতে যোগ করুন');
        console.error('[Admin] Error saving media record:', err);
        self.toast('রেকর্ড সংরক্ষণে ত্রুটি হয়েছে', 'error');
      });
    },

    deleteMedia(id, storagePath) {
      const self = this;
      this.showConfirm(
        'মিডিয়া মুছে ফেলা',
        'আপনি কি নিশ্চিত যে এই ছবিটি বা ভিডিওটি গ্যালারি থেকে স্থায়ীভাবে মুছে ফেলতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          const storage = window.storage || (typeof firebase !== 'undefined' && firebase.storage ? firebase.storage() : null);

          if (db) {
            db.ref(`gallery/${id}`).remove().then(function () {
              self.toast('মিডিয়া মুছে ফেলা হয়েছে', 'info');
            });
          }

          if (storage && storagePath) {
            storage.ref(storagePath).delete().catch(function (e) {
              console.warn('[Admin] Could not delete from storage:', e);
            });
          }
        }
      );
    },

    editMediaModal(id) {
      const item = this.gallery.find(m => m.id === id);
      if (!item) return;

      const self = this;
      this.openEditModal(
        'মিডিয়া তথ্য সম্পাদনা',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editMediaTitle">শিরোনাম</label>
            <input type="text" id="editMediaTitle" class="form-input" value="${self.escapeHtml(item.title || '')}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editMediaDesc">বিবরণ</label>
            <textarea id="editMediaDesc" class="form-textarea" rows="3">${self.escapeHtml(item.description || '')}</textarea>
          </div>
        `,
        function () {
          const newTitle = document.getElementById('editMediaTitle').value.trim();
          const newDesc = document.getElementById('editMediaDesc').value.trim();

          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`gallery/${id}`).update({
            title: newTitle,
            description: newDesc,
            updatedAt: Date.now()
          }).then(function () {
            self.toast('মিডিয়া আপডেট করা হয়েছে', 'success');
            self.closeEditModal();
          });
        }
      );
    },

    moveMediaOrder(id, direction) {
      const index = this.gallery.findIndex(m => m.id === id);
      if (index === -1) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= this.gallery.length) return;

      // Swap orders
      const current = this.gallery[index];
      const target = this.gallery[targetIndex];

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const updates = {};
      updates[`gallery/${current.id}/order`] = targetIndex + 1;
      updates[`gallery/${target.id}/order`] = index + 1;

      db.ref().update(updates);
    },

    // =======================================================================
    // 11. Rules Management
    // =======================================================================
    loadRulesAdmin() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const rulesRef = db.ref('rules');
      this.listeners.push({ ref: rulesRef, event: 'value' });

      rulesRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.rules = [];

        if (data) {
          Object.keys(data).forEach(function (key) {
            const item = data[key];
            item.id = key;
            self.rules.push(item);
          });
        } else {
          self.seedDefaultRules();
        }

        self.rules.sort((a, b) => (a.order || 0) - (b.order || 0));
        self.renderRulesList();
      });
    },

    seedDefaultRules() {
      const defaultRules = [
        {
          icon: 'fas fa-shoe-prints',
          title: 'সঠিক জুতো পরিধান আবশ্যক',
          description: 'টার্ফের ভেতর শুধুমাত্র টার্ফ বুট অথবা রাবার সোলের স্নিকার্স পরা যাবে। স্পাইক বা মেটাল বুট সম্পূর্ণ নিষিদ্ধ।',
          order: 1
        },
        {
          icon: 'fas fa-clock',
          title: 'সময়ানুবর্তিতা বজায় রাখুন',
          description: 'নির্ধারিত স্লটের অন্তত ১০ মিনিট পূর্বে মাঠে উপস্থিত থাকতে হবে। অতিরিক্ত খেলা হলে বাড়তি সময়ের বিল দিতে হবে।',
          order: 2
        },
        {
          icon: 'fas fa-ban-smoking',
          title: 'ধূমপান ও খাবার গ্রহণ নিষিদ্ধ',
          description: 'টার্ফ এরিয়ায় কোনো প্রকার ধূমপান, পান-সুপারি বা অপচনশীল বর্জ্য ফেলা সম্পূর্ণভাবে নিষিদ্ধ।',
          order: 3
        },
        {
          icon: 'fas fa-handshake-angle',
          title: 'সুশৃঙ্খল ও সম্মানজনক আচরণ',
          description: 'মাঠে ও ড্রেসিংরুমে যেকোনো ধরণের মারামারি, অশালীন আচরণ বা গালাগালি সম্পূর্ণভাবে নিষিদ্ধ।',
          order: 4
        }
      ];

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      defaultRules.forEach(r => db.ref('rules').push(r));
    },

    renderRulesList() {
      const container = document.getElementById('adminRulesList');
      if (!container) return;

      if (this.rules.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-4">কোন নিয়ম যুক্ত করা হয়নি</p>';
        return;
      }

      let html = '<div class="rules-stack" style="display: flex; flex-direction: column; gap: 0.75rem;">';
      const self = this;

      this.rules.forEach(function (rule, index) {
        const title = self.escapeHtml(rule.title || '');
        const desc = self.escapeHtml(rule.description || '');
        const icon = rule.icon || 'fas fa-futbol';

        html += `
          <div class="card card-premium rule-item-card" style="padding: 0.9rem;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between;">
              <div style="display: flex; gap: 0.75rem; align-items: center;">
                <div class="card-icon" style="width: 38px; height: 38px; font-size: 1rem; flex-shrink: 0;">
                  <i class="${icon}"></i>
                </div>
                <div>
                  <h4 style="margin: 0; font-size: 1rem; color: var(--color-text-primary);">${self.bengaliNum(index + 1)}. ${title}</h4>
                  <p class="card-text mt-1" style="font-size: 0.9rem; margin-bottom: 0;">${desc}</p>
                </div>
              </div>
              <div class="action-buttons ml-2">
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveRuleOrder('${rule.id}', -1)" ${index === 0 ? 'disabled' : ''} title="উপরে নিন">
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveRuleOrder('${rule.id}', 1)" ${index === self.rules.length - 1 ? 'disabled' : ''} title="নিচে নিন">
                  <i class="fas fa-arrow-down"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.editRuleModal('${rule.id}')" title="সম্পাদনা">
                  <i class="fas fa-edit"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteRule('${rule.id}')" title="মুছে ফেলুন">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    addRule(icon, title, desc) {
      const self = this;
      if (!title || !desc) {
        this.toast('শিরোনাম ও বিবরণ আবশ্যক', 'warning');
        return;
      }

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const newRule = {
        icon: icon || 'fas fa-futbol',
        title: title,
        description: desc,
        order: this.rules.length + 1,
        createdAt: Date.now()
      };

      db.ref('rules').push(newRule).then(function () {
        self.toast('নতুন নিয়ম সফলভাবে যোগ হয়েছে', 'success');
        const form = document.getElementById('addRuleForm');
        if (form) form.reset();
        const iconInput = document.getElementById('ruleIconInput');
        if (iconInput) iconInput.value = 'fas fa-futbol';
      }).catch(function (err) {
        console.error('[Admin] Error adding rule:', err);
        self.toast('নিয়ম সংরক্ষণে সমস্যা হয়েছে', 'error');
      });
    },

    editRuleModal(id) {
      const rule = this.rules.find(r => r.id === id);
      if (!rule) return;

      const self = this;
      this.openEditModal(
        'নিয়মাবলী সম্পাদনা',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleIcon">FontAwesome আইকন ক্লাস</label>
            <input type="text" id="editRuleIcon" class="form-input" value="${self.escapeHtml(rule.icon || 'fas fa-futbol')}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleTitle">নিয়মের শিরোনাম</label>
            <input type="text" id="editRuleTitle" class="form-input" value="${self.escapeHtml(rule.title || '')}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleDesc">বিস্তারিত বিবরণ</label>
            <textarea id="editRuleDesc" class="form-textarea" rows="3" required>${self.escapeHtml(rule.description || '')}</textarea>
          </div>
        `,
        function () {
          const icon = document.getElementById('editRuleIcon').value.trim();
          const title = document.getElementById('editRuleTitle').value.trim();
          const desc = document.getElementById('editRuleDesc').value.trim();

          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`rules/${id}`).update({
            icon: icon,
            title: title,
            description: desc,
            updatedAt: Date.now()
          }).then(function () {
            self.toast('নিয়মাবলী আপডেট হয়েছে', 'success');
            self.closeEditModal();
          });
        }
      );
    },

    deleteRule(id) {
      const self = this;
      this.showConfirm(
        'নিয়ম মুছে ফেলা',
        'আপনি কি নিশ্চিত যে এই নিয়মটি মুছে ফেলতে চান?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`rules/${id}`).remove().then(function () {
            self.toast('নিয়ম মুছে ফেলা হয়েছে', 'info');
          });
        }
      );
    },

    moveRuleOrder(id, direction) {
      const index = this.rules.findIndex(r => r.id === id);
      if (index === -1) return;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= this.rules.length) return;

      const current = this.rules[index];
      const target = this.rules[targetIndex];

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const updates = {};
      updates[`rules/${current.id}/order`] = targetIndex + 1;
      updates[`rules/${target.id}/order`] = index + 1;

      db.ref().update(updates);
    },

    // =======================================================================
    // 12. Settings Management
    // =======================================================================
    loadSettings() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const settingsRef = db.ref('settings');
      this.listeners.push({ ref: settingsRef, event: 'value' });

      settingsRef.on('value', function (snapshot) {
        self.settings = snapshot.val() || {};
        self.renderSettingsInputs();
      });
    },

    renderSettingsInputs() {
      const s = this.settings;
      const fPhone = document.getElementById('settingsPhone');
      const fWhatsapp = document.getElementById('settingsWhatsapp');
      const fAddress = document.getElementById('settingsAddress');
      const fHours = document.getElementById('settingsHours');
      const fMapLink = document.getElementById('settingsMapLink');
      const fHeroTitle = document.getElementById('settingsHeroTitle');
      const fHeroSubtitle = document.getElementById('settingsHeroSubtitle');
      const fAnnouncement = document.getElementById('settingsAnnouncement');
      const fFacebook = document.getElementById('settingsSocialFacebook');
      const fInstagram = document.getElementById('settingsSocialInstagram');

      if (fPhone && s.phone) fPhone.value = s.phone;
      if (fWhatsapp && s.whatsapp) fWhatsapp.value = s.whatsapp;
      if (fAddress && s.address) fAddress.value = s.address;
      if (fHours && s.hours) fHours.value = s.hours;
      if (fMapLink && s.mapLink) fMapLink.value = s.mapLink;
      if (fHeroTitle && s.heroTitle) fHeroTitle.value = s.heroTitle;
      if (fHeroSubtitle && s.heroSubtitle) fHeroSubtitle.value = s.heroSubtitle;
      if (fAnnouncement && s.announcement) fAnnouncement.value = s.announcement;
      if (fFacebook && s.socialFacebook) fFacebook.value = s.socialFacebook;
      if (fInstagram && s.socialInstagram) fInstagram.value = s.socialInstagram;
    },

    saveSettings() {
      const data = {
        phone: document.getElementById('settingsPhone').value.trim(),
        whatsapp: document.getElementById('settingsWhatsapp').value.trim(),
        address: document.getElementById('settingsAddress').value.trim(),
        hours: document.getElementById('settingsHours').value.trim(),
        mapLink: document.getElementById('settingsMapLink').value.trim(),
        heroTitle: document.getElementById('settingsHeroTitle').value.trim(),
        heroSubtitle: document.getElementById('settingsHeroSubtitle').value.trim(),
        announcement: document.getElementById('settingsAnnouncement').value.trim(),
        socialFacebook: document.getElementById('settingsSocialFacebook').value.trim(),
        socialInstagram: document.getElementById('settingsSocialInstagram').value.trim(),
        updatedAt: Date.now()
      };

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const self = this;
      const saveBtn = document.getElementById('saveSettingsBtn');
      self.setButtonLoading(saveBtn, true, 'সংরক্ষণ হচ্ছে...');

      db.ref('settings').update(data).then(function () {
        self.setButtonLoading(saveBtn, false, 'সেটিংস সংরক্ষণ করুন');
        self.settings = data;
        self.toast('ওয়েবসাইট সেটিংস সফলভাবে আপডেট হয়েছে!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(saveBtn, false, 'সেটিংস সংরক্ষণ করুন');
        console.error('[Admin] Error saving settings:', err);
        self.toast('সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
      });
    },

    seedDatabase() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) {
        self.toast('Firebase Database সংযোগ পাওয়া যায়নি', 'error');
        return;
      }

      self.showConfirm(
        'ডাটাবেজ সেটআপ ও সিড',
        'আপনি কি Realtime Database এ স্ট্যান্ডার্ড মূল্য, স্লট, নিয়মাবলী ও সেটিংস সংরক্ষণ করতে চান? পূর্বে থাকা ডাটা আপডেট হবে।',
        function () {
          const seedBtn = document.getElementById('seedDatabaseBtn');
          self.setButtonLoading(seedBtn, true, 'ডাটাবেজ সিড হচ্ছে...');

          const defaultPricing = {
            normalDay: 550,
            normalNight: 900,
            permanentDay: 500,
            permanentNight: 850,
            dayOriginal: 600
          };

          const defaultSlots = {
            day: {
              slot_06_07: { startTime: '06:00', endTime: '07:00', active: true, session: 'day' },
              slot_07_08: { startTime: '07:00', endTime: '08:00', active: true, session: 'day' },
              slot_08_09: { startTime: '08:00', endTime: '09:00', active: true, session: 'day' },
              slot_09_10: { startTime: '09:00', endTime: '10:00', active: true, session: 'day' },
              slot_10_11: { startTime: '10:00', endTime: '11:00', active: true, session: 'day' },
              slot_11_12: { startTime: '11:00', endTime: '12:00', active: true, session: 'day' },
              slot_12_13: { startTime: '12:00', endTime: '13:00', active: true, session: 'day' },
              slot_13_14: { startTime: '13:00', endTime: '14:00', active: true, session: 'day' },
              slot_14_15: { startTime: '14:00', endTime: '15:00', active: true, session: 'day' },
              slot_15_16: { startTime: '15:00', endTime: '16:00', active: true, session: 'day' },
              slot_16_17: { startTime: '16:00', endTime: '17:00', active: true, session: 'day' },
              slot_17_18: { startTime: '17:00', endTime: '18:00', active: true, session: 'day' }
            },
            night: {
              slot_18_19: { startTime: '18:00', endTime: '19:00', active: true, session: 'night' },
              slot_19_20: { startTime: '19:00', endTime: '20:00', active: true, session: 'night' },
              slot_20_21: { startTime: '20:00', endTime: '21:00', active: true, session: 'night' },
              slot_21_22: { startTime: '21:00', endTime: '22:00', active: true, session: 'night' },
              slot_22_23: { startTime: '22:00', endTime: '23:00', active: true, session: 'night' },
              slot_23_24: { startTime: '23:00', endTime: '00:00', active: true, session: 'night' }
            }
          };

          const defaultSettings = {
            phone: '+8801700000000',
            whatsapp: '+8801700000000',
            address: 'EVER GAIN ইনডোর ফুটবল এরেনা, বাংলাদেশ',
            mapLink: 'https://maps.google.com',
            hours: '২৪ ঘণ্টা খোলা (24/7 Open)',
            heroTitle: 'আপনার ইনডোর ফুটবলের সেরা গন্তব্য',
            heroSubtitle: 'প্রিমিয়াম ইনডোর ফুটবল গ্রাউন্ড - সহজেই বুকিং দিন',
            announcement: '',
            socialFacebook: '',
            socialInstagram: ''
          };

          const defaultRules = {
            rule_1: { icon: 'fa-regular fa-clock', title: 'সময়মতো উপস্থিত থাকুন', description: 'বুকিং সময়ের অন্তত ১০-১৫ মিনিট পূর্বে গ্রাউন্ডে উপস্থিত হতে হবে। বিলম্ব হলে অতিরিক্ত সময় বরাদ্দ করা সম্ভব হবে না।', order: 1 },
            rule_2: { icon: 'fa-solid fa-shoe-prints', title: 'অবশ্যই স্পোর্টস শু পরে খেলতে হবে', description: 'টার্ফের সুরক্ষার জন্য শুধুমাত্র অনুমোদিত টার্ফ শু বা ফ্ল্যাট ইনডোর স্পোর্টস শু পরিধান বাধ্যতামূলক। মেটাল স্পাইক বা শক্ত জুতো সম্পূর্ণ নিষিদ্ধ।', order: 2 },
            rule_3: { icon: 'fa-solid fa-ban-smoking', title: 'গ্রাউন্ডে ধূমপান নিষেধ', description: 'গ্রাউন্ড, ডাগআউট ও সংলগ্ন প্রাঙ্গণে ধূমপান, পান বা যেকোনো প্রকার তামাকজাত ও নেশাজাতীয় দ্রব্য সেবন সম্পূর্ণ নিষিদ্ধ।', order: 3 },
            rule_4: { icon: 'fa-solid fa-handshake', title: 'সকলের সাথে সৌজন্যমূলক আচরণ করুন', description: 'খেলার মাঠে স্পোর্টসম্যানশিপ ও শৃঙ্খলা বজায় রাখুন। রেফারি, মাঠকর্মী ও অন্য দলের খেলোয়াড়দের প্রতি পারস্পরিক সম্মান প্রদর্শন করুন।', order: 4 },
            rule_5: { icon: 'fa-solid fa-futbol', title: 'গ্রাউন্ডের সরঞ্জাম যত্নে ব্যবহার করুন', description: 'গোলপোস্ট, জাল, ফ্লাডলাইট এবং সরবরাহকৃত বল সতর্কতার সাথে ব্যবহার করুন। কোনো সরঞ্জাম ইচ্ছাকৃত ক্ষতিগ্রস্ত হলে ক্ষতিপূরণ দিতে হবে।', order: 5 },
            rule_6: { icon: 'fa-solid fa-trash-can', title: 'গ্রাউন্ড পরিষ্কার রাখুন', description: 'গ্রাউন্ডের পরিচ্ছন্নতা রক্ষা করা আমাদের সবার দায়িত্ব। পানির বোতল, খাবারের প্যাকেট বা ময়লা-আবর্জনা মাঠে না ফেলে নির্দিষ্ট ডাস্টবিনে ফেলুন।', order: 6 },
            rule_7: { icon: 'fa-solid fa-phone-volume', title: 'বুকিং সংক্রান্ত সমস্যায় যোগাযোগ করুন', description: 'বুকিং সময়সূচি পরিবর্তন, জরুরি তথ্য বা যেকোনো অসঙ্গতির ক্ষেত্রে গ্রাউন্ড ম্যানেজার অথবা হেল্পলাইনে সরাসরি কল বা হোয়াটসঅ্যাপ করুন।', order: 7 }
          };

          const defaultGallery = {
            item_1: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain2.jpg', thumbnail: 'assets/images/Evergain2.jpg', order: 1, createdAt: Date.now() },
            item_2: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain3.jpg', thumbnail: 'assets/images/Evergain3.jpg', order: 2, createdAt: Date.now() },
            item_3: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain4.jpg', thumbnail: 'assets/images/Evergain4.jpg', order: 3, createdAt: Date.now() },
            item_4: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain5.jpg', thumbnail: 'assets/images/Evergain5.jpg', order: 4, createdAt: Date.now() },
            item_5: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain6.jpg', thumbnail: 'assets/images/Evergain6.jpg', order: 5, createdAt: Date.now() },
            item_6: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain7.jpg', thumbnail: 'assets/images/Evergain7.jpg', order: 6, createdAt: Date.now() },
            item_7: { title: 'EVER GAIN Turf', description: '', type: 'image', url: 'assets/images/Evergain8.jpg', thumbnail: 'assets/images/Evergain8.jpg', order: 7, createdAt: Date.now() }
          };

          const updates = {
            pricing: defaultPricing,
            slots: defaultSlots,
            settings: defaultSettings,
            rules: defaultRules,
            gallery: defaultGallery
          };

          if (self.currentUser) {
            updates[`admins/${self.currentUser.uid}`] = {
              email: self.currentUser.email || 'srpshourovdev1@gmail.com',
              role: 'admin',
              name: 'Super Admin',
              active: true,
              updatedAt: Date.now()
            };
          }

          db.ref().update(updates).then(function () {
            self.setButtonLoading(seedBtn, false, 'ডিফল্ট ডেটা সেটআপ সম্পন্ন হয়েছে');
            self.toast('Realtime Database সফলভাবে সেটআপ ও সিড করা হয়েছে!', 'success');
            self.initializeDashboardData();
          }).catch(function (err) {
            self.setButtonLoading(seedBtn, false, 'পুনরায় চেষ্টা করুন');
            console.error('[Admin] Database seed error:', err);
            self.toast('ডাটাবেজ সিড করতে সমস্যা হয়েছে: ' + err.message, 'error');
          });
        }
      );
    },

    // =======================================================================
    // 13. Universal Modals & Helpers
    // =======================================================================
    showConfirm(title, message, callback) {
      if (this.confirmTitle) this.confirmTitle.innerHTML = `<i class="fas fa-triangle-exclamation text-warning"></i> ${title}`;
      if (this.confirmMessage) this.confirmMessage.textContent = message;
      this.pendingConfirmAction = callback;
      if (this.confirmOverlay) this.confirmOverlay.classList.remove('hidden');
    },

    closeConfirmModal() {
      if (this.confirmOverlay) this.confirmOverlay.classList.add('hidden');
      this.pendingConfirmAction = null;
    },

    openEditModal(title, bodyHtml, onSave) {
      if (this.editModalTitle) this.editModalTitle.textContent = title;
      if (this.editModalBody) this.editModalBody.innerHTML = bodyHtml;

      // Rebind save button listener
      if (this.saveEditModalBtn) {
        // Clone button to clear old event listeners safely
        const newBtn = this.saveEditModalBtn.cloneNode(true);
        this.saveEditModalBtn.parentNode.replaceChild(newBtn, this.saveEditModalBtn);
        this.saveEditModalBtn = newBtn;

        this.saveEditModalBtn.addEventListener('click', function () {
          if (typeof onSave === 'function') {
            onSave();
          }
        });
      }

      if (this.editOverlay) this.editOverlay.classList.remove('hidden');
    },

    closeEditModal() {
      if (this.editOverlay) this.editOverlay.classList.add('hidden');
    },

    toast(message, type) {
      if (typeof window.showToast === 'function') {
        window.showToast(message, type);
      } else if (window.EverGain && typeof window.EverGain.showToast === 'function') {
        window.EverGain.showToast(message, type);
      } else {
        alert(message);
      }
    },

    setButtonLoading(btn, isLoading, text) {
      if (!btn) return;
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add('btn-loading');
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${text || 'অপেক্ষা করুন...'}</span>`;
      } else {
        btn.classList.remove('btn-loading');
        btn.innerHTML = `<span>${text}</span>`;
      }
    },

    getStatusBadge(status) {
      const st = (status || 'pending').toLowerCase();
      switch (st) {
        case 'confirmed':
          return '<span class="badge badge-confirmed"><i class="fas fa-check-circle"></i> নিশ্চিত</span>';
        case 'rejected':
          return '<span class="badge badge-rejected"><i class="fas fa-times-circle"></i> প্রত্যাখ্যাত</span>';
        case 'cancelled':
          return '<span class="badge badge-cancelled"><i class="fas fa-ban"></i> বাতিল</span>';
        case 'active':
          return '<span class="badge badge-active"><i class="fas fa-check"></i> সক্রিয়</span>';
        case 'paused':
          return '<span class="badge badge-paused"><i class="fas fa-pause"></i> স্থগিত</span>';
        case 'terminated':
          return '<span class="badge badge-rejected"><i class="fas fa-stop"></i> সমাপ্ত</span>';
        case 'pending':
        default:
          return '<span class="badge badge-pending"><i class="fas fa-clock"></i> অপেক্ষমান</span>';
      }
    },

    getWeekdayName(val) {
      const days = {
        '0': 'রবিবার',
        '1': 'সোমবার',
        '2': 'মঙ্গলবার',
        '3': 'বুধবার',
        '4': 'বৃহস্পতিবার',
        '5': 'শুক্রবার',
        '6': 'শনিবার',
        'sunday': 'রবিবার',
        'monday': 'সোমবার',
        'tuesday': 'মঙ্গলবার',
        'wednesday': 'বুধবার',
        'thursday': 'বৃহস্পতিবার',
        'friday': 'শুক্রবার',
        'saturday': 'শনিবার'
      };
      return days[String(val).toLowerCase()] || String(val);
    },

    bengaliNum(num) {
      if (typeof window.toBengaliNum === 'function') {
        return window.toBengaliNum(num);
      }
      if (num === null || num === undefined) return '';
      const digits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return String(num).replace(/[0-9]/g, d => digits[Number(d)]);
    },

    formatPrice(amt) {
      if (typeof window.formatPrice === 'function') {
        return window.formatPrice(amt);
      }
      return '৳' + Math.round(Number(amt) || 0);
    },

    formatDate(dateStr) {
      if (typeof window.formatDate === 'function') {
        return window.formatDate(dateStr);
      }
      return String(dateStr || '-');
    },

    formatTimeRange(st, et) {
      if (!st || !et) return '';
      return `${this.bengaliNum(st)} - ${this.bengaliNum(et)}`;
    },

    getTodayDateString() {
      const now = new Date();
      const yy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    },

    escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };

  // Expose AdminApp on window
  window.AdminApp = AdminApp;

  // Initialize once DOM is fully ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      AdminApp.init();
    });
  } else {
    AdminApp.init();
  }

})(window, document);
