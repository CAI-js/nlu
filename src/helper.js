function buildTable(data, name) {
  const result = {};
  let index = 0;
  for (let i = 0; i < data.length; i += 1) {
    const keys = Object.keys(data[i][name]);
    for (let j = 0; j < keys.length; j += 1) {
      const key = keys[j];
      if (result[key] === undefined) {
        result[key] = index;
        index += 1;
      }
    }
  }
  return result;
}

function toHash(hash) {
  const currentLookup = {};
  let index = 0;
  const keys = Object.keys(hash);
  for (let i = 0; i < keys.length; i += 1) {
    currentLookup[keys[i]] = index;
    index += 1;
  }
  return currentLookup;
}

function lookupToArray(currentLookup, object) {
  const result = {};
  const keys = Object.keys(currentLookup);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (object[key]) {
      result[currentLookup[key]] = object[key];
    }
  }
  return result;
}

function lookupToObject(currentLookup, array) {
  const result = {};
  const keys = Object.keys(currentLookup);
  for (let i = 0; i < keys.length; i += 1) {
    result[keys[i]] = array[currentLookup[keys[i]]];
  }
  return result;
}

function getTypedArrayFn(table) {
  const { length } = Object.keys(table);
  return v => {
    const result = new Float32Array(length);
    const keys = Object.keys(v);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const index = table[key];
      if (index !== undefined && v[key]) {
        result[index] = v[key];
      }
    }
    return result;
  };
}

function arrayToObject(arr, forceToOnes = false) {
  const result = {};
  for (let i = 0; i < arr.length; i += 1) {
    const current = arr[i];
    result[current] =
      (forceToOnes || !result[current] ? 0 : result[current]) + 1;
  }
  return result;
}

module.exports = {
  toHash,
  lookupToArray,
  lookupToObject,
  getTypedArrayFn,
  buildTable,
  arrayToObject,
};
