(function () {
  'use strict';

  const form = document.getElementById('form');
  if (!form) return;

  const whatsappNumber = form.querySelector('#wanumber');
  if (whatsappNumber) {
    whatsappNumber.addEventListener('input', function () {
      const original = this.value;
      const caret = this.selectionStart;
      this.value = original.replace(/[^0-9]/g, '');
      if (caret !== null) {
        const nextCaret = original.slice(0, caret).replace(/[^0-9]/g, '').length;
        this.setSelectionRange(nextCaret, nextCaret);
      }
    });
  }

  let sending = false;
  const button = form.querySelector('#submitForm');
  const loading = form.querySelector('.loading');
  const errorMessage = form.querySelector('.error-message');
  const sentMessage = form.querySelector('.sent-message');
  [loading, errorMessage, sentMessage].forEach(element => {
    if (element) element.setAttribute('role', 'status');
  });

  function show(element, visible) {
    if (element) element.classList.toggle('d-block', visible);
  }

  function fieldName(field) {
    const label = field.labels && field.labels[0];
    const prompt = field.querySelector && field.querySelector('option[value=""]');
    return (label && label.textContent.trim()) || field.getAttribute('placeholder') ||
      (prompt && prompt.textContent.trim()) || field.name || 'Required field';
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (sending) return;

    show(errorMessage, false);
    show(sentMessage, false);
    if (!form.checkValidity()) {
      const invalidFields = Array.from(form.elements).filter(field => field.willValidate && !field.validity.valid);
      if (errorMessage) {
        errorMessage.textContent = 'Please check these fields: ' + invalidFields.map(field =>
          fieldName(field) + ' — ' + field.validationMessage
        ).join(' ');
      }
      show(errorMessage, true);
      return;
    }

    const originalButtonText = button.textContent;
    sending = true;
    button.disabled = true;
    button.textContent = 'Sending...';
    show(loading, true);

    try {
      if (!window.emailjs) throw new Error('Email service could not load. Please refresh and try again.');

      const data = new FormData(form);
      const get = name => String(data.get(name) || '').trim();
      const priorities = (get('priorityInCars') || get('shortlistedCars')).split(/[,\n]+/).map(value => value.trim()).filter(Boolean);
      const phone = get('whatsappNumber');
      const phoneParts = phone.match(/^(\+\d{1,3})[\s-]+(.+)$/);
      const state = get('state') || get('inputState');
      const city = get('inputDistrict') || get('city');
      const cars = Array.from(form.querySelectorAll('.carSelectImgCheckbox:checked'), checkbox => checkbox.value).join(', ');
      const typeOfCar = get('typeOfCar') || 'Not provided';
      const params = Object.fromEntries(data.entries());
      Object.assign(params, {
        countryCode: get('countryCode') || (phoneParts ? phoneParts[1] : ''),
        wanumber: get('wanumber') || (phoneParts ? phoneParts[2] : (phone || 'Not provided')),
        city: city || 'Not provided',
        state: state && state !== 'SelectState' ? state : 'Not provided',
        country: get('country') || 'Not provided',
        priorityInCars1: get('priorityInCars1') || priorities[0] || 'Not provided',
        priorityInCars2: get('priorityInCars2') || priorities[1] || 'Not provided',
        priorityInCars3: get('priorityInCars3') || priorities.slice(2).join(', ') || 'Not provided',
        maximumPeopleTravelling: get('maximumPeopleTravelling') || 'Not provided',
        minBudget: get('minBudget') || get('minBudgetSlider'),
        maxBudget: get('maxBudget') || get('maxBudgetSlider'),
        carType: cars || 'Not provided',
        typeOfCar: typeOfCar,
        message: [
          get('message'),
          get('subject') && 'Subject: ' + get('subject'),
          'Car body styles: ' + (cars || 'Not provided'),
          'Type of car (new/used): ' + typeOfCar,
          get('exactBuyingBudget') && 'Exact buying budget: ' + get('exactBuyingBudget')
        ].filter(Boolean).join('\n\n')
      });

      await window.emailjs.send('service_o66gncj', 'template_dw52q9g', params, {
        publicKey: '_T12Ev8j2h7O_ytSF'
      });
      show(sentMessage, true);
    } catch (error) {
      if (errorMessage) errorMessage.textContent = 'Unable to send your enquiry. ' + (error.text || error.message || 'Please try again.');
      show(errorMessage, true);
    } finally {
      sending = false;
      button.disabled = false;
      button.textContent = originalButtonText;
      show(loading, false);
    }
  });

  // Validate in the handler so errors are also displayed below the button.
  form.noValidate = true;
})();
