/**
 * Account
 *
 * https://tools.ietf.org/html/rfc8555#section-7.1.2
 * https://tools.ietf.org/html/rfc8555#section-7.3
 * https://tools.ietf.org/html/rfc8555#section-7.3.2
 */

import { Interface } from "readline";

export interface Account {
    status: 'valid' | 'deactivated' | 'revoked';
    contact?: string[];
    termsOfServiceAgreed?: boolean;
    externalAccountBinding?: object;
    orders: string;
}

export interface AccountCreateRequest {
    contact?: string[];
    termsOfServiceAgreed?: boolean;
    onlyReturnExisting?: boolean;
    externalAccountBinding?: ExternalAccountBinding;
}

export interface AccountUpdateRequest {
    status?: string;
    contact?: string[];
    termsOfServiceAgreed?: boolean;
}

/**
 * External Account Binding
 * https://tools.ietf.org/html/rfc8555#section-7.3.4
 * https://ietf-wg-acme.github.io/acme/draft-ietf-acme-acme.html#rfc.section.7.3.4
 */
export interface ExternalAccountBinding {
    /**
     * Contains the base64 encoded instance of
     * ExternalAccountBindingProtectedHeader
     */
    protected: string;
    /**
     * Base64 encoded public key of account key ('jwk' in outer JWS)
     */
    payload: string;
    /**
     * The “signature” field of the JWS will contain the
     * MAC value computed with the MAC key provided by the CA
     */
    signature: string;
}
/**
 * Contents of the base64 encoded JWS for ExternalAccountBinding
 */
export interface ExternalAccountBindingProtectedHeader {
    /** field MUST indicate a MAC-based algorithm. Usually 'HS256' */
    alg: string;
    /** The “kid” field MUST contain the key identifier provided by the CA */
    kid: string;
    /**
     * The 'url' field MUST be set to the same value as the outer JWS
     * i.e. https://example.com/acme/new-account
     */
    url: string;
}

/**
 * Order
 *
 * https://tools.ietf.org/html/rfc8555#section-7.1.3
 * https://tools.ietf.org/html/rfc8555#section-7.4
 */

export interface Order {
    status: 'pending' | 'ready' | 'processing' | 'valid' | 'invalid';
    expires?: string;
    identifiers: Identifier[];
    notBefore?: string;
    notAfter?: string;
    error?: object;
    authorizations: string[];
    finalize: string;
    certificate?: string;
}

export interface OrderCreateRequest {
    identifiers: Identifier[];
    notBefore?: string;
    notAfter?: string;
}


/**
 * Authorization
 *
 * https://tools.ietf.org/html/rfc8555#section-7.1.4
 */

export interface Authorization {
    identifier: Identifier;
    status: 'pending' | 'valid' | 'invalid' | 'deactivated' | 'expired' | 'revoked';
    expires?: string;
    challenges: Challenge[];
    wildcard?: boolean;
}

export interface Identifier {
    type: string;
    value: string;
}


/**
 * Challenge
 *
 * https://tools.ietf.org/html/rfc8555#section-8
 * https://tools.ietf.org/html/rfc8555#section-8.3
 * https://tools.ietf.org/html/rfc8555#section-8.4
 */

export interface ChallengeAbstract {
    type: string;
    url: string;
    status: 'pending' | 'processing' | 'valid' | 'invalid';
    validated?: string;
    error?: object;
}

export interface HttpChallenge extends ChallengeAbstract {
    type: 'http-01';
    token: string;
}

export interface DnsChallenge extends ChallengeAbstract {
    type: 'dns-01';
    token: string;
}

export type Challenge = HttpChallenge | DnsChallenge;


/**
 * Certificate
 *
 * https://tools.ietf.org/html/rfc8555#section-7.6
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
