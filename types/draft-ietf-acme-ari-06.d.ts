export interface OrderCreateRequest {
    replaces?: string;
}

export interface RenewalInfo {
    suggestedWindow: SuggestedWindow;
    explanationURL?: string;
}

export interface SuggestedWindow {
    start: string;
    end: string;
}