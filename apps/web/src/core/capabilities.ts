export interface CapabilityCheck {
  readonly capabilities: readonly string[];
  readonly required?: string | readonly string[];
  readonly mode?: 'all' | 'any';
  readonly allowedTransitions?: readonly string[];
  readonly transition?: string;
}

/** Authorization display is driven by server-provided capabilities/transitions. */
export function canUseCapability(check: CapabilityCheck): boolean {
  const required = check.required === undefined
    ? []
    : typeof check.required === 'string' ? [check.required] : check.required;
  const hasCapability = check.mode === 'any'
    ? required.some((item) => check.capabilities.includes(item))
    : required.every((item) => check.capabilities.includes(item));
  if (!hasCapability) return false;
  if (check.transition !== undefined) {
    return check.allowedTransitions?.includes(check.transition) ?? false;
  }
  return true;
}
