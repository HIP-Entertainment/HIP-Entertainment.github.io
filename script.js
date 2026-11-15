// ---------------------------------------------------------------------------
// SITE SETTINGS: the only lines you need to change.
//   web3formsKey  : access key from web3forms.com (sent to hipentr@gmail.com).
//                   Empty = the contact form opens the visitor's email app instead.
//   cfBeaconToken : token from Cloudflare > Analytics & Logs > Web Analytics.
//                   Empty = no analytics are loaded.
// Both values are public by design (they are visible in the page source).
// ---------------------------------------------------------------------------
const SITE = {
  web3formsKey: '',
  cfBeaconToken: '',
  contactEmail: 'hipentr@gmail.com',
};

// Phone menu: the Menu button shows or hides the nav links.
const menuBtn = document.querySelector('.menu-btn');
const links = document.getElementById('links');

if (menuBtn && links) {
  menuBtn.addEventListener('click', () => {
    menuBtn.setAttribute('aria-expanded', String(links.classList.toggle('open')));
  });
  // close the menu after a link is chosen
  links.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

// Analytics: Cloudflare Web Analytics (no cookies, no personal profiles).
if (SITE.cfBeaconToken) {
  const beacon = document.createElement('script');
  beacon.defer = true;
  beacon.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  beacon.setAttribute('data-cf-beacon', JSON.stringify({ token: SITE.cfBeaconToken }));
  document.head.appendChild(beacon);
}

// Contact form: sends through Web3Forms, or falls back to an email draft.
const form = document.getElementById('contact-form');

if (form) {
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type="submit"]');

  const show = (kind, html) => {
    status.className = 'form-status wide' + (kind ? ' is-' + kind : '');
    status.innerHTML = html;
  };
  const mailLink = '<a href="mailto:' + SITE.contactEmail + '">' + SITE.contactEmail + '</a>';

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // the browser has already checked the required fields
    const data = new FormData(form);
    const topic = data.get('topic') || 'General question';
    data.set('subject', 'Website message: ' + topic);

    if (data.get('botcheck')) return; // spam trap ticked: quietly drop it

    if (!SITE.web3formsKey) {
      const body = data.get('message') + '\n\n' + data.get('name') + ' (' + data.get('email') + ')';
      window.location.href = 'mailto:' + SITE.contactEmail +
        '?subject=' + encodeURIComponent('Website message: ' + topic) +
        '&body=' + encodeURIComponent(body);
      show('ok', 'Your email app should open with the message ready to send. If it doesn\'t, write to ' + mailLink + '.');
      return;
    }

    data.set('access_key', SITE.web3formsKey);
    button.disabled = true;
    show('', 'Sending...');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(Object.fromEntries(data)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.message || 'HTTP ' + res.status);
      form.reset();
      show('ok', 'Thanks! Your message is on its way. We\'ll reply by email.');
    } catch (err) {
      show('error', 'Sorry, the message could not be sent (' + String(err.message).replace(/[<>&]/g, '') + '). Please try again or email ' + mailLink + '.');
    } finally {
      button.disabled = false;
    }
  });
}
