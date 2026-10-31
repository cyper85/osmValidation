export interface ValidationResult {
  valid: boolean;
  /** Machine-readable code, e.g. "URL_LOCAL_ADDRESS". */
  code: string;
  /** Human-readable explanation. */
  message: string;
  /**
   * Corrected value, if the problem can be fixed automatically. A valid
   * result may carry one too, when the value works but has a preferred form.
   */
  suggestion?: string;
}

export function ok(code: string, message: string, suggestion?: string): ValidationResult {
  return withSuggestion({ valid: true, code, message }, suggestion);
}

export function fail(code: string, message: string, suggestion?: string): ValidationResult {
  return withSuggestion({ valid: false, code, message }, suggestion);
}

function withSuggestion(result: ValidationResult, suggestion: string | undefined): ValidationResult {
  if (suggestion !== undefined) {
    result.suggestion = suggestion;
  }
  return result;
}
