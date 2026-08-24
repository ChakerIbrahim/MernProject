const REQUIRED_ENV_KEYS = Object.freeze([
    'MONGOOSE_URI',
    'SECRET'
]);

const OPTIONAL_INTEGRATION_KEYS = Object.freeze([
    'GEMINI_API_KEY',
    'EMAILJS_SERVICE_ID',
    'EMAILJS_PUBLIC_KEY',
    'EMAILJS_PRIVATE_KEY'
]);

const missingKeys = (env = process.env, keys = REQUIRED_ENV_KEYS) => (
    keys.filter((key) => !String(env[key] || '').trim())
);

const reportEnvironment = ({ env = process.env, logger = console.warn } = {}) => {
    const required = missingKeys(env);
    const integrations = missingKeys(env, OPTIONAL_INTEGRATION_KEYS);

    if (required.length > 0) {
        logger(`[env] Missing required configuration: ${required.join(', ')}`);
    }

    if (integrations.length > 0) {
        logger(`[env] Optional integrations unavailable: ${integrations.join(', ')}`);
    }

    return { required, integrations };
};

module.exports = {
    REQUIRED_ENV_KEYS,
    OPTIONAL_INTEGRATION_KEYS,
    missingKeys,
    reportEnvironment
};
