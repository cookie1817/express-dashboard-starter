/* eslint-disable no-param-reassign */
/*
    This function takes an object and converts to a proxy object.
    It also takes care of proxying nested objectsa and array.
*/
function isObject(value: any) {
    if (value === null || value === undefined) return false;
    return value.constructor === Object;
}

export const getProxy = (original: any) => {
    return new Proxy(original, {
        get(target, name, receiver) {
            const rv = Reflect.get(target, name, receiver);
            return rv;
        },

        set(target, name, value, receiver) {
            // Proxies new objects
            if (isObject(value)) {
                value = getProxy(value);
            }
            Reflect.set(target, name, value, receiver);
            return true;
        }
    });
};
