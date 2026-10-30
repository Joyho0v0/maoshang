type HtmlElement = InstanceType<typeof globalThis.HTMLElement>;

export const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

let nextUiId = 0;

export function createUiId(prefix: string): string {
  nextUiId += 1;
  return `${prefix}-${nextUiId}`;
}

export function getFocusableElements(container: HtmlElement): HtmlElement[] {
  return [...container.querySelectorAll<HtmlElement>(FOCUSABLE_SELECTOR)].filter((element) => {
    if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false;
    if (element.matches(':disabled')) return false;
    return element.getAttribute('tabindex') !== '-1';
  });
}

export function focusFirst(container: HtmlElement): void {
  (getFocusableElements(container)[0] ?? container).focus();
}

export function trapFocus(container: HtmlElement, event: globalThis.KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) {
    event.preventDefault();
    container.focus();
    return;
  }
  const current = globalThis.document.activeElement as HtmlElement | null;
  const index = focusable.indexOf(current as HtmlElement);
  const nextIndex = event.shiftKey
    ? index <= 0 ? focusable.length - 1 : index - 1
    : index === focusable.length - 1 ? 0 : index + 1;
  event.preventDefault();
  focusable[nextIndex]?.focus();
}

export function restoreFocus(element: HtmlElement | null): void {
  if (element?.isConnected) element.focus();
}
