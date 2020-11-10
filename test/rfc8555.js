/**
 * ACME assertions
 */

const { assert } = require('chai');

const spec = {};
module.exports = spec;


/**
 * Account
 */

spec.account = (obj) => {
    assert.isObject(obj);

    assert.isString(obj.status);
    assert.include(['valid', 'deactivated', 'revoked'], obj.status);

    assert.isString(obj.orders);

    if ('contact' in obj) {
        assert.isArray(obj.contact);
        obj.contact.forEach((c) => assert.isString(c));
    }

    if ('termsOfServiceAgreed' in obj) {
        assert.isBoolean(obj.termsOfServiceAgreed);
    }

    if ('externalAccountBinding' in obj) {
        assert.isObject(obj.externalAccountBinding);
    }
};


/**
 * Order
 */

spec.order = (obj) => {
    assert.isObject(obj);

    assert.isString(obj.status);
    assert.include(['pending', 'ready', 'processing', 'valid', 'invalid'], obj.status);

    assert.isArray(obj.identifiers);
    obj.identifiers.forEach((i) => spec.identifier(i));

    assert.isArray(obj.authorizations);
    obj.authorizations.forEach((a) => assert.isString(a));

    assert.isString(obj.finalize);

    if ('expires' in obj) {
        assert.isString(obj.expires);
    }

    if ('notBefore' in obj) {
        assert.isString(obj.notBefore);
    }

    if ('notAfter' in obj) {
        assert.isString(obj.notAfter);
    }

    if ('error' in obj) {
        assert.isObject(obj.error);
    }

    if ('certificate' in obj) {
        assert.isString(obj.certificate);
    }

    /* Augmentations */
    assert.isString(obj.url);
};


/**
 * Authorization
 */

spec.authorization = (obj) => {
    assert.isObject(obj);

    spec.identifier(obj.identifier);

    assert.isString(obj.status);
    assert.include(['pending', 'valid', 'invalid', 'deactivated', 'expires', 'revoked'], obj.status);

    assert.isArray(obj.challenges);
    obj.challenges.forEach((c) => spec.challenge(c));

    if ('expires' in obj) {
        assert.isString(obj.expires);
    }

    if ('wildcard' in obj) {
        assert.isBoolean(obj.wildcard);
    }

    /* Augmentations */
    assert.isString(obj.url);
};


/**
 * Identifier
 */

spec.identifier = (obj) => {
    assert.isObject(obj);
    assert.isString(obj.type);
    assert.isString(obj.value);
};


/**
 * Challenge
 */

spec.challenge = (obj) => {
    assert.isObject(obj);
    assert.isString(obj.type);
    assert.isString(obj.url);

    assert.isString(obj.status);
    assert.include(['pending', 'processing', 'valid', 'invalid'], obj.status);

    if ('validated' in obj) {
        assert.isString(obj.validated);
    }

    if ('error' in obj) {
        assert.isObject(obj.error);
    }
};
