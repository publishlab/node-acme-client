/**
 * Account
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.1.2
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.3
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.3.2
 */

export interface Account {
    status: 'valid' | 'deactivated' | 'revoked';
    orders: string;
    contact?: string[];
    termsOfServiceAgreed?: boolean;
    externalAccountBinding?: object;
}

export interface AccountCreateRequest {
    contact?: string[];
    termsOfServiceAgreed?: boolean;
    onlyReturnExisting?: boolean;
    externalAccountBinding?: object;
}

export interface AccountUpdateRequest {
    status?: string;
    contact?: string[];
    termsOfServiceAgreed?: boolean;
}

/**
 * Order
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.1.3
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.4
 */

export interface Order {
    status: 'pending' | 'ready' | 'processing' | 'valid' | 'invalid';
    identifiers: Identifier[];
    authorizations: string[];
    finalize: string;
    expires?: string;
    notBefore?: string;
    notAfter?: string;
    error?: object;
    certificate?: string;
    replaces?: string;
}

export interface OrderCreateRequest {
    identifiers: Identifier[];
    notBefore?: string;
    notAfter?: string;
    replaces?: string;
}

/**
 * Authorization
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.1.4
 */

export interface Authorization {
    identifier: Identifier;
    status: 'pending' | 'valid' | 'invalid' | 'deactivated' | 'expired' | 'revoked';
    challenges: Challenge[];
    expires?: string;
    wildcard?: boolean;
}

export interface Identifier {
    type: string;
    value: string;
}

/**
 * Challenge
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-8
 * https://datatracker.ietf.org/doc/html/rfc8555#section-8.3
 * https://datatracker.ietf.org/doc/html/rfc8555#section-8.4
 * https://datatracker.ietf.org/doc/html/rfc8737#section-3
 */

export interface ChallengeAbstract {
    type: string;
    url: string;
    status: 'pending' | 'processing' | 'valid' | 'invalid';
    validated?: string;
    error?: object;
}

export interface Http01Challenge extends ChallengeAbstract {
    type: 'http-01';
    token: string;
}

export interface Dns01Challenge extends ChallengeAbstract {
    type: 'dns-01';
    token: string;
}

export interface TlsAlpn01Challenge extends ChallengeAbstract {
    type: 'tls-alpn-01';
    token: string;
}

export type Challenge = Http01Challenge | Dns01Challenge | TlsAlpn01Challenge;

/**
 * Certificate
 *
 * https://datatracker.ietf.org/doc/html/rfc8555#section-7.6
 */

export enum CertificateRevocationReason {
    Unspecified = 0,
    KeyCompromise = 1,
    CACompromise = 2,
    AffiliationChanged = 3,
    Superseded = 4,
    CessationOfOperation = 5,
    CertificateHold = 6,
    RemoveFromCRL = 8,
    PrivilegeWithdrawn = 9,
    AACompromise = 10,
}

export interface CertificateRevocationRequest {
    reason?: CertificateRevocationReason;
}

/**
 * Certificate ACME Renewal Information (ARI)
 *
 * https://datatracker.ietf.org/doc/html/draft-ietf-acme-ari
 */

export interface CertificateRenewalWindow {
    start: string;
    end: string;
}

export interface CertificateRenewalInfo {
    suggestedWindow: CertificateRenewalWindow;
    explanationURL?: string;
}
