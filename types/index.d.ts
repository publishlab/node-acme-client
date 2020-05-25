/**
 * acme-client type definitions
 */

import { AxiosInstance } from 'axios';
import * as rfc8555 from './rfc8555';

export type PrivateKeyBuffer = Buffer;
export type PublicKeyBuffer = Buffer;
export type CertificateBuffer = Buffer;
export type CsrBuffer = Buffer;

export type PrivateKeyString = string;
export type PublicKeyString = string;
export type CertificateString = string;
export type CsrString = string;


/**
 * Augmented ACME interfaces
 */

export interface Order extends rfc8555.Order {
    url: string;
}

export interface Authorization extends rfc8555.Authorization {
    url: string;
}


/**
 * Client
 */

export interface ClientOptions {
    directoryUrl: string;
    accountKey: PrivateKeyBuffer | PrivateKeyString;
    accountUrl?: string;
    backoffAttempts?: number;
    backoffMin?: number;
    backoffMax?: number;
}

export interface ClientAutoOptions {
    csr: CsrBuffer | CsrString;
    challengeCreateFn: (authz: Authorization, challenge: rfc8555.Challenge, keyAuthorization: string) => Promise<any>;
    challengeRemoveFn: (authz: Authorization, challenge: rfc8555.Challenge, keyAuthorization: string) => Promise<any>;
    email?: string;
    termsOfServiceAgreed?: boolean;
    skipChallengeVerification?: boolean;
    challengePriority?: string[];
}

export class Client {
    constructor(opts: ClientOptions);
    getTermsOfServiceUrl(): Promise<string>;
    getAccountUrl(): string;
    createAccount(data?: rfc8555.AccountCreateRequest): Promise<rfc8555.Account>;
    updateAccount(data?: rfc8555.AccountUpdateRequest): Promise<rfc8555.Account>;
    updateAccountKey(newAccountKey: PrivateKeyBuffer | PrivateKeyString, data?: object): Promise<rfc8555.Account>;
    createOrder(data: rfc8555.OrderCreateRequest): Promise<Order>;
    finalizeOrder(order: Order, csr: CsrBuffer | CsrString): Promise<Order>;
    getAuthorizations(order: Order): Promise<Authorization[]>;
    deactivateAuthorization(authz: Authorization): Promise<Authorization>;
    getChallengeKeyAuthorization(challenge: rfc8555.Challenge): Promise<string>;
    verifyChallenge(authz: Authorization, challenge: rfc8555.Challenge): Promise<boolean>;
    completeChallenge(challenge: rfc8555.Challenge): Promise<rfc8555.Challenge>;
    waitForValidStatus<T = Order | Authorization | rfc8555.Challenge>(item: T): Promise<T>;
    getCertificate(order: Order): Promise<string>;
    revokeCertificate(cert: CertificateBuffer | CertificateString, data?: rfc8555.CertificateRevocationRequest): Promise<void>;
    auto(opts: ClientAutoOptions): Promise<string>;
}


/**
 * Directory URLs
 */

export const directory: {
    letsencrypt: {
        staging: string,
        production: string
    }
};


/**
 * Crypto
 */

export interface CsrDomains {
    commonName: string;
    altNames: string[];
}

export interface CertificateInfo {
    domains: CsrDomains;
    notAfter: Date;
    notBefore: Date;
}

export interface CsrOptions {
    keySize?: number;
    commonName?: string;
    altNames?: string[];
    country?: string;
    state?: string;
    locality?: string;
    organization?: string;
    organizationUnit?: string;
    emailAddress?: string;
}

export interface CryptoInterface {
    createPrivateKey(size?: number): Promise<PrivateKeyBuffer>;
    createPublicKey(key: PrivateKeyBuffer | PrivateKeyString): Promise<PublicKeyBuffer>;
    getModulus(input: PrivateKeyBuffer | PrivateKeyString | PublicKeyBuffer | PublicKeyString | CertificateBuffer | CertificateString | CsrBuffer | CsrString): Promise<Buffer>;
    getPublicExponent(input: PrivateKeyBuffer | PrivateKeyString | PublicKeyBuffer | PublicKeyString | CertificateBuffer | CertificateString | CsrBuffer | CsrString): Promise<Buffer>;
    readCsrDomains(csr: CsrBuffer | CsrString): Promise<CsrDomains>;
    readCertificateInfo(cert: CertificateBuffer | CertificateString): Promise<CertificateInfo>;
    createCsr(data: CsrOptions, key?: PrivateKeyBuffer | PrivateKeyString): Promise<[PrivateKeyBuffer, CsrBuffer]>;
}

export const forge: CryptoInterface;


/**
 * Axios
 */

export const axios: AxiosInstance;
