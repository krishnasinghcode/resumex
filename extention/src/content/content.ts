import { parseForm } from './formParser';
import { fillForm, FillInstruction } from './formFiller';

console.log('🔧 AutoVault Extension Content Script Loaded');

// ─── Listen for messages from popup/background ───────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PARSE_FORM') {
    const parsedForm = parseForm();

    if (!parsedForm) {
      sendResponse({ success: false, error: 'No form found on this page' });
      return;
    }

    // Send back field metadata (without DOM elements)
    sendResponse({
      success: true,
      form: {
        url: parsedForm.url,
        title: parsedForm.title,
        fields: parsedForm.fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          placeholder: f.placeholder,
          required: f.required,
          value: f.value,
        })),
      },
    });

    return true; // Keep channel open for async response
  }

  if (message.type === 'FILL_FORM') {
    const { instructions } = message as { instructions: FillInstruction[] };
    const parsedForm = parseForm();

    if (!parsedForm) {
      sendResponse({ success: false, error: 'No form found' });
      return;
    }

    const filledCount = fillForm(parsedForm.fields, instructions);

    sendResponse({
      success: true,
      filledCount,
      totalFields: instructions.length,
    });

    return true;
  }
});

// ─── Auto-detect forms on page load ──────────────────────────────────────────

window.addEventListener('load', () => {
  const form = parseForm();

  if (form) {
    console.log('📋 Form detected:', form.title, `(${form.fields.length} fields)`);

    // Show badge or notification
    chrome.runtime.sendMessage({
      type: 'FORM_DETECTED',
      formTitle: form.title,
      fieldCount: form.fields.length,
    });
  }
});