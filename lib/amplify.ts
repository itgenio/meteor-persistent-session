const rprefix = /^__amplify__/;

const PREFIX = "__amplify__";

export const amplify = new (class SimpleAmplify {
  clearExpired() {
    const now = Date.now();
    const ret: Record<string, any> = {};
    const removed: string[] = [];
    let i = 0;
    try {
      let key;
      while (key = localStorage.key(i++)) {
        if (!rprefix.test(key)) continue;

        const parsed = JSON.parse(localStorage.getItem(key));

        if (parsed.expires && parsed.expires <= now) {
          removed.push(key);
        } else {
          ret[key.replace(rprefix, '')] = parsed.data;
        }

      }

      removed.forEach(key => localStorage.removeItem(key));
    } catch (error) {
    }

    return ret;
  }

  get(key: string): any {
    const prefixedKey = PREFIX + key;
    const now = Date.now();

    const storedValue = localStorage.getItem(prefixedKey);
    const parsed = storedValue ? JSON.parse(storedValue) : { expires: -1 };
    if (parsed.expires && parsed.expires <= now) {
      localStorage.removeItem(prefixedKey);
      return undefined;
    }

    return parsed.data;

  }

  store(key: string, value?: any, options?: { expires?: number }): any {
    const prefixedKey = PREFIX + key;
    const now = Date.now();

    if (value === undefined) {
      return this.get(key);
    }

    if (value === null) {
      localStorage.removeItem(prefixedKey);
      return null;
    }

    const parsed = JSON.stringify({
      data: value,
      expires: options?.expires ? now + options.expires : null
    });
    try {
      localStorage.setItem(prefixedKey, parsed);
      // quota exceeded
    } catch (error) {
      console.error(error);
      // expire old data and try again
      this.clearExpired();
      try {
        localStorage.setItem(prefixedKey, parsed);
      } catch (error) {
        throw new Error(`can't set key ${prefixedKey} with data: ${parsed}`);
      }
    }

    return value;
  }
})
