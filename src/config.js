let config = {};

module.exports = config;

module.exports.update = (newConfig) => {
    Object.assign(config, newConfig);
}