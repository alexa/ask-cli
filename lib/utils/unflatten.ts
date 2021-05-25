const explodeProperty = (currUnflattened: any, key: string, flattenedObj: any, delimiter: string) => {
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

export default function unflatten(flattened: object, delimiter: string = '.') {
    return Object.keys(flattened)
        .reduce((acc, key) => {
            explodeProperty(acc, key, flattened, delimiter);
            return acc;
        }, {});
}
