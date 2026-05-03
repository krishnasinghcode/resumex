import { ParsedField } from './formParser';

// ─── Form Filler ─────────────────────────────────────────────────────────────
// Fills form fields with matched data

export interface FillInstruction {
  fieldId: string;
  value: any;
}

export function fillField(field: ParsedField, value: any): boolean {
  try {
    const element = field.element;

    // Handle different input types
    if (element.tagName === 'SELECT') {
      const selectEl = element as HTMLSelectElement;
      // Try to match option by value or text
      const options = Array.from(selectEl.options);
      const matchingOption = options.find(
        (opt) => opt.value === value || opt.textContent?.trim() === value
      );

      if (matchingOption) {
        selectEl.value = matchingOption.value;
        triggerChange(element);
        return true;
      }
      return false;
    }

    if (field.type === 'date' && value instanceof Date) {
      element.value = value.toISOString().split('T')[0];
      triggerChange(element);
      return true;
    }

    if (field.type === 'checkbox') {
      (element as HTMLInputElement).checked = Boolean(value);
      triggerChange(element);
      return true;
    }

    // Default: text input
    element.value = String(value);
    triggerChange(element);
    return true;
  } catch (error) {
    console.error(`Failed to fill field ${field.id}:`, error);
    return false;
  }
}

export function fillForm(fields: ParsedField[], instructions: FillInstruction[]): number {
  let filledCount = 0;

  for (const instruction of instructions) {
    const field = fields.find((f) => f.id === instruction.fieldId);
    if (field && fillField(field, instruction.value)) {
      filledCount++;
    }
  }

  return filledCount;
}

// Trigger input/change events so the form knows the field was updated
function triggerChange(element: HTMLElement): void {
  const events = ['input', 'change', 'blur'];

  events.forEach((eventType) => {
    const event = new Event(eventType, { bubbles: true });
    element.dispatchEvent(event);
  });

  // For React/Vue forms, also trigger native setter
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (nativeInputValueSetter && element instanceof HTMLInputElement) {
    nativeInputValueSetter.call(element, element.value);
  }
}