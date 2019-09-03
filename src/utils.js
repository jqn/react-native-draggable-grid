function findKey(map, fn) {
  const keys = Object.keys(map);
  for (let i = 0; i < keys.length; i++) {
    if (fn(map[keys[i]])) {
      return keys[i];
    }
  }
}
function findIndex(arr, fn) {
  for (let i = 0; i < arr.length; i++) {
    if (fn(arr[i])) {
      return i;
    }
  }
  return -1;
}
function differenceBy(arr1, arr2, key) {
  const result = [];
  arr1.forEach(item1 => {
    const keyValue = item1[key];
    if (!arr2.some(item2 => item2[key] === keyValue)) {
      result.push(item1);
    }
  });
  return result;
}
export { findKey, findIndex, differenceBy };
