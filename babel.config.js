const { _moduleAliases } = require('./package.json');

module.exports = (api) => {
    api.cache.using(() => process.env.NODE_ENV === 'development')

    return {
        presets: [ '@babel/preset-typescript' ],
        plugins: [
            ['module-resolver', {
              root: ['./'],
              alias: _moduleAliases
            }]
        ]
    };
};
