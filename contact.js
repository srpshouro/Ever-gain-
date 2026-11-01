/**
 * EVER GAIN — Indoor Football Booking Platform
 * Contact Page JavaScript (contact.js)
 * 
 * Handles:
 * - Loading contact details from Firebase Realtime Database (/settings)
 * - Displaying phone, WhatsApp, address, working hours, and Google Map link
 * - Contact form validation & submission to /contactMessages
 * - Particle background and UI animations
 */

(function (window, document) {
  'use strict';

  // Default fallback values if Firebase is not connected or settings are unset
  const DEFAULT_SETTINGS = {
    phone: '০১৭০০-০০০০০০',
    phoneRaw: '+8801700000000',
    whatsapp: '০১৭০০-০০০০০০',
    whatsappRaw: '8801700000000',
    address: 'মিরপুর, ঢাকা - ১২১৬, বাংলাদেশ',
    hours: 'সকাল ৮:০০ - রাত ১২:০০',
    mapLink: 'https://maps.google.com/?q=Mirpur,Dhaka',
    socialFacebook: 'https://facebook.com',
    socialInstagram: 'https://instagram.com'
  };

  /**
   * Helper to safely display toast notifications.
   * Utilizes global showToast from firebase-config.js or provides custom fallback.
   */
  function displayToast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else if (window.EverGain && typeof window.EverGain.showToast === 'function') {
      window.EverGain.showToast(message, type);
    } else {
      console.log(`[Toast ${type || 'info'}]: ${message}`);
      alert(message);
    }
  }

  /**
   * Fetch contact info from Firebase /settings node and populate DOM.
   */
  function loadContactInfo() {
    const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);

    if (!db) {
      console.warn('[Contact] Firebase Database unavailable. Using default contact information.');
      populateContactDOM(DEFAULT_SETTINGS);
      return;
    }

    const settingsRef = db.ref('settings');

    settingsRef.once('value').then(function (snapshot) {
      const data = snapshot.val();
      if (data) {
        const mergedSettings = {
          phone: data.phone || DEFAULT_SETTINGS.phone,
          phoneRaw: data.phone ? data.phone.replace(/[^\d+]/g, '') : DEFAULT_SETTINGS.phoneRaw,
          whatsapp: data.whatsapp || DEFAULT_SETTINGS.whatsapp,
          whatsappRaw: data.whatsapp ? data.whatsapp.replace(/\D/g, '') : DEFAULT_SETTINGS.whatsappRaw,
          address: data.address || DEFAULT_SETTINGS.address,
          hours: data.hours || DEFAULT_SETTINGS.hours,
          mapLink: data.mapLink || DEFAULT_SETTINGS.mapLink,
          socialFacebook: data.socialFacebook || DEFAULT_SETTINGS.socialFacebook,
          socialInstagram: data.socialInstagram || DEFAULT_SETTINGS.socialInstagram
        };

        populateContactDOM(mergedSettings);
      } else {
        populateContactDOM(DEFAULT_SETTINGS);
      }
    }).catch(function (error) {
      console.warn('[Contact] Error reading settings from Firebase:', error);
      populateContactDOM(DEFAULT_SETTINGS);
    });
  }

  /**
   * Updates all contact elements on the page with provided settings.
   */
  function populateContactDOM(settings) {
    // 1. Phone Card & Footer
    const phoneDisplay = document.getElementById('contactPhoneDisplay');
    const phoneLink = document.getElementById('contactPhoneLink');
    const footerPhone = document.getElementById('footerPhoneText');

    if (phoneDisplay) phoneDisplay.textContent = settings.phone;
    if (phoneLink) {
      const cleanPhone = settings.phoneRaw.startsWith('+') ? settings.phoneRaw : ('+' + settings.phoneRaw);
      phoneLink.href = 'tel:' + cleanPhone;
    }
    if (footerPhone) footerPhone.textContent = settings.phone;

    // 2. WhatsApp Card & Links
    const whatsappDisplay = document.getElementById('contactWhatsappDisplay');
    const whatsappBtn = document.getElementById('contactWhatsappBtn');
    const footerWhatsapp = document.getElementById('footerSocialWhatsapp');

    if (whatsappDisplay) whatsappDisplay.textContent = settings.whatsapp;
    if (whatsappBtn) {
      const cleanWa = settings.whatsappRaw.replace(/\D/g, '');
      whatsappBtn.href = 'https://wa.me/' + cleanWa;
    }
    if (footerWhatsapp) {
      const cleanWa = settings.whatsappRaw.replace(/\D/g, '');
      footerWhatsapp.href = 'https://wa.me/' + cleanWa;
    }

    // 3. Address Card & Footer
    const addressDisplay = document.getElementById('contactAddressDisplay');
    const footerAddress = document.getElementById('footerAddressText');

    if (addressDisplay) addressDisplay.textContent = settings.address;
    if (footerAddress) footerAddress.textContent = settings.address;

    // 4. Hours Card & Footer
    const hoursDisplay = document.getElementById('contactHoursDisplay');
    const footerHours = document.getElementById('footerHoursText');

    if (hoursDisplay) hoursDisplay.textContent = settings.hours;
    if (footerHours) footerHours.textContent = settings.hours;

    // 5. Google Maps Link & Embed
    const mapLink = document.getElementById('contactMapLink');
    if (mapLink && settings.mapLink) {
      mapLink.href = settings.mapLink;
    }

    // 6. Social Links
    const footerFacebook = document.getElementById('footerSocialFacebook');
    if (footerFacebook && settings.socialFacebook) {
      footerFacebook.href = settings.socialFacebook;
    }

    const footerInstagram = document.getElementById('footerSocialInstagram');
    if (footerInstagram && settings.socialInstagram) {
      footerInstagram.href = settings.socialInstagram;
    }
  }

  /**
   * Validates contact form inputs.
   * Returns true if all fields are valid, false otherwise.
   */
  function validateContactForm() {
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhoneInput');
    const messageInput = document.getElementById('contactMessage');

    const nameError = document.getElementById('contactNameError');
    const phoneError = document.getElementById('contactPhoneError');
    const messageError = document.getElementById('contactMessageError');

    let isValid = true;

    // Name validation (minimum 2 chars)
    const nameVal = nameInput ? nameInput.value.trim() : '';
    const isNameValid = (typeof window.validateName === 'function')
      ? window.validateName(nameVal)
      : (nameVal.length >= 2);

    if (!isNameValid) {
      if (nameError) nameError.classList.remove('hidden');
      if (nameInput) nameInput.classList.add('input-error');
      isValid = false;
    } else {
      if (nameError) nameError.classList.add('hidden');
      if (nameInput) nameInput.classList.remove('input-error');
    }

    // Phone validation (BD phone format)
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    const isPhoneValid = (typeof window.validatePhone === 'function')
      ? window.validatePhone(phoneVal)
      : /^(?:\+?880|0)?1[3-9]\d{8}$/.test(phoneVal.replace(/[\s\-]/g, ''));

    if (!isPhoneValid) {
      if (phoneError) phoneError.classList.remove('hidden');
      if (phoneInput) phoneInput.classList.add('input-error');
      isValid = false;
    } else {
      if (phoneError) phoneError.classList.add('hidden');
      if (phoneInput) phoneInput.classList.remove('input-error');
    }

    // Message validation (minimum 5 chars)
    const messageVal = messageInput ? messageInput.value.trim() : '';
    if (!messageVal || messageVal.length < 5) {
      if (messageError) messageError.classList.remove('hidden');
      if (messageInput) messageInput.classList.add('input-error');
      isValid = false;
    } else {
      if (messageError) messageError.classList.add('hidden');
      if (messageInput) messageInput.classList.remove('input-error');
    }

    return isValid;
  }

  /**
   * Submits the contact message to Firebase Realtime Database (/contactMessages)
   */
  function submitContactForm(data) {
    const submitBtn = document.getElementById('contactSubmitBtn');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn-loading');
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>বার্তা পাঠানো হচ্ছে...</span>';
    }

    const db = window.db || (typeof firebase !== 'undefined' && firebase.database ? firebase.database() : null);

    if (!db) {
      // Simulate delay for graceful fallback if offline
      setTimeout(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-loading');
          submitBtn.innerHTML = originalBtnHtml;
        }
        displayToast('ডাটাবেজ সংযোগ পাওয়া যায়নি। সরাসরি ফোন বা হোয়াটসঅ্যাপে যোগাযোগ করার অনুরোধ রইল।', 'warning');
      }, 1000);
      return;
    }

    const messagesRef = db.ref('contactMessages');
    const newMessageRef = messagesRef.push();

    const timestamp = (typeof firebase !== 'undefined' && firebase.database && firebase.database.ServerValue)
      ? firebase.database.ServerValue.TIMESTAMP
      : Date.now();

    const messageRecord = {
      id: newMessageRef.key,
      name: data.name,
      phone: data.phone,
      subject: data.subject || 'সাধারণ তথ্য',
      message: data.message,
      createdAt: timestamp,
      read: false
    };

    newMessageRef.set(messageRecord)
      .then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-loading');
          submitBtn.innerHTML = originalBtnHtml;
        }

        // Reset form inputs
        const contactForm = document.getElementById('contactForm');
        if (contactForm) {
          contactForm.reset();
        }

        displayToast('আপনার বার্তাটি সফলভাবে পাঠানো হয়েছে! আমরা খুব শীঘ্রই যোগাযোগ করব।', 'success');
      })
      .catch(function (error) {
        console.error('[Contact] Error saving message to Firebase:', error);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('btn-loading');
          submitBtn.innerHTML = originalBtnHtml;
        }
        displayToast('বার্তা পাঠাতে ত্রুটি হয়েছে। অনুগ্রহ করে সরাসরি ফোন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।', 'error');
      });
  }

  /**
   * Sets up contact form event listeners.
   */
  function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Realtime clearing of error styles on input
    const nameInput = document.getElementById('contactName');
    const phoneInput = document.getElementById('contactPhoneInput');
    const messageInput = document.getElementById('contactMessage');

    if (nameInput) {
      nameInput.addEventListener('input', function () {
        const nameError = document.getElementById('contactNameError');
        if (nameError) nameError.classList.add('hidden');
        nameInput.classList.remove('input-error');
      });
    }

    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        const phoneError = document.getElementById('contactPhoneError');
        if (phoneError) phoneError.classList.add('hidden');
        phoneInput.classList.remove('input-error');
      });
    }

    if (messageInput) {
      messageInput.addEventListener('input', function () {
        const messageError = document.getElementById('contactMessageError');
        if (messageError) messageError.classList.add('hidden');
        messageInput.classList.remove('input-error');
      });
    }

    // Form submit listener
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!validateContactForm()) {
        displayToast('অনুগ্রহ করে ফরমের সঠিক তথ্য প্রদান করুন।', 'warning');
        return;
      }

      const subjectSelect = document.getElementById('contactSubject');
      const formData = {
        name: nameInput ? nameInput.value.trim() : '',
        phone: phoneInput ? phoneInput.value.trim() : '',
        subject: subjectSelect ? subjectSelect.value : 'সাধারণ তথ্য',
        message: messageInput ? messageInput.value.trim() : ''
      };

      submitContactForm(formData);
    });
  }

  /**
   * Initialize Contact Page.
   */
  function init() {
    // 1. Ensure navigation, particles, and animations are active
    if (window.EverGain) {
      if (typeof window.EverGain.initNavigation === 'function') {
        window.EverGain.initNavigation();
      }
      if (typeof window.EverGain.initParticles === 'function') {
        window.EverGain.initParticles('particleCanvas');
      }
      if (typeof window.EverGain.initScrollAnimations === 'function') {
        window.EverGain.initScrollAnimations();
      }
    }

    // 2. Fetch and populate contact information
    loadContactInfo();

    // 3. Attach contact form handler
    setupContactForm();

    // 4. Listen for language changes
    window.addEventListener('evergain:languageChanged', function () {
      if (window.EverGain && typeof window.EverGain.applyTranslations === 'function') {
        window.EverGain.applyTranslations();
      }
    });
  }

  // Export functions to window namespace for testing/extensibility
  window.ContactApp = {
    init: init,
    loadContactInfo: loadContactInfo,
    setupContactForm: setupContactForm,
    submitContactForm: submitContactForm,
    validateContactForm: validateContactForm
  };

  // Run init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
