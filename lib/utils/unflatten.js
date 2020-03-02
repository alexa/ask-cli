const explodeProperty = (currUnflattened, key, flattenedObj, delimiter) => {
    const keys = key.split(delimiter);
    const value = flattenedObj[key];
    const lastKeyIndex = keys.length - 1;

    for (let idx = 0; idx < lastKeyIndex; idx++) {
        const currKey = keys[idx];
        if (!currUnflattened[currKey]) {
            currUnflattened[currKey] = {};
        }
        currUnflattened = currUnflattened[currKey];
    }

    currUnflattened[keys[lastKeyIndex]] = value;
};

const unflatten = (flattened, delimiter = '.') => Object.keys(flattened).reduce((acc, key) => {
    explodeProperty(acc, key, flattened, delimiter);
    return acc;
}, {});

module.exports = unflatten;
