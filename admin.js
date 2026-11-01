/**
 * EVER GAIN — Indoor Football Booking Platform
 * Admin Dashboard Management System (admin.js)
 * 
 * Complete implementation for:
 * - Admin Authentication & Role Authorization
 * - Real-time Dashboard Statistics & Revenue Tracking
 * - Comprehensive Booking Management (Approve/Confirm, Reject, Cancel, Details)
 * - Permanent Booking Management (Weekly/Monthly Slots, Status Handling)
 * - Dynamic Slot & Schedule Management (Day/Night, Block Dates, Working Days)
 * - Pricing Configuration System (Day/Night, Normal & Permanent)
 * - Gallery Media Management (Upload to assets/images via GitHub, Order, Edit, Delete)
 * - Rules & Guidelines Management (Add, Edit, Reorder, Delete)
 * - Global Website & Contact Settings Configuration
 * - One-Click Firebase Realtime Database Setup & Seeder
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
    reviews: [],
    messages: [],
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
      this.adminSidebarCloseBtn = document.getElementById('adminSidebarCloseBtn');

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

      // Message modal
      this.messageDetailOverlay = document.getElementById('messageDetailModalOverlay');
      this.messageDetailBody = document.getElementById('messageDetailModalBody');
      this.closeMessageDetailBtn = document.getElementById('closeMessageDetailModalBtn');
      this.dismissMessageDetailBtn = document.getElementById('dismissMessageDetailBtn');
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

      // 2. Email & Password Login
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
            'Confirm Logout',
            'Are you sure you want to log out from the Admin Panel?',
            function () {
              self.logout();
            }
          );
        });
      }

      // 4. Sidebar Toggle & Mobile Navigation
      if (this.adminSidebarToggle && this.adminSidebar) {
        this.adminSidebarToggle.addEventListener('click', function (e) {
          e.stopPropagation();
          self.toggleSidebar();
        });
      }

      if (this.adminSidebarCloseBtn) {
        this.adminSidebarCloseBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          self.closeSidebar();
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
          if (window.innerWidth <= 992) {
            self.closeSidebar();
          }
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
          self.toast('Dashboard statistics refreshed', 'info');
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

      // Close Message Detail Modal
      const closeMessageDetailModalBtn = document.getElementById('closeMessageDetailModalBtn');
      const dismissMessageDetailBtn = document.getElementById('dismissMessageDetailBtn');
      if (closeMessageDetailModalBtn) {
        closeMessageDetailModalBtn.addEventListener('click', function () {
          self.closeMessageModal();
        });
      }
      if (dismissMessageDetailBtn) {
        dismissMessageDetailBtn.addEventListener('click', function () {
          self.closeMessageModal();
        });
      }

      // Message Search & Filter
      const messageSearchInput = document.getElementById('messageSearchInput');
      const messageStatusFilter = document.getElementById('messageStatusFilter');
      if (messageSearchInput) {
        messageSearchInput.addEventListener('input', function () {
          self.filterMessages();
        });
      }
      if (messageStatusFilter) {
        messageStatusFilter.addEventListener('change', function () {
          self.filterMessages();
        });
      }

      // Backdrop click listeners to dismiss modals
      [this.confirmOverlay, this.bookingDetailOverlay, this.editOverlay, this.messageDetailOverlay].forEach(function (overlay) {
        if (overlay) {
          overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
              overlay.classList.add('hidden');
              overlay.classList.remove('active');
            }
          });
        }
      });
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
              const errMsg = `Unauthorized Access! Your account (${user.email || 'User'}, UID: ${user.uid}) does not have admin privileges. It must be registered in the Firebase Realtime Database at /admins/${user.uid}.`;
              self.showLoginError(errMsg);
              self.toast('Account does not have admin privileges.', 'error');
              auth.signOut();
            }
          }).catch(function (error) {
            console.error('[Admin] Error checking admin status:', error);
            self.showLoginError('Error verifying admin role: ' + (error.message || 'Permission denied in Firebase'));
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
      if (!db) return Promise.reject(new Error('Firebase Database connection not found.'));

      const self = this;
      const SUPERADMIN_EMAILS = ['srpshourovdev1@gmail.com'];
      const userEmail = (self.currentUser && self.currentUser.email) ? self.currentUser.email.toLowerCase().trim() : '';
      const isSuperAdmin = SUPERADMIN_EMAILS.includes(userEmail);

      if (isSuperAdmin) {
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
          return true;
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
        self.showLoginError('Please enter a valid email and password.');
        return;
      }

      const auth = window.auth || (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth() : null);
      if (!auth) {
        self.showLoginError('Firebase Auth connection not found.');
        return;
      }

      self.setButtonLoading(self.loginSubmitBtn, true, 'Signing in...');
      self.hideLoginError();

      auth.signInWithEmailAndPassword(email, password)
        .then(function () {
          self.setButtonLoading(self.loginSubmitBtn, false, 'Sign In with Email');
          self.toast('Signed in successfully!', 'success');
        })
        .catch(function (error) {
          self.setButtonLoading(self.loginSubmitBtn, false, 'Sign In with Email');
          let msg = 'Sign in failed. Please try again.';
          if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            msg = 'Invalid email or password.';
          } else if (error.code === 'auth/invalid-email') {
            msg = 'Please enter a valid email address.';
          } else if (error.code === 'auth/too-many-requests') {
            msg = 'Too many failed attempts. Account temporarily locked, please try again later.';
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
        self.showLoginError('Firebase Auth connection not found.');
        return;
      }

      self.setButtonLoading(self.googleLoginBtn, true, 'Connecting Google...');
      self.hideLoginError();

      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .then(function () {
          self.setButtonLoading(self.googleLoginBtn, false, 'Sign in with Google');
          self.toast('Google authentication successful!', 'success');
        })
        .catch(function (error) {
          self.setButtonLoading(self.googleLoginBtn, false, 'Sign in with Google');
          let msg = 'Google sign in failed.';
          if (error.code === 'auth/popup-closed-by-user') {
            msg = 'Sign in popup was closed.';
          } else if (error.code === 'auth/popup-blocked') {
            msg = 'Popup was blocked by your browser. Please allow popups.';
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
          this.toast('Logged out successfully.', 'info');
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
      const links = document.querySelectorAll('.admin-sidebar-link[data-tab]');
      links.forEach(function (link) {
        if (link.getAttribute('data-tab') === tabName) {
          link.classList.add('active');
          link.setAttribute('aria-selected', 'true');
        } else {
          link.classList.remove('active');
          link.setAttribute('aria-selected', 'false');
        }
      });

      // 2. Hide all tab sections, show selected
      const sections = document.querySelectorAll('.admin-section');
      sections.forEach(function (sec) {
        sec.classList.add('hidden');
      });

      const activeSection = document.getElementById(`tab-${tabName}`);
      if (activeSection) {
        activeSection.classList.remove('hidden');
      }

      // 3. Close mobile sidebar
      this.closeSidebar();

      // 4. Trigger section-specific renders
      if (tabName === 'dashboard') {
        this.loadDashboardStats();
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
      } else if (tabName === 'reviews') {
        this.renderReviewsList();
      } else if (tabName === 'messages') {
        this.filterMessages();
      } else if (tabName === 'settings') {
        this.renderSettingsInputs();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    toggleSidebar() {
      if (!this.adminSidebar) return;
      const isOpen = this.adminSidebar.classList.contains('mobile-open') ||
                     this.adminSidebar.classList.contains('active') ||
                     this.adminSidebar.classList.contains('open');
      if (isOpen) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    },

    openSidebar() {
      if (this.adminSidebar) {
        this.adminSidebar.classList.add('mobile-open', 'active', 'open');
      }
      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.classList.add('active');
        this.sidebarBackdrop.classList.remove('hidden');
      }
      document.body.classList.add('sidebar-locked');
    },

    closeSidebar() {
      if (this.adminSidebar) {
        this.adminSidebar.classList.remove('mobile-open', 'active', 'open');
      }
      if (this.sidebarBackdrop) {
        this.sidebarBackdrop.classList.remove('active');
        this.sidebarBackdrop.classList.add('hidden');
      }
      document.body.classList.remove('sidebar-locked');
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
      this.loadReviewsAdmin();
      this.loadMessages();
      this.loadSettings();
    },

    detachListeners() {
      this.listeners.forEach(function (l) {
        try {
          if (l.ref && typeof l.ref.off === 'function') {
            l.ref.off(l.event);
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
        today: 0,
        revenue: 0
      };

      const todayStr = this.getTodayDateString();

      this.bookings.forEach(function (b) {
        const st = (b.status || 'pending').toLowerCase();
        if (st === 'pending') stats.pending++;
        else if (st === 'confirmed') {
          stats.confirmed++;
          stats.revenue += Number(b.price || b.totalAmount || 0);
        } else if (st === 'cancelled' || st === 'rejected') {
          stats.cancelled++;
        }

        if (b.date === todayStr) {
          stats.today++;
        }
      });

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
      const elPermanent = document.getElementById('statPermanentSlots') || document.getElementById('statPermanentBookings');
      const elToday = document.getElementById('statTodayBookings');
      const elRevenue = document.getElementById('statRevenue');

      if (elTotal) elTotal.textContent = stats.total;
      if (elPending) elPending.textContent = stats.pending;
      if (elConfirmed) elConfirmed.textContent = stats.confirmed;
      if (elCancelled) elCancelled.textContent = stats.cancelled;
      if (elPermanent) elPermanent.textContent = stats.permanent;
      if (elToday) elToday.textContent = stats.today;
      if (elRevenue) elRevenue.textContent = this.formatPrice(stats.revenue);

      // Sidebar badges
      const pendingBadge = document.getElementById('pendingBookingsBadge');
      if (pendingBadge) {
        if (stats.pending > 0) {
          pendingBadge.textContent = stats.pending;
          pendingBadge.classList.remove('hidden');
        } else {
          pendingBadge.classList.add('hidden');
        }
      }

      const permanentBadge = document.getElementById('permanentBadge');
      if (permanentBadge) {
        if (stats.permanent > 0) {
          permanentBadge.textContent = stats.permanent;
          permanentBadge.classList.remove('hidden');
        } else {
          permanentBadge.classList.add('hidden');
        }
      }
    },

    loadRecentBookings() {
      const tbody = document.getElementById('recentBookingsTbody');
      if (!tbody) return;

      const sorted = this.bookings.slice().sort(function (a, b) {
        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        return timeB - timeA;
      }).slice(0, 8);

      if (sorted.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No booking records found</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      sorted.forEach(function (b) {
        const idDisplay = b.id ? (b.id.length > 12 ? b.id.substring(0, 10) + '...' : b.id) : '-';
        const nameDisplay = self.escapeHtml(b.customerName || b.name || 'Anonymous');
        const rawPhone = b.customerPhone || b.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const dateDisplay = self.formatDate(b.date);
        const sessionBadge = b.session === 'night'
          ? '<span class="badge" style="background: rgba(59,130,246,0.15); color: #60a5fa;"><i class="fas fa-moon"></i> Night</span>'
          : '<span class="badge" style="background: rgba(245,158,11,0.15); color: #fbbf24;"><i class="fas fa-sun"></i> Day</span>';
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
            <td>${sessionBadge}</td>
            <td><small>${slotDisplay}</small></td>
            <td>${priceDisplay}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="action-buttons">
                ${isPending ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="event.stopPropagation(); AdminApp.approveBooking('${b.id}')" title="Confirm Booking">
                    <i class="fas fa-circle-check"></i> <span>Confirm</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.rejectBooking('${b.id}')" title="Reject Booking">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); AdminApp.viewBookingDetail('${b.id}')" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.deleteBooking('${b.id}')" title="Delete Booking Permanently">
                  <i class="fas fa-trash"></i>
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
        self.checkAndCleanupExpiredBookings(self.bookings);
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
        if (query) {
          const name = (b.name || b.customerName || '').toLowerCase();
          const phone = (b.phone || b.customerPhone || '').toLowerCase();
          const id = (b.id || '').toLowerCase();
          if (!name.includes(query) && !phone.includes(query) && !id.includes(query)) {
            return false;
          }
        }

        if (filterDate && b.date !== filterDate) {
          return false;
        }

        if (filterSession && (b.session || '').toLowerCase() !== filterSession) {
          return false;
        }

        if (filterStatus && (b.status || 'pending').toLowerCase() !== filterStatus) {
          return false;
        }

        return true;
      });

      filtered.sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      this.renderBookings(filtered);
    },

    renderBookings(list) {
      const tbody = document.getElementById('allBookingsTbody');
      const countDisplay = document.getElementById('bookingsCountDisplay');

      if (countDisplay) {
        countDisplay.textContent = 'Total: ' + list.length;
      }

      if (!tbody) return;

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No bookings match the filter criteria</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      list.forEach(function (b) {
        const idShort = b.id ? (b.id.length > 14 ? b.id.substring(0, 12) + '...' : b.id) : '-';
        const nameDisplay = self.escapeHtml(b.customerName || b.name || 'Anonymous');
        const rawPhone = b.customerPhone || b.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const dateDisplay = self.formatDate(b.date);
        const sessionDisplay = (b.session === 'night') ? 'Night' : 'Day';
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
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="event.stopPropagation(); AdminApp.approveBooking('${b.id}')" title="Confirm Booking">
                    <i class="fas fa-circle-check"></i> <span>Confirm</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.rejectBooking('${b.id}')" title="Reject Booking">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                ${isConfirmed ? `
                  <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.cancelBooking('${b.id}')" title="Cancel Booking">
                    <i class="fas fa-ban"></i> <span>Cancel</span>
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); AdminApp.viewBookingDetail('${b.id}')" title="View Details">
                  <i class="fas fa-eye"></i>
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="event.stopPropagation(); AdminApp.deleteBooking('${b.id}')" title="Delete Booking Permanently">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      // Also render responsive mobile cards
      const mobileCardsContainer = document.getElementById('allBookingsMobileCards');
      if (mobileCardsContainer) {
        if (list.length === 0) {
          mobileCardsContainer.innerHTML = '<p class="form-hint text-center py-4">No bookings match the filter criteria</p>';
        } else {
          let cardHtml = '';
          list.forEach(function (b) {
            const nameDisplay = self.escapeHtml(b.customerName || b.name || 'Anonymous');
            const rawPhone = b.customerPhone || b.phone || '';
            const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
            const dateDisplay = self.formatDate(b.date);
            const sessionDisplay = (b.session === 'night') ? 'Night' : 'Day';
            const slotDisplay = self.escapeHtml(b.slotTime || b.slot || b.time || '-');
            const priceDisplay = self.formatPrice(b.price || b.totalAmount || 0);
            const st = (b.status || 'pending').toLowerCase();
            const statusBadge = self.getStatusBadge(b.status);
            const isPending = (st === 'pending');
            const isConfirmed = (st === 'confirmed');

            cardHtml += `
              <div class="admin-mobile-card" onclick="AdminApp.viewBookingDetail('${b.id}')">
                <div class="admin-mobile-card-header">
                  <div>
                    <span class="admin-mobile-card-id">${b.id || '-'}</span>
                    <h4 class="admin-mobile-card-name">${nameDisplay}</h4>
                  </div>
                  <div>${statusBadge}</div>
                </div>

                <div class="admin-mobile-card-body">
                  ${rawPhone ? `
                    <div class="admin-card-row">
                      <i class="fas fa-phone"></i>
                      <a href="tel:${rawPhone}" onclick="event.stopPropagation()" style="color: var(--color-primary-light); font-weight: 600; text-decoration: none;">${phoneDisplay}</a>
                      <a href="https://wa.me/${rawPhone.replace(/\D/g, '')}" target="_blank" onclick="event.stopPropagation()" class="btn btn-sm btn-secondary ml-1" style="padding: 2px 8px; font-size: 0.75rem;">
                        <i class="fab fa-whatsapp text-primary"></i> WhatsApp
                      </a>
                    </div>
                  ` : ''}
                  <div class="admin-card-row">
                    <i class="fas fa-calendar"></i>
                    <span><strong>${dateDisplay}</strong> (${sessionDisplay})</span>
                  </div>
                  <div class="admin-card-row">
                    <i class="fas fa-clock"></i>
                    <span>${slotDisplay}</span>
                  </div>
                  <div class="admin-card-row">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Fee: <strong class="text-accent">${priceDisplay}</strong></span>
                  </div>
                </div>

                <div class="admin-mobile-card-actions" onclick="event.stopPropagation()">
                  ${isPending ? `
                    <button type="button" class="btn btn-sm btn-approve-direct" onclick="AdminApp.approveBooking('${b.id}')">
                      <i class="fas fa-circle-check"></i> Confirm
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.rejectBooking('${b.id}')">
                      <i class="fas fa-xmark"></i> Reject
                    </button>
                  ` : ''}
                  ${isConfirmed ? `
                    <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.cancelBooking('${b.id}')">
                      <i class="fas fa-ban"></i> Cancel
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.viewBookingDetail('${b.id}')">
                    <i class="fas fa-eye"></i> Details
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteBooking('${b.id}')">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            `;
          });
          mobileCardsContainer.innerHTML = cardHtml;
        }
      }
    },

    approveBooking(id) {
      const self = this;
      let b = this.bookings.find(item => item.id === id);

      const executeApproval = function (bookingData) {
        const custName = bookingData.customerName || bookingData.name || 'this customer';
        const dateStr = bookingData.date ? self.formatDate(bookingData.date) : 'scheduled date';
        self.showConfirm(
          'Confirm Booking Approval',
          `Are you sure you want to approve the booking for ${custName} on ${dateStr}?`,
          function () {
            const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
            if (!db) {
              self.toast('Database connection not found.', 'error');
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
              self.toast('Booking approved successfully!', 'success');
              self.closeBookingDetailModal();
              self.closeConfirmModal();
            }).catch(function (err) {
              console.error('[Admin] Error approving booking:', err);
              self.toast('Error approving booking: ' + err.message, 'error');
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
              self.toast('Booking record not found.', 'error');
            }
          }).catch(function () {
            self.toast('Failed to load booking details.', 'error');
          });
        }
      }
    },

    rejectBooking(id) {
      const self = this;
      const b = this.bookings.find(item => item.id === id);
      if (!b) return;

      this.showConfirm(
        'Confirm Booking Rejection',
        `Are you sure you want to reject the booking for ${b.name || b.customerName || 'this customer'}?`,
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
            self.toast('Booking has been rejected.', 'warning');
            self.closeBookingDetailModal();
          }).catch(function (err) {
            console.error('[Admin] Error rejecting booking:', err);
            self.toast('Error rejecting booking: ' + err.message, 'error');
          });
        }
      );
    },

    cancelBooking(id) {
      const self = this;
      const b = this.bookings.find(item => item.id === id);
      if (!b) return;

      this.showConfirm(
        'Confirm Booking Cancellation',
        'Warning: This is a confirmed booking. Are you sure you want to cancel it?',
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
            self.toast('Booking has been cancelled.', 'warning');
            self.closeBookingDetailModal();
          }).catch(function (err) {
            console.error('[Admin] Error cancelling booking:', err);
            self.toast('Error cancelling booking: ' + err.message, 'error');
          });
        }
      );
    },

    deleteBooking(id) {
      const self = this;
      let b = this.bookings.find(item => item.id === id);
      this.showConfirm(
        'Delete Booking Permanently',
        'Are you sure you want to permanently delete this booking? This will remove the record and free the slot.',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          const updates = {};
          updates[`bookings/${id}`] = null;

          if (b && b.date) {
            const slotKey = b.slotId || (b.slotTime ? b.slotTime.replace(/[^a-zA-Z0-9]/g, '_') : null);
            if (slotKey) {
              updates[`availability/${b.date}/${slotKey}`] = null;
              if (b.session) {
                updates[`availability/${b.date}/${b.session}/${slotKey}`] = null;
              }
            }
          }

          db.ref().update(updates).then(function () {
            self.toast('Booking deleted successfully.', 'success');
            self.closeBookingDetailModal();
          }).catch(function (err) {
            console.error('[Admin] Error deleting booking:', err);
            self.toast('Error deleting booking: ' + err.message, 'error');
          });
        }
      );
    },

    checkAndCleanupExpiredBookings(list) {
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db || !Array.isArray(list) || list.length === 0) return;

      const now = Date.now();
      const twoHoursMs = 2 * 60 * 60 * 1000;

      list.forEach(function (b) {
        if (!b || !b.id || !b.date || b.type === 'permanent') return;

        let matchEndTime = null;
        try {
          const parts = String(b.date).split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);

            let endHour = 23;
            let endMin = 59;
            let dayOffset = 0;

            if (b.slotId && /^slot_\d+_(\d+)$/.test(b.slotId)) {
              const match = b.slotId.match(/^slot_\d+_(\d+)$/);
              let h = parseInt(match[1], 10);
              if (h >= 24) {
                h = h - 24;
                dayOffset = 1;
              }
              endHour = h;
              endMin = 0;
            }

            const endDate = new Date(year, month, day + dayOffset, endHour, endMin, 0);
            matchEndTime = endDate.getTime();
          }
        } catch (e) {
          console.warn('[Admin] Expiration parse error:', e);
        }

        if (matchEndTime && (now > (matchEndTime + twoHoursMs))) {
          console.log('[Admin] Auto-deleting expired booking (2h after slot):', b.id, b.date);
          const updates = {};
          updates[`bookings/${b.id}`] = null;
          if (b.date) {
            const slotKey = b.slotId || (b.slotTime ? b.slotTime.replace(/[^a-zA-Z0-9]/g, '_') : null);
            if (slotKey) {
              updates[`availability/${b.date}/${slotKey}`] = null;
              if (b.session) {
                updates[`availability/${b.date}/${b.session}/${slotKey}`] = null;
              }
            }
          }
          db.ref().update(updates).catch(function (err) {
            console.warn('[Admin] Failed to remove expired booking:', err);
          });
        }
      });
    },

    viewBookingDetail(id) {
      let b = this.bookings.find(item => item.id === id);
      if (!b) {
        b = this.permanentBookings.find(item => item.id === id);
      }
      if (!b || !this.bookingDetailBody) return;

      const nameDisplay = this.escapeHtml(b.customerName || b.name || 'Anonymous');
      const rawPhone = b.customerPhone || b.phone || '';
      const phoneDisplay = rawPhone ? this.escapeHtml(rawPhone) : '-';
      const emailDisplay = this.escapeHtml(b.customerEmail || b.email || 'Not provided');
      const dateDisplay = b.date ? this.formatDate(b.date) : (b.weekday !== undefined ? this.getWeekdayName(b.weekday) : '-');
      const sessionDisplay = (b.session === 'night') ? 'Night' : 'Day';
      const slotDisplay = this.escapeHtml(b.slotTime || b.slot || b.time || '-');
      const priceDisplay = this.formatPrice(b.price || b.monthlyFee || b.totalAmount || 0);
      const categoryDisplay = this.escapeHtml(b.category || (b.type === 'permanent' ? 'Permanent Booking' : 'Normal Booking'));
      const playersCount = b.players ? (b.players + ' players') : 'Not specified';
      const notesDisplay = this.escapeHtml(b.message || b.notes || 'No special instructions');
      const createdAtDisplay = b.createdAt ? new Date(b.createdAt).toLocaleString('en-US') : '-';
      const st = (b.status || 'pending').toLowerCase();
      const statusBadge = this.getStatusBadge(b.status);

      this.bookingDetailBody.innerHTML = `
        <div class="booking-detail-grid">
          <div class="card mb-3" style="background: var(--color-surface); padding: 1rem;">
            <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-user"></i> Customer / Team Info</h4>
            ${b.teamName ? `<p><strong>Team Name:</strong> <span class="badge badge-info" style="font-size: 0.9rem;"><i class="fas fa-users"></i> ${this.escapeHtml(b.teamName)}</span></p>` : ''}
            <p><strong>${b.teamName ? 'Captain Name' : 'Name'}:</strong> ${this.escapeHtml(b.captainName || nameDisplay)}</p>
            <p><strong>Phone:</strong> ${rawPhone ? `<a href="tel:${rawPhone}">${phoneDisplay}</a> <a href="https://wa.me/${rawPhone.replace(/\D/g, '')}" target="_blank" class="btn btn-sm btn-secondary ml-2"><i class="fab fa-whatsapp text-primary"></i> WhatsApp</a>` : '-'}</p>
            <p><strong>Email:</strong> ${emailDisplay}</p>
            <p><strong>Players:</strong> ${playersCount}</p>
          </div>

          <div class="card mb-3" style="background: var(--color-surface); padding: 1rem;">
            <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-calendar-check"></i> Slot Details</h4>
            <p><strong>Booking ID:</strong> <code>${b.id}</code></p>
            <p><strong>Date / Day:</strong> ${dateDisplay}</p>
            <p><strong>Session:</strong> ${sessionDisplay}</p>
            <p><strong>Time Slot:</strong> ${slotDisplay}</p>
            <p><strong>Category:</strong> ${categoryDisplay}</p>
            <p><strong>Total Price:</strong> <strong style="color: var(--color-primary);">${priceDisplay}</strong></p>
            <p><strong>Status:</strong> ${statusBadge}</p>
            <p><strong>Booked At:</strong> <small>${createdAtDisplay}</small></p>
          </div>
        </div>

        <div class="card" style="background: var(--color-surface); padding: 1rem;">
          <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-comment-dots"></i> Special Notes / Instructions</h4>
          <p class="card-text">${notesDisplay}</p>
        </div>
      `;

      if (this.bookingDetailFooter) {
        let footerHtml = `
          <button type="button" class="btn btn-secondary" onclick="AdminApp.closeBookingDetailModal()">Close</button>
          <button type="button" class="btn btn-danger" onclick="AdminApp.deleteBooking('${b.id}')"><i class="fas fa-trash"></i> Delete Booking</button>
        `;

        if (st === 'pending') {
          footerHtml += `
            <button type="button" class="btn btn-danger" onclick="AdminApp.rejectBooking('${b.id}')"><i class="fas fa-xmark"></i> Reject</button>
            <button type="button" class="btn btn-primary btn-lg" onclick="AdminApp.approveBooking('${b.id}')" style="box-shadow: 0 0 15px rgba(16,185,129,0.5); font-weight: 700;"><i class="fas fa-circle-check"></i> Confirm Booking</button>
          `;
        } else if (st === 'confirmed') {
          footerHtml += `
            <button type="button" class="btn btn-warning" onclick="AdminApp.cancelBooking('${b.id}')"><i class="fas fa-ban"></i> Cancel Booking</button>
          `;
        }

        this.bookingDetailFooter.innerHTML = footerHtml;
      }

      this.openBookingDetailModal();
    },

    openBookingDetailModal() {
      if (this.bookingDetailOverlay) {
        this.bookingDetailOverlay.classList.remove('hidden');
        this.bookingDetailOverlay.classList.add('active');
      }
    },

    closeBookingDetailModal() {
      if (this.bookingDetailOverlay) {
        this.bookingDetailOverlay.classList.add('hidden');
        this.bookingDetailOverlay.classList.remove('active');
      }
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
          const phone = (pb.phone || pb.customerPhone || '').toLowerCase();
          if (!name.includes(query) && !phone.includes(query)) {
            return false;
          }
        }

        if (filterStatus && (pb.status || 'pending').toLowerCase() !== filterStatus) {
          return false;
        }

        return true;
      });

      this.renderPermanentBookings(filtered);
    },

    renderPermanentBookings(list) {
      const tbody = document.getElementById('allPermanentBookingsTbody') || document.getElementById('permanentTableBody');
      const countDisplay = document.getElementById('permanentBookingsCountDisplay');

      if (countDisplay) {
        countDisplay.textContent = 'Total Permanent Bookings: ' + list.length;
      }

      if (!tbody) return;

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">No permanent booking records found</td></tr>';
        return;
      }

      let html = '';
      const self = this;

      list.forEach(function (pb) {
        const idDisplay = pb.id ? (pb.id.length > 12 ? pb.id.substring(0, 10) + '...' : pb.id) : '-';
        const nameDisplay = self.escapeHtml(pb.customerName || pb.name || 'Customer');
        const teamBadge = pb.teamName ? `<div style="font-weight: 700; color: var(--color-primary-light); font-size: 0.95rem;"><i class="fas fa-users"></i> ${self.escapeHtml(pb.teamName)}</div>` : '';
        const captText = pb.captainName ? `<div style="font-size: 0.82rem; color: var(--color-text-secondary);"><i class="fas fa-user-shield"></i> Capt: ${self.escapeHtml(pb.captainName)}</div>` : '';
        const nameCell = teamBadge ? `${teamBadge}${captText || nameDisplay}` : `<strong>${nameDisplay}</strong>`;
        const rawPhone = pb.customerPhone || pb.phone || '';
        const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const weekdayName = self.getWeekdayName(pb.weekday !== undefined ? pb.weekday : pb.dayOfWeek);
        const sessionDisplay = pb.session === 'night' ? 'Night' : 'Day';
        const slotDisplay = self.escapeHtml(pb.slotTime || pb.slot || pb.time || '-');
        const feeDisplay = self.formatPrice(pb.monthlyFee || pb.price || 0);
        const st = (pb.status || 'pending').toLowerCase();
        const statusBadge = self.getStatusBadge(pb.status);

        html += `
          <tr>
            <td><code>${idDisplay}</code></td>
            <td>${nameCell}</td>
            <td>${rawPhone ? `<a href="tel:${rawPhone}" style="color: inherit; text-decoration: none;">${phoneDisplay}</a>` : '-'}</td>
            <td><span class="badge badge-available">${weekdayName}</span></td>
            <td>${sessionDisplay}</td>
            <td>${slotDisplay}</td>
            <td>${feeDisplay}</td>
            <td>${statusBadge}</td>
            <td>
              <div class="action-buttons">
                ${(st === 'pending') ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="AdminApp.approvePermanent('${pb.id}')" title="Approve & Activate">
                    <i class="fas fa-circle-check"></i> <span>Activate</span>
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.rejectPermanent('${pb.id}')" title="Reject">
                    <i class="fas fa-xmark"></i>
                  </button>
                ` : ''}
                ${(st === 'active') ? `
                  <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.pausePermanent('${pb.id}')" title="Pause">
                    <i class="fas fa-pause"></i> Pause
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')" title="Terminate">
                    <i class="fas fa-stop"></i> Terminate
                  </button>
                ` : ''}
                ${(st === 'paused') ? `
                  <button type="button" class="btn btn-sm btn-primary" onclick="AdminApp.approvePermanent('${pb.id}')" title="Resume">
                    <i class="fas fa-play"></i> Activate
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')" title="Terminate">
                    <i class="fas fa-stop"></i> Terminate
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deletePermanent('${pb.id}')" title="Delete Permanent Booking Record">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      });

      tbody.innerHTML = html;

      // Also render mobile cards for permanent bookings
      const mobileCardsContainer = document.getElementById('permanentBookingsMobileCards');
      if (mobileCardsContainer) {
        if (list.length === 0) {
          mobileCardsContainer.innerHTML = '<p class="form-hint text-center py-4">No permanent booking records found</p>';
        } else {
          let cardHtml = '';
          list.forEach(function (pb) {
            const idDisplay = pb.id ? (pb.id.length > 12 ? pb.id.substring(0, 10) + '...' : pb.id) : '-';
            const nameDisplay = self.escapeHtml(pb.customerName || pb.name || 'Customer');
            const teamName = pb.teamName ? self.escapeHtml(pb.teamName) : '';
            const captainName = pb.captainName ? self.escapeHtml(pb.captainName) : '';
            const rawPhone = pb.customerPhone || pb.phone || '';
            const phoneDisplay = rawPhone ? self.escapeHtml(rawPhone) : '-';
            const weekdayName = self.getWeekdayName(pb.weekday !== undefined ? pb.weekday : pb.dayOfWeek);
            const sessionDisplay = pb.session === 'night' ? 'Night' : 'Day';
            const slotDisplay = self.escapeHtml(pb.slotTime || pb.slot || pb.time || '-');
            const feeDisplay = self.formatPrice(pb.monthlyFee || pb.price || 0);
            const st = (pb.status || 'pending').toLowerCase();
            const statusBadge = self.getStatusBadge(pb.status);

            cardHtml += `
              <div class="admin-mobile-card" onclick="AdminApp.viewBookingDetail('${pb.id}')">
                <div class="admin-mobile-card-header">
                  <div>
                    <span class="admin-mobile-card-id">${idDisplay}</span>
                    <h4 class="admin-mobile-card-name">${teamName ? `<i class="fas fa-users text-primary"></i> ${teamName}` : nameDisplay}</h4>
                    ${captainName ? `<div class="admin-mobile-card-sub"><i class="fas fa-user-shield text-info"></i> Captain: <strong>${captainName}</strong></div>` : ''}
                  </div>
                  <div>${statusBadge}</div>
                </div>

                <div class="admin-mobile-card-body">
                  ${rawPhone ? `
                    <div class="admin-card-row">
                      <i class="fas fa-phone"></i>
                      <a href="tel:${rawPhone}" onclick="event.stopPropagation()" style="color: var(--color-primary-light); font-weight: 600; text-decoration: none;">${phoneDisplay}</a>
                      <a href="https://wa.me/${rawPhone.replace(/\D/g, '')}" target="_blank" onclick="event.stopPropagation()" class="btn btn-sm btn-secondary ml-1" style="padding: 2px 8px; font-size: 0.75rem;">
                        <i class="fab fa-whatsapp text-primary"></i> WhatsApp
                      </a>
                    </div>
                  ` : ''}
                  <div class="admin-card-row">
                    <i class="fas fa-repeat"></i>
                    <span><strong>Every ${weekdayName}</strong> (${sessionDisplay} Session)</span>
                  </div>
                  <div class="admin-card-row">
                    <i class="fas fa-clock"></i>
                    <span>${slotDisplay}</span>
                  </div>
                  <div class="admin-card-row">
                    <i class="fas fa-money-bill-wave"></i>
                    <span>Fee: <strong class="text-accent">${feeDisplay} / week</strong></span>
                  </div>
                </div>

                <div class="admin-mobile-card-actions" onclick="event.stopPropagation()">
                  ${(st === 'pending') ? `
                    <button type="button" class="btn btn-sm btn-approve-direct" onclick="AdminApp.approvePermanent('${pb.id}')">
                      <i class="fas fa-circle-check"></i> Activate
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.rejectPermanent('${pb.id}')">
                      <i class="fas fa-xmark"></i> Reject
                    </button>
                  ` : ''}
                  ${(st === 'active') ? `
                    <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.pausePermanent('${pb.id}')">
                      <i class="fas fa-pause"></i> Pause
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')">
                      <i class="fas fa-stop"></i> Terminate
                    </button>
                  ` : ''}
                  ${(st === 'paused') ? `
                    <button type="button" class="btn btn-sm btn-primary" onclick="AdminApp.approvePermanent('${pb.id}')">
                      <i class="fas fa-play"></i> Activate
                    </button>
                    <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.terminatePermanent('${pb.id}')">
                      <i class="fas fa-stop"></i> Terminate
                    </button>
                  ` : ''}
                  <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.viewBookingDetail('${pb.id}')">
                    <i class="fas fa-eye"></i> Details
                  </button>
                  <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deletePermanent('${pb.id}')">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </div>
              </div>
            `;
          });
          mobileCardsContainer.innerHTML = cardHtml;
        }
      }
    },

    approvePermanent(id) {
      const self = this;
      this.showConfirm(
        'Activate Permanent Booking',
        'Are you sure you want to approve and activate this permanent booking?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'active',
            activatedAt: Date.now()
          }).then(function () {
            self.toast('Permanent booking activated!', 'success');
          }).catch(function (err) {
            console.error('[Admin] Error activating permanent booking:', err);
            self.toast('Error activating permanent booking: ' + err.message, 'error');
          });
        }
      );
    },

    rejectPermanent(id) {
      const self = this;
      this.showConfirm(
        'Reject Permanent Booking',
        'Are you sure you want to reject this permanent booking request?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'rejected',
            rejectedAt: Date.now()
          }).then(function () {
            self.toast('Permanent booking request rejected.', 'warning');
          });
        }
      );
    },

    pausePermanent(id) {
      const self = this;
      this.showConfirm(
        'Pause Permanent Booking',
        'Are you sure you want to temporarily pause this permanent booking?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'paused',
            pausedAt: Date.now()
          }).then(function () {
            self.toast('Permanent booking paused.', 'info');
          });
        }
      );
    },

    terminatePermanent(id) {
      const self = this;
      this.showConfirm(
        'Terminate Permanent Booking',
        'Warning: This permanent booking slot will be terminated and freed. Are you sure?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).update({
            status: 'terminated',
            terminatedAt: Date.now()
          }).then(function () {
            self.toast('Permanent booking terminated.', 'info');
          });
        }
      );
    },

    deletePermanent(id) {
      const self = this;
      this.showConfirm(
        'Delete Permanent Booking',
        'Are you sure you want to completely delete this permanent booking record?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('permanentBookings/' + id).remove().then(function () {
            self.toast('Permanent booking deleted.', 'info');
          }).catch(function (err) {
            console.error('[Admin] Error deleting permanent booking:', err);
            self.toast('Error deleting permanent booking: ' + err.message, 'error');
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

      if (dayBtn && nightBtn) {
        if (session === 'day') {
          dayBtn.classList.add('active');
          nightBtn.classList.remove('active');
        } else {
          nightBtn.classList.add('active');
          dayBtn.classList.remove('active');
        }
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
        const val = snapshot.val();
        self.slots = { day: [], night: [] };

        if (val) {
          ['day', 'night'].forEach(function (session) {
            if (val[session]) {
              Object.keys(val[session]).forEach(function (k) {
                const s = val[session][k];
                if (typeof s === 'object' && s !== null) {
                  s.id = k;
                  self.slots[session].push(s);
                }
              });
            }
          });
        }

        self.renderSlots(self.currentSlotSession);
      });
    },

    renderSlots(session) {
      const container = document.getElementById('slotsListContainer');
      if (!container) return;

      const list = this.slots[session] || [];
      if (list.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-4">No slots created for this session yet.</p>';
        return;
      }

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
              <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.editSlotModal('${session}', '${slot.id}')" title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteSlot('${session}', '${slot.id}')" title="Delete">
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
        this.toast('Please select both start and end times.', 'warning');
        return;
      }

      if (startTime >= endTime && endTime !== '00:00' && endTime !== '24:00') {
        this.toast('Start time must be before end time.', 'warning');
        return;
      }

      const label = this.formatTimeRange(startTime, endTime);
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      db.ref(`slots/${session}`).push({
        startTime: startTime,
        endTime: endTime,
        label: label,
        active: true,
        createdAt: Date.now()
      }).then(function () {
        self.toast('Slot added successfully!', 'success');
        const form = document.getElementById('addSlotForm');
        if (form) form.reset();
      });
    },

    editSlotModal(session, slotId) {
      const slot = (this.slots[session] || []).find(s => s.id === slotId);
      if (!slot) return;

      const self = this;
      this.openEditModal(
        'Edit Slot Time',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotStartTime">Start Time</label>
            <input type="time" id="editSlotStartTime" class="form-input" value="${slot.startTime || ''}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotEndTime">End Time</label>
            <input type="time" id="editSlotEndTime" class="form-input" value="${slot.endTime || ''}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editSlotLabel">Label (Optional)</label>
            <input type="text" id="editSlotLabel" class="form-input" value="${self.escapeHtml(slot.label || '')}">
          </div>
        `,
        function () {
          const st = document.getElementById('editSlotStartTime').value;
          const et = document.getElementById('editSlotEndTime').value;
          const lb = document.getElementById('editSlotLabel').value.trim();

          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`slots/${session}/${slotId}`).update({
            startTime: st,
            endTime: et,
            label: lb || self.formatTimeRange(st, et),
            updatedAt: Date.now()
          }).then(function () {
            self.toast('Slot updated successfully!', 'success');
            self.closeEditModal();
          });
        }
      );
    },

    deleteSlot(session, slotId) {
      const self = this;
      this.showConfirm(
        'Delete Slot',
        'Are you sure you want to permanently delete this slot?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`slots/${session}/${slotId}`).remove().then(function () {
            self.toast('Slot deleted.', 'info');
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
        container.innerHTML = '<p class="form-hint text-center py-2">No dates currently blocked.</p>';
        return;
      }

      let html = '<div class="blocked-dates-chips" style="display: flex; flex-direction: column; gap: 0.5rem;">';
      const self = this;

      keys.forEach(function (k) {
        const item = self.blockedDates[k];
        const dateStr = typeof item === 'object' && item.date ? item.date : k;
        const reason = typeof item === 'object' && item.reason ? item.reason : 'Turf Closed';

        html += `
          <div class="card" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); padding: 0.6rem 0.9rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong style="color: var(--color-danger);"><i class="fas fa-calendar-xmark"></i> ${self.formatDate(dateStr)}</strong>
              <small class="text-muted ml-2">(${self.escapeHtml(reason)})</small>
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.unblockDate('${k}')" title="Unblock this date">
              <i class="fas fa-lock-open"></i> Unblock
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
        this.toast('Please select a date to block.', 'warning');
        return;
      }

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const safeKey = date.replace(/[^\w-]/g, '_');

      db.ref(`blockedDates/${safeKey}`).set({
        date: date,
        reason: reason || 'Turf Closed',
        blockedAt: Date.now()
      }).then(function () {
        self.toast(`Bookings blocked for ${self.formatDate(date)}.`, 'success');
        const form = document.getElementById('blockDateForm');
        if (form) form.reset();
      });
    },

    unblockDate(dateKey) {
      const self = this;
      this.showConfirm(
        'Unblock Date',
        'Are you sure you want to reopen bookings for this date?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`blockedDates/${dateKey}`).remove().then(function () {
            self.toast('Date unblocked and reopened.', 'info');
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
        self.toast('Working days settings saved successfully!', 'success');
      }).catch(function (err) {
        console.error('[Admin] Error saving working days:', err);
        self.toast('Error saving working days: ' + err.message, 'error');
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

      if (fNormalDay && (p.normalDay !== undefined || p.dayPrice !== undefined)) {
        fNormalDay.value = p.normalDay !== undefined ? p.normalDay : p.dayPrice;
      }
      if (fDayOriginal && (p.dayOriginal !== undefined || p.dayOriginalPrice !== undefined)) {
        fDayOriginal.value = p.dayOriginal !== undefined ? p.dayOriginal : p.dayOriginalPrice;
      }
      if (fNormalNight && (p.normalNight !== undefined || p.nightPrice !== undefined)) {
        fNormalNight.value = p.normalNight !== undefined ? p.normalNight : p.nightPrice;
      }
      if (fPermanentDay && (p.permanentDay !== undefined || p.permanentDayPrice !== undefined)) {
        fPermanentDay.value = p.permanentDay !== undefined ? p.permanentDay : p.permanentDayPrice;
      }
      if (fPermanentNight && (p.permanentNight !== undefined || p.permanentNightPrice !== undefined)) {
        fPermanentNight.value = p.permanentNight !== undefined ? p.permanentNight : p.permanentNightPrice;
      }
    },

    savePricing() {
      const fNormalDay = document.getElementById('priceNormalDay');
      const fDayOriginal = document.getElementById('priceDayOriginal');
      const fNormalNight = document.getElementById('priceNormalNight');
      const fPermanentDay = document.getElementById('pricePermanentDay');
      const fPermanentNight = document.getElementById('pricePermanentNight');

      const dayVal = Number(fNormalDay.value) || 550;
      const dayOrigVal = Number(fDayOriginal.value) || 600;
      const nightVal = Number(fNormalNight.value) || 900;
      const permDayVal = Number(fPermanentDay.value) || 500;
      const permNightVal = Number(fPermanentNight.value) || 850;

      const data = {
        normalDay: dayVal,
        dayPrice: dayVal,
        day: dayVal,
        dayOriginal: dayOrigVal,
        dayOriginalPrice: dayOrigVal,
        normalNight: nightVal,
        nightPrice: nightVal,
        night: nightVal,
        permanentDay: permDayVal,
        permanentDayPrice: permDayVal,
        permDay: permDayVal,
        permanentNight: permNightVal,
        permanentNightPrice: permNightVal,
        permNight: permNightVal,
        discount: 50,
        updatedAt: Date.now()
      };

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const self = this;
      const saveBtn = document.getElementById('savePricingBtn');
      self.setButtonLoading(saveBtn, true, 'Saving pricing...');

      db.ref('pricing').set(data).then(function () {
        self.setButtonLoading(saveBtn, false, 'Save Pricing Settings');
        self.pricing = data;
        self.toast('Pricing settings updated successfully!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(saveBtn, false, 'Save Pricing Settings');
        console.error('[Admin] Error saving pricing:', err);
        self.toast('Error saving pricing: ' + err.message, 'error');
      });
    },

    // =======================================================================
    // 10. Gallery Management
    // =======================================================================
    setupGalleryUploadHandlers() {
      const self = this;
      const dropZone = document.getElementById('galleryUploadZone');
      const fileInput = document.getElementById('galleryFileInput');
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
          const titleInput = document.getElementById('galleryTitleInput');
          const descInput = document.getElementById('galleryDescInput');
          const directUrlInput = document.getElementById('galleryUrlFallback');

          const title = titleInput ? titleInput.value.trim() : '';
          const desc = descInput ? descInput.value.trim() : '';
          const directUrl = directUrlInput ? directUrlInput.value.trim() : '';

          self.uploadMedia(self.selectedFileToUpload, title, desc, directUrl);
        });
      }
    },

    showSelectedFileName(fileName) {
      const fileDisplay = document.getElementById('fileSelectedDisplay');
      if (fileDisplay) {
        fileDisplay.textContent = 'Selected File: ' + fileName;
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
        const val = snapshot.val();
        self.gallery = [];

        if (val) {
          Object.keys(val).forEach(function (key) {
            const item = val[key];
            if (typeof item === 'object' && item !== null) {
              item.id = item.id || key;
              self.gallery.push(item);
            }
          });
        }

        self.gallery.sort((a, b) => (a.order || 0) - (b.order || 0));
        self.renderGalleryGrid();
      });
    },

    renderGalleryGrid() {
      const grid = document.getElementById('adminGalleryGrid');
      if (!grid) return;

      if (this.gallery.length === 0) {
        grid.innerHTML = '<p class="form-hint text-center py-4">No images in gallery yet.</p>';
        return;
      }

      let html = '<div class="admin-gallery-items-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1rem;">';
      const self = this;

      this.gallery.forEach(function (item, index) {
        const title = self.escapeHtml(item.title || 'Turf Photo');
        const imgSrc = item.url || item.thumbnail || '';
        const rawFallback = item.rawUrl || ('https://raw.githubusercontent.com/srpshouro/Ever-gain-demo/main/' + imgSrc);

        const mediaPreview = `<img src="${imgSrc}" alt="${title}" onerror="if (!this.dataset.fallbackTried && this.getAttribute('src') && this.getAttribute('src').indexOf('assets/images/') !== -1) { this.dataset.fallbackTried = '1'; this.src = '${rawFallback}'; }" style="width: 100%; height: 140px; object-fit: cover; border-radius: var(--radius-sm);">`;

        html += `
          <div class="card card-premium media-item-card" style="padding: 0.75rem;">
            ${mediaPreview}
            <div class="mt-2">
              <strong style="font-size: 0.95rem; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${title}</strong>
              <small class="text-muted">Image • Order: ${index + 1}</small>
            </div>
            <div class="action-buttons mt-3 d-flex justify-between">
              <div>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveMediaOrder('${item.id}', -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveMediaOrder('${item.id}', 1)" ${index === self.gallery.length - 1 ? 'disabled' : ''} title="Move Down">
                  <i class="fas fa-arrow-down"></i>
                </button>
              </div>
              <div>
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteMedia('${item.id}', '${item.githubPath || item.storagePath || ''}')" title="Delete Photo">
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

    uploadMedia(file, title, desc, directUrl) {
      const self = this;
      const uploadBtn = document.getElementById('galleryUploadBtn');

      if (!file && !directUrl) {
        this.toast('Please select an image file to upload.', 'warning');
        return;
      }

      self.setButtonLoading(uploadBtn, true, 'Uploading to GitHub...');

      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const resultStr = e.target.result;
            const base64Data = resultStr.split(',')[1];
            const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const targetFileName = Date.now() + '_' + cleanName;
            const targetPath = 'assets/images/' + targetFileName;

            let token = localStorage.getItem('eg_github_token');
            if (!token) {
              token = prompt('Enter your GitHub Personal Access Token to upload photos directly to assets/images/:');
              if (token && token.trim()) {
                token = token.trim();
                localStorage.setItem('eg_github_token', token);
              } else {
                self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
                self.toast('GitHub Token is required to save photos directly to the repository.', 'warning');
                return;
              }
            }

            const owner = 'srpshouro';
            const repo = 'Ever-gain-demo';
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${targetPath}`;

            fetch(apiUrl, {
              method: 'PUT',
              headers: {
                'Authorization': 'token ' + token,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
              },
              body: JSON.stringify({
                message: 'Upload gallery image: ' + targetFileName,
                content: base64Data,
                branch: 'main'
              })
            })
            .then(function (res) {
              if (!res.ok) {
                return res.json().then(function (errData) {
                  if (res.status === 401 || res.status === 403) {
                    localStorage.removeItem('eg_github_token');
                  }
                  throw new Error(errData.message || ('GitHub Status ' + res.status));
                });
              }
              return res.json();
            })
            .then(function () {
              const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/${targetPath}`;
              const itemTitle = title || cleanName.replace(/_/g, ' ').replace(/\.[^/.]+$/, '');
              self.saveMediaToDatabase(targetPath, rawUrl, itemTitle, desc, targetPath);
            })
            .catch(function (error) {
              console.error('[Admin] GitHub Upload Error:', error);
              self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
              self.toast('GitHub image upload failed: ' + error.message, 'error');
            });
          } catch (err) {
            self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
            console.error('[Admin] Processing error:', err);
            self.toast('Failed to process file: ' + err.message, 'error');
          }
        };

        reader.onerror = function () {
          self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
          self.toast('Failed to read the file.', 'error');
        };

        reader.readAsDataURL(file);
      } else if (directUrl) {
        self.saveMediaToDatabase(directUrl, directUrl, title || 'Turf Photo', desc, '');
      }
    },

    saveMediaToDatabase(url, rawUrl, title, desc, githubPath) {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      const uploadBtn = document.getElementById('galleryUploadBtn');

      if (!db) {
        self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
        self.toast('Database connection not found.', 'error');
        return;
      }

      const newRef = db.ref('gallery').push();
      const mediaItem = {
        id: newRef.key,
        url: url,
        rawUrl: rawUrl || url,
        title: title || 'Turf Photo',
        description: desc || '',
        type: 'image',
        githubPath: githubPath || '',
        order: this.gallery.length + 1,
        createdAt: Date.now()
      };

      newRef.set(mediaItem).then(function () {
        self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
        self.selectedFileToUpload = null;
        const form = document.getElementById('galleryUploadForm');
        if (form) form.reset();
        const fileDisplay = document.getElementById('fileSelectedDisplay');
        if (fileDisplay) {
          fileDisplay.textContent = '';
          fileDisplay.classList.add('hidden');
        }
        self.toast('Image uploaded to GitHub assets/images and added to Gallery!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(uploadBtn, false, 'Upload to Gallery');
        console.error('[Admin] Error saving media record:', err);
        self.toast('Error saving record to database: ' + err.message, 'error');
      });
    },

    deleteMedia(id, githubPath) {
      const self = this;
      this.showConfirm(
        'Delete Gallery Image',
        'Are you sure you want to delete this image from the gallery?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);

          if (db) {
            db.ref(`gallery/${id}`).remove().then(function () {
              self.toast('Image removed from gallery.', 'info');
            });
          }

          if (githubPath && githubPath.startsWith('assets/images/')) {
            const token = localStorage.getItem('eg_github_token');
            if (token) {
              const owner = 'srpshouro';
              const repo = 'Ever-gain-demo';
              const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${githubPath}`;

              fetch(apiUrl, {
                headers: {
                  'Authorization': 'token ' + token,
                  'Accept': 'application/vnd.github.v3+json'
                }
              })
              .then(res => res.ok ? res.json() : null)
              .then(fileInfo => {
                if (fileInfo && fileInfo.sha) {
                  return fetch(apiUrl, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': 'token ' + token,
                      'Content-Type': 'application/json',
                      'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                      message: 'Delete gallery image: ' + githubPath,
                      sha: fileInfo.sha,
                      branch: 'main'
                    })
                  });
                }
              })
              .catch(err => {
                console.warn('[Admin] GitHub delete error:', err);
              });
            }
          }
        }
      );
    },

    editMediaModal(id) {
      const item = this.gallery.find(m => m.id === id);
      if (!item) return;

      const self = this;
      this.openEditModal(
        'Edit Media Information',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editMediaTitle">Title</label>
            <input type="text" id="editMediaTitle" class="form-input" value="${self.escapeHtml(item.title || '')}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editMediaDesc">Description</label>
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
            self.toast('Media updated successfully.', 'success');
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
          title: 'Proper Footwear Required',
          description: 'Only approved turf shoes or rubber-soled sneakers are permitted on the ground. Metal spikes are strictly prohibited.',
          order: 1
        },
        {
          icon: 'fas fa-clock',
          title: 'Punctuality is Essential',
          description: 'Please arrive at least 10 minutes prior to your allocated slot. Overstaying into the next slot will incur additional charges.',
          order: 2
        },
        {
          icon: 'fas fa-ban-smoking',
          title: 'No Smoking or Food Allowed',
          description: 'Smoking, chewing betel leaf, and littering food items inside the turf pitch area are strictly forbidden.',
          order: 3
        },
        {
          icon: 'fas fa-handshake-angle',
          title: 'Respectful Behaviour & Fair Play',
          description: 'Foul language, aggressive behaviour, or fighting will lead to immediate expulsion from the arena.',
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
        container.innerHTML = '<p class="form-hint text-center py-4">No rules added yet.</p>';
        return;
      }

      let html = '<div class="rules-stack" style="display: flex; flex-direction: column; gap: 0.85rem;">';
      const self = this;

      this.rules.forEach(function (rule, index) {
        const title = self.escapeHtml(rule.title || '');
        const desc = self.escapeHtml(rule.description || '');
        const icon = rule.icon || 'fas fa-futbol';

        html += `
          <div class="card card-premium rule-item-card">
            <div class="rule-card-header">
              <div class="rule-card-title-wrap">
                <div class="card-icon" style="width: 38px; height: 38px; font-size: 1rem; flex-shrink: 0;">
                  <i class="${icon}"></i>
                </div>
                <h4 class="rule-card-title">${index + 1}. ${title}</h4>
              </div>
            </div>

            <div class="rule-card-body">
              <p class="rule-card-text">${desc}</p>
            </div>

            <div class="rule-card-footer">
              <div class="action-buttons">
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveRuleOrder('${rule.id}', -1)" ${index === 0 ? 'disabled' : ''} title="Move Up">
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.moveRuleOrder('${rule.id}', 1)" ${index === self.rules.length - 1 ? 'disabled' : ''} title="Move Down">
                  <i class="fas fa-arrow-down"></i>
                </button>
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.editRuleModal('${rule.id}')" title="Edit Rule">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteRule('${rule.id}')" title="Delete Rule">
                  <i class="fas fa-trash"></i> Delete
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
        this.toast('Rule title and description are required.', 'warning');
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
        self.toast('New rule added successfully!', 'success');
        const form = document.getElementById('addRuleForm');
        if (form) form.reset();
      });
    },

    editRuleModal(id) {
      const rule = this.rules.find(r => r.id === id);
      if (!rule) return;

      const self = this;
      this.openEditModal(
        'Edit Ground Rule',
        `
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleIcon">Icon (FontAwesome Class)</label>
            <input type="text" id="editRuleIcon" class="form-input" value="${self.escapeHtml(rule.icon || 'fas fa-futbol')}">
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleTitle">Title</label>
            <input type="text" id="editRuleTitle" class="form-input" value="${self.escapeHtml(rule.title || '')}" required>
          </div>
          <div class="form-group mb-2">
            <label class="form-label" for="editRuleDesc">Description</label>
            <textarea id="editRuleDesc" class="form-textarea" rows="3" required>${self.escapeHtml(rule.description || '')}</textarea>
          </div>
        `,
        function () {
          const newIcon = document.getElementById('editRuleIcon').value.trim();
          const newTitle = document.getElementById('editRuleTitle').value.trim();
          const newDesc = document.getElementById('editRuleDesc').value.trim();

          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`rules/${id}`).update({
            icon: newIcon || 'fas fa-futbol',
            title: newTitle,
            description: newDesc,
            updatedAt: Date.now()
          }).then(function () {
            self.toast('Rule updated successfully!', 'success');
            self.closeEditModal();
          });
        }
      );
    },

    deleteRule(id) {
      const self = this;
      this.showConfirm(
        'Delete Rule',
        'Are you sure you want to delete this rule?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`rules/${id}`).remove().then(function () {
            self.toast('Rule deleted.', 'info');
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
    // 12. Reviews Management (Approve, Delete, Realtime Badge)
    // =======================================================================
    loadReviewsAdmin() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const revRef = db.ref('reviews');
      this.listeners.push({ ref: revRef, event: 'value' });

      revRef.on('value', function (snapshot) {
        const val = snapshot.val();
        self.reviews = [];

        if (val) {
          Object.keys(val).forEach(function (key) {
            const item = val[key];
            if (typeof item === 'object' && item !== null) {
              item.id = item.id || key;
              self.reviews.push(item);
            }
          });
        }

        self.reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        let pendingCount = 0;
        let approvedCount = 0;
        self.reviews.forEach(function (r) {
          if (r.status === 'approved') approvedCount++;
          else pendingCount++;
        });

        const pendingBadge = document.getElementById('pendingReviewsBadge');
        if (pendingBadge) {
          if (pendingCount > 0) {
            pendingBadge.textContent = pendingCount;
            pendingBadge.classList.remove('hidden');
          } else {
            pendingBadge.classList.add('hidden');
          }
        }

        const countPending = document.getElementById('adminPendingReviewsCount');
        if (countPending) countPending.textContent = 'Pending: ' + pendingCount;

        const countApproved = document.getElementById('adminApprovedReviewsCount');
        if (countApproved) countApproved.textContent = 'Approved: ' + approvedCount;

        if (self.currentTab === 'reviews') {
          self.renderReviewsList();
        }
      }, function (err) {
        console.error('[Admin] Error loading reviews:', err);
      });
    },

    renderReviewsList() {
      const container = document.getElementById('adminReviewsList');
      if (!container) return;

      if (this.reviews.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-4">No player reviews submitted yet.</p>';
        return;
      }

      let html = '<div class="admin-reviews-grid" style="display: flex; flex-direction: column; gap: 1rem;">';
      const self = this;

      this.reviews.forEach(function (rev) {
        const author = self.escapeHtml(rev.author || rev.name || 'Player');
        const team = self.escapeHtml(rev.team || rev.location || '');
        const comment = self.escapeHtml(rev.comment || rev.text || '');
        const rating = Math.min(5, Math.max(1, parseInt(rev.rating, 10) || 5));
        const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
        const isApproved = rev.status === 'approved';

        let starsHtml = '';
        for (let i = 1; i <= 5; i++) {
          starsHtml += `<i class="fas fa-star" style="color: ${i <= rating ? '#fbbf24' : '#4b5563'}; margin-right: 2px;"></i>`;
        }

        html += `
          <div class="card card-premium" style="padding: 1rem; border-left: 4px solid ${isApproved ? 'var(--color-primary)' : '#f59e0b'};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <strong style="font-size: 1.05rem; color: var(--color-text-primary);">${author}</strong>
                  ${team ? `<small class="text-secondary">(${team})</small>` : ''}
                  <span class="badge ${isApproved ? 'badge-confirmed' : 'badge-pending'}">${isApproved ? 'Approved' : 'Pending Approval'}</span>
                </div>
                <div class="mt-1" style="font-size: 0.85rem;">
                  ${starsHtml}
                  <span class="text-secondary ml-2">${dateStr}</span>
                </div>
              </div>
              <div class="action-buttons">
                ${!isApproved ? `
                  <button type="button" class="btn btn-sm btn-approve-direct" onclick="AdminApp.approveReview('${rev.id}')" title="Approve & Publish to Website">
                    <i class="fas fa-check"></i> Approve
                  </button>
                ` : ''}
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteReview('${rev.id}')" title="Delete Review">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
            <div class="mt-2" style="color: var(--color-text-secondary); font-size: 0.95rem; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: var(--radius-sm);">
              "${comment}"
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    },

    approveReview(id) {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      db.ref('reviews/' + id).update({
        status: 'approved',
        approvedAt: Date.now()
      }).then(function () {
        self.toast('Review approved and published to website!', 'success');
      }).catch(function (err) {
        self.toast('Failed to approve review: ' + err.message, 'error');
      });
    },

    deleteReview(id) {
      const self = this;
      this.showConfirm(
        'Delete Review',
        'Are you sure you want to delete this review?',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref('reviews/' + id).remove().then(function () {
            self.toast('Review deleted successfully.', 'info');
          }).catch(function (err) {
            self.toast('Failed to delete review: ' + err.message, 'error');
          });
        }
      );
    },

    // =======================================================================
    // Direct Messages (Contact Page Inbox) Management
    // =======================================================================
    loadMessages() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const msgRef = db.ref('contactMessages');
      this.listeners.push({ ref: msgRef, event: 'value' });

      msgRef.on('value', function (snapshot) {
        const data = snapshot.val();
        self.messages = [];

        if (data) {
          Object.keys(data).forEach(function (key) {
            const item = data[key];
            if (typeof item === 'object' && item !== null) {
              item.id = item.id || key;
              self.messages.push(item);
            }
          });
        }

        // Sort newest first
        self.messages.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Update unread count badges
        const unreadCount = self.messages.filter(m => !m.read).length;
        const badge = document.getElementById('unreadMessagesBadge');
        const unreadDisplay = document.getElementById('adminUnreadMessagesCount');
        const totalDisplay = document.getElementById('adminTotalMessagesCount');

        if (badge) {
          badge.textContent = unreadCount;
          if (unreadCount > 0) {
            badge.classList.remove('hidden');
          } else {
            badge.classList.add('hidden');
          }
        }

        if (unreadDisplay) {
          unreadDisplay.textContent = 'Unread: ' + unreadCount;
        }
        if (totalDisplay) {
          totalDisplay.textContent = 'Total: ' + self.messages.length;
        }

        self.filterMessages();
      }, function (err) {
        console.error('[Admin] Error loading contact messages:', err);
      });
    },

    filterMessages() {
      const searchInput = document.getElementById('messageSearchInput');
      const statusFilter = document.getElementById('messageStatusFilter');

      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const filterStatus = statusFilter ? statusFilter.value : '';

      const filtered = this.messages.filter(function (m) {
        if (query) {
          const name = (m.name || '').toLowerCase();
          const phone = (m.phone || '').toLowerCase();
          const text = (m.message || '').toLowerCase();
          const subject = (m.subject || '').toLowerCase();
          if (!name.includes(query) && !phone.includes(query) && !text.includes(query) && !subject.includes(query)) {
            return false;
          }
        }

        if (filterStatus === 'unread' && m.read) return false;
        if (filterStatus === 'read' && !m.read) return false;

        return true;
      });

      this.renderMessages(filtered);
    },

    renderMessages(list) {
      const container = document.getElementById('adminMessagesList');
      if (!container) return;

      if (list.length === 0) {
        container.innerHTML = '<p class="form-hint text-center py-4">No direct messages found matching your criteria.</p>';
        return;
      }

      let html = '';
      const self = this;

      list.forEach(function (m) {
        const name = self.escapeHtml(m.name || 'Anonymous');
        const rawPhone = m.phone || '';
        const phone = rawPhone ? self.escapeHtml(rawPhone) : '-';
        const subject = self.escapeHtml(m.subject || 'General Inquiry');
        const text = self.escapeHtml(m.message || '');
        const isUnread = !m.read;
        const timeStr = m.createdAt ? new Date(m.createdAt).toLocaleString('en-US') : '-';

        html += `
          <div class="message-item-card ${isUnread ? 'unread' : ''}">
            <div class="message-card-header">
              <div>
                <span class="message-sender-name">
                  <i class="fas fa-user-circle text-primary"></i> ${name}
                  ${isUnread ? '<span class="badge badge-pending">New Message</span>' : '<span class="badge badge-confirmed">Read</span>'}
                </span>
                <div class="message-meta mt-1">
                  <i class="fas fa-tag text-info"></i> ${subject} &nbsp;|&nbsp;
                  <i class="fas fa-clock"></i> ${timeStr}
                </div>
              </div>

              ${rawPhone ? `
                <div class="d-flex gap-2">
                  <a href="tel:${rawPhone}" class="btn btn-sm btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">
                    <i class="fas fa-phone text-primary"></i> Call
                  </a>
                  <a href="https://wa.me/${rawPhone.replace(/\D/g, '')}" target="_blank" class="btn btn-sm btn-secondary" style="padding: 4px 10px; font-size: 0.8rem;">
                    <i class="fab fa-whatsapp text-primary"></i> WhatsApp
                  </a>
                </div>
              ` : ''}
            </div>

            <div class="message-snippet">
              ${text}
            </div>

            <div class="message-card-footer">
              <span class="text-muted" style="font-size: 0.82rem;">
                <i class="fas fa-mobile-screen"></i> ${phone}
              </span>
              <div class="action-buttons">
                <button type="button" class="btn btn-sm btn-secondary" onclick="AdminApp.viewMessageDetail('${m.id}')">
                  <i class="fas fa-eye"></i> View Full Details
                </button>
                <button type="button" class="btn btn-sm btn-danger" onclick="AdminApp.deleteMessage('${m.id}')">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    },

    viewMessageDetail(id) {
      const msg = this.messages.find(m => m.id === id);
      if (!msg) return;

      const body = document.getElementById('messageDetailModalBody');
      if (!body) return;

      const name = this.escapeHtml(msg.name || 'Anonymous');
      const rawPhone = msg.phone || '';
      const phone = rawPhone ? this.escapeHtml(rawPhone) : '-';
      const subject = this.escapeHtml(msg.subject || 'General Inquiry');
      const text = this.escapeHtml(msg.message || '');
      const timeStr = msg.createdAt ? new Date(msg.createdAt).toLocaleString('en-US') : '-';

      body.innerHTML = `
        <div class="card mb-3" style="background: var(--color-surface); padding: 1rem;">
          <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-user"></i> Sender Details</h4>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${rawPhone ? `<a href="tel:${rawPhone}" style="color: var(--color-primary-light); font-weight: 700;">${phone}</a>` : '-'}</p>
          <p><strong>Subject:</strong> <span class="badge badge-info">${subject}</span></p>
          <p><strong>Date & Time:</strong> <small class="text-muted">${timeStr}</small></p>
          ${rawPhone ? `
            <div class="d-flex gap-2 mt-3">
              <a href="tel:${rawPhone}" class="btn btn-sm btn-primary">
                <i class="fas fa-phone"></i> Call Sender
              </a>
              <a href="https://wa.me/${rawPhone.replace(/\D/g, '')}" target="_blank" class="btn btn-sm btn-secondary">
                <i class="fab fa-whatsapp text-primary"></i> Chat on WhatsApp
              </a>
            </div>
          ` : ''}
        </div>

        <div class="card" style="background: var(--color-surface); padding: 1rem;">
          <h4 style="color: var(--color-primary); margin-bottom: 0.5rem;"><i class="fas fa-message"></i> Message Content</h4>
          <div style="background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; word-break: break-word;">${text}</div>
        </div>
      `;

      const footer = document.getElementById('messageDetailModalFooter');
      if (footer) {
        footer.innerHTML = `
          <button type="button" class="btn btn-secondary" onclick="AdminApp.closeMessageModal()">Close</button>
          <button type="button" class="btn btn-danger" onclick="AdminApp.deleteMessage('${msg.id}'); AdminApp.closeMessageModal();"><i class="fas fa-trash"></i> Delete Message</button>
        `;
      }

      // Mark as read in Firebase
      if (!msg.read) {
        const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
        if (db) {
          db.ref(`contactMessages/${msg.id}`).update({ read: true }).catch(e => console.warn(e));
        }
      }

      const overlay = document.getElementById('messageDetailModalOverlay');
      if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('active');
      }
    },

    closeMessageModal() {
      const overlay = document.getElementById('messageDetailModalOverlay');
      if (overlay) {
        overlay.classList.add('hidden');
        overlay.classList.remove('active');
      }
    },

    deleteMessage(id) {
      const self = this;
      this.showConfirm(
        'Delete Customer Message',
        'Are you sure you want to permanently delete this message? This action cannot be undone.',
        function () {
          const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
          if (!db) return;

          db.ref(`contactMessages/${id}`).remove().then(function () {
            self.toast('Message deleted successfully', 'success');
          }).catch(function (err) {
            console.error('[Admin] Error deleting message:', err);
            self.toast('Error deleting message: ' + err.message, 'error');
          });
        }
      );
    },

    // =======================================================================
    // 13. Settings Management
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
      const fMapLink = document.getElementById('settingsMapLink');
      const fFb = document.getElementById('settingsSocialFacebook');

      if (fPhone && s.phone !== undefined) fPhone.value = s.phone;
      if (fWhatsapp && s.whatsapp !== undefined) fWhatsapp.value = s.whatsapp;
      if (fAddress && s.address !== undefined) fAddress.value = s.address;
      if (fMapLink && s.mapLink !== undefined) fMapLink.value = s.mapLink;
      if (fFb && s.socialFacebook !== undefined) fFb.value = s.socialFacebook;
    },

    saveSettings() {
      const fPhone = document.getElementById('settingsPhone');
      const fWhatsapp = document.getElementById('settingsWhatsapp');
      const fAddress = document.getElementById('settingsAddress');
      const fMapLink = document.getElementById('settingsMapLink');
      const fFb = document.getElementById('settingsSocialFacebook');

      let mapVal = fMapLink ? fMapLink.value.trim() : '';
      if (mapVal && !mapVal.startsWith('http://') && !mapVal.startsWith('https://')) {
        mapVal = 'https://' + mapVal;
      }

      const data = {
        phone: fPhone ? fPhone.value.trim() : '',
        whatsapp: fWhatsapp ? fWhatsapp.value.trim() : '',
        address: fAddress ? fAddress.value.trim() : '',
        mapLink: mapVal,
        socialFacebook: fFb ? fFb.value.trim() : '',
        updatedAt: Date.now()
      };

      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) return;

      const self = this;
      const saveBtn = document.getElementById('saveSettingsBtn');
      self.setButtonLoading(saveBtn, true, 'Saving settings...');

      db.ref('settings').update(data).then(function () {
        self.setButtonLoading(saveBtn, false, 'Save Settings');
        self.settings = Object.assign(self.settings, data);
        self.toast('Settings saved successfully!', 'success');
      }).catch(function (err) {
        self.setButtonLoading(saveBtn, false, 'Save Settings');
        console.error('[Admin] Error saving settings:', err);
        self.toast('Error saving settings: ' + err.message, 'error');
      });
    },

    seedDatabase() {
      const self = this;
      const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);
      if (!db) {
        self.toast('Firebase Database connection not found.', 'error');
        return;
      }

      self.showConfirm(
        'Initialize & Seed Database',
        'Are you sure you want to populate the Realtime Database with default pricing, slots, rules, and turf settings? Existing settings will be updated.',
        function () {
          const seedBtn = document.getElementById('seedDatabaseBtn');
          self.setButtonLoading(seedBtn, true, 'Seeding database...');

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
            address: 'Evergain Avenue, Birdal, Sonapur 3180',
            mapLink: 'https://maps.app.goo.gl/wP7QLcu8zdaeKqDt8?g_st=ac',
            hours: '24/7 Open',
            heroTitle: 'Your Ultimate Indoor Football Destination',
            heroSubtitle: 'Premium indoor football turf - book your game easily',
            announcement: '',
            socialFacebook: '',
            socialInstagram: ''
          };

          const defaultRules = {
            rule_1: { icon: 'fa-regular fa-clock', title: 'Be On Time', description: 'Arrive at the turf 10-15 minutes prior to your booked slot. Extension into subsequent slots cannot be accommodated.', order: 1 },
            rule_2: { icon: 'fa-solid fa-shoe-prints', title: 'Proper Footwear Required', description: 'Only approved turf shoes or flat indoor sneakers are permitted. Metal studs or cleats are strictly forbidden.', order: 2 },
            rule_3: { icon: 'fa-solid fa-ban-smoking', title: 'No Smoking or Vaping', description: 'Smoking, vaping, chewing tobacco, or consuming intoxicating substances on the premises is strictly forbidden.', order: 3 },
            rule_4: { icon: 'fa-solid fa-handshake', title: 'Respectful Behaviour & Fair Play', description: 'Maintain sportsmanship at all times. Show respect to referees, arena staff, and opposing players.', order: 4 },
            rule_5: { icon: 'fa-solid fa-futbol', title: 'Handle Equipment with Care', description: 'Treat goal nets, perimeter padding, floodlights, and supplied balls responsibly. Willful damage will be charged.', order: 5 },
            rule_6: { icon: 'fa-solid fa-trash-can', title: 'Keep the Turf Clean', description: 'Dispose of water bottles, tape, and wrappers in designated trash bins. Help us maintain clean surroundings.', order: 6 },
            rule_7: { icon: 'fa-solid fa-phone-volume', title: 'Contact Us for Assistance', description: 'For schedule changes, urgent queries, or assistance, contact our ground manager or WhatsApp helpline.', order: 7 }
          };

          const defaultGallery = {
            item_1: { title: 'EVER GAIN Turf Arena', description: 'FIFA-standard high-performance artificial grass surface under daylight', type: 'image', url: 'assets/images/1793521507642_1000025672.jpg', thumbnail: 'assets/images/1793521507642_1000025672.jpg', order: 1, createdAt: Date.now() },
            item_2: { title: 'Night Match Atmosphere', description: 'High-lux LED floodlights delivering daytime clarity for midnight football', type: 'image', url: 'assets/images/1793521696187_1000025671.jpg', thumbnail: 'assets/images/1793521696187_1000025671.jpg', order: 2, createdAt: Date.now() },
            item_3: { title: 'Pro Perimeter & Goalpost', description: 'Safety nets, padded sideboards, and heavy-duty goalposts', type: 'image', url: 'assets/images/1793521712602_1000025661.jpg', thumbnail: 'assets/images/1793521712602_1000025661.jpg', order: 3, createdAt: Date.now() },
            item_4: { title: 'Championship Pitch', description: 'Smooth, shock-absorbent infill preventing ankle injuries', type: 'image', url: 'assets/images/1793521726714_1000025663.jpg', thumbnail: 'assets/images/1793521726714_1000025663.jpg', order: 4, createdAt: Date.now() },
            item_5: { title: 'Spectator Lounge & Sideview', description: 'Clear viewing gallery with dugout seating for teams', type: 'image', url: 'assets/images/1793521738771_1000025662.jpg', thumbnail: 'assets/images/1793521738771_1000025662.jpg', order: 5, createdAt: Date.now() },
            item_6: { title: 'Arena Aerial & Perspective', description: 'Full pitch dimensions crafted for high-tempo 5-a-side and 7-a-side matches', type: 'image', url: 'assets/images/1793521749075_1000025664.jpg', thumbnail: 'assets/images/1793521749075_1000025664.jpg', order: 6, createdAt: Date.now() }
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
            self.setButtonLoading(seedBtn, false, 'Database Seeded Successfully');
            self.toast('Realtime Database seeded successfully with default data!', 'success');
            self.initializeDashboardData();
          }).catch(function (err) {
            self.setButtonLoading(seedBtn, false, 'Try Again');
            console.error('[Admin] Database seed error:', err);
            self.toast('Failed to seed database: ' + err.message, 'error');
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
      if (this.confirmOverlay) {
        this.confirmOverlay.classList.remove('hidden');
        this.confirmOverlay.classList.add('active');
      }
    },

    closeConfirmModal() {
      if (this.confirmOverlay) {
        this.confirmOverlay.classList.add('hidden');
        this.confirmOverlay.classList.remove('active');
      }
      this.pendingConfirmAction = null;
    },

    openEditModal(title, bodyHtml, onSave) {
      if (this.editModalTitle) this.editModalTitle.textContent = title;
      if (this.editModalBody) this.editModalBody.innerHTML = bodyHtml;

      if (this.saveEditModalBtn) {
        const newBtn = this.saveEditModalBtn.cloneNode(true);
        this.saveEditModalBtn.parentNode.replaceChild(newBtn, this.saveEditModalBtn);
        this.saveEditModalBtn = newBtn;

        this.saveEditModalBtn.addEventListener('click', function () {
          if (typeof onSave === 'function') {
            onSave();
          }
        });
      }

      if (this.editOverlay) {
        this.editOverlay.classList.remove('hidden');
        this.editOverlay.classList.add('active');
      }
    },

    closeEditModal() {
      if (this.editOverlay) {
        this.editOverlay.classList.add('hidden');
        this.editOverlay.classList.remove('active');
      }
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
        btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${text || 'Please wait...'}</span>`;
      } else {
        btn.classList.remove('btn-loading');
        btn.innerHTML = `<span>${text}</span>`;
      }
    },

    getStatusBadge(status) {
      const st = (status || 'pending').toLowerCase();
      switch (st) {
        case 'confirmed':
          return '<span class="badge badge-confirmed"><i class="fas fa-check-circle"></i> Confirmed</span>';
        case 'rejected':
          return '<span class="badge badge-rejected"><i class="fas fa-times-circle"></i> Rejected</span>';
        case 'cancelled':
          return '<span class="badge badge-cancelled"><i class="fas fa-ban"></i> Cancelled</span>';
        case 'active':
          return '<span class="badge badge-active"><i class="fas fa-check"></i> Active</span>';
        case 'paused':
          return '<span class="badge badge-paused"><i class="fas fa-pause"></i> Paused</span>';
        case 'terminated':
          return '<span class="badge badge-rejected"><i class="fas fa-stop"></i> Terminated</span>';
        case 'pending':
        default:
          return '<span class="badge badge-pending"><i class="fas fa-clock"></i> Pending</span>';
      }
    },

    getWeekdayName(val) {
      const days = {
        '0': 'Sunday',
        '1': 'Monday',
        '2': 'Tuesday',
        '3': 'Wednesday',
        '4': 'Thursday',
        '5': 'Friday',
        '6': 'Saturday',
        'sunday': 'Sunday',
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday'
      };
      return days[String(val).toLowerCase()] || String(val);
    },

    bengaliNum(num) {
      if (num === null || num === undefined) return '';
      return String(num);
    },

    formatPrice(amt) {
      if (typeof window.formatPrice === 'function') {
        return window.formatPrice(amt);
      }
      return '৳' + Math.round(Number(amt) || 0).toLocaleString('en-US');
    },

    formatDate(dateStr) {
      if (typeof window.formatDate === 'function') {
        return window.formatDate(dateStr);
      }
      return String(dateStr || '-');
    },

    formatTimeRange(st, et) {
      if (!st || !et) return '';
      return `${st} - ${et}`;
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
