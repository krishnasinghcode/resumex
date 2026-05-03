// ─── Form Parser ─────────────────────────────────────────────────────────────
// Extracts fields from Google Forms and other standard forms

export interface ParsedField {
  id: string;
  name: string;
  type: string;
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  placeholder?: string;
  required?: boolean;
  value?: string;
}

export interface ParsedForm {
  url: string;
  title: string;
  fields: ParsedField[];
}

// Detect if current page is a Google Form
export function isGoogleForm(): boolean {
  return window.location.hostname.includes('docs.google.com') && 
         window.location.pathname.includes('/forms/');
}

// Parse Google Form fields
export function parseGoogleForm(): ParsedForm | null {
  try {
    const title = document.querySelector('.freebirdFormviewerViewHeaderTitle')?.textContent || 'Untitled Form';
    const fields: ParsedField[] = [];

    // Google Forms structure: each question is in a div with specific class
    const questionDivs = document.querySelectorAll('[role="listitem"]');

    questionDivs.forEach((questionDiv, index) => {
      // Get question label
      const labelElement = questionDiv.querySelector('[role="heading"]') as HTMLElement;
      if (!labelElement) return;

      const label = labelElement.textContent?.trim() || `Field ${index + 1}`;
      const isRequired = questionDiv.querySelector('[aria-label*="Required"]') !== null;

      // Find input element(s)
      const textInput = questionDiv.querySelector('input[type="text"]') as HTMLInputElement;
      const emailInput = questionDiv.querySelector('input[type="email"]') as HTMLInputElement;
      const telInput = questionDiv.querySelector('input[type="tel"]') as HTMLInputElement;
      const dateInput = questionDiv.querySelector('input[type="date"]') as HTMLInputElement;
      const textarea = questionDiv.querySelector('textarea') as HTMLTextAreaElement;
      const select = questionDiv.querySelector('select') as HTMLSelectElement;

      const element = textInput || emailInput || telInput || dateInput || textarea || select;

      if (element) {
        const fieldType = element.type || 'text';

        fields.push({
          id: element.id || `field_${index}`,
          name: label,
          type: fieldType,
          element: element,
          placeholder: element.placeholder || undefined,
          required: isRequired,
          value: element.value || undefined,
        });
      }
    });

    return {
      url: window.location.href,
      title,
      fields,
    };
  } catch (error) {
    console.error('Failed to parse Google Form:', error);
    return null;
  }
}

// Parse standard HTML forms (fallback)
export function parseStandardForm(): ParsedForm | null {
  try {
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) return null;

    // Take the first form (or largest one)
    const form = forms[0];
    const title = document.title || 'Form';
    const fields: ParsedField[] = [];

    const inputs = form.querySelectorAll('input, textarea, select');

    inputs.forEach((element, index) => {
      const el = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      // Skip hidden, submit, button fields
      if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button') {
        return;
      }

      // Try to find associated label
      let label = '';
      if (el.id) {
        const labelElement = form.querySelector(`label[for="${el.id}"]`);
        label = labelElement?.textContent?.trim() || '';
      }

      // Fallback: use placeholder or name attribute
      if (!label) {
        label = el.placeholder || el.name || `Field ${index + 1}`;
      }

      fields.push({
        id: el.id || el.name || `field_${index}`,
        name: label,
        type: el.type || 'text',
        element: el,
        placeholder: el.placeholder || undefined,
        required: el.required,
        value: el.value || undefined,
      });
    });

    return {
      url: window.location.href,
      title,
      fields,
    };
  } catch (error) {
    console.error('Failed to parse standard form:', error);
    return null;
  }
}

// Main parser - auto-detects form type
export function parseForm(): ParsedForm | null {
  if (isGoogleForm()) {
    return parseGoogleForm();
  }
  return parseStandardForm();
}