function requestAsObject (request) {
  if (!request instanceof Request)
    throw Object.assign(
      new Error(),
      {name: 'TypeError', message: 'Argument must be a Request object'}
    );
  request = request.clone();

  function stringifiableObject (obj) {
    const filtered = {};
    for (const key in obj)
      if (['boolean', 'number', 'string'].includes(typeof obj[key]) || obj[key] === null)
        filtered[key] = obj[key];
    return filtered;
  }

  return {
    ...stringifiableObject(request),
    headers: Object.fromEntries(request.headers),
    signal: stringifiableObject(request.signal),
    // bodyText: await request.text(), // requires function to be async
  };
}

function requestAsArrayEntries (request) {
  if (!request instanceof Request)
    throw Object.assign(
      new Error(),
      {name: 'TypeError', message: 'Argument must be a Request object'}
    );
  request = request.clone();

  function entriesFromObject (obj) {
    const entries = [];
    for (const key in obj)
      if (['boolean', 'number', 'string'].includes(typeof obj[key]) || obj[key] === null)
        entries.push([key, obj[key]]);
    return entries.sort();
  }

  return [
    ...entriesFromObject(request),
    ['headers', [...request.headers].sort()],
    ['signal', entriesFromObject(request.signal)],
    // ['bodyText', await request.text()], // requires function to be async
  ].sort();
}

function objectFromNestedEntries (arrayOfEntries) {
  if (!Array.isArray(arrayOfEntries)) return arrayOfEntries;
  const obj = {};
  for (const [key, value] of arrayOfEntries) {
    obj[key] = objectFromNestedEntries(value);
  }
  return obj;
}

// const request = new Request('https://example.com/send', {
//   method: 'POST',
//   body: 'Hello world',
//   headers: {'x-planet-origin': 'Mars'},
// });

// const object = requestAsObject(request);
// const arrayEntries = requestAsArrayEntries(request);
// const sortedObject = objectFromNestedEntries(arrayEntries);

// console.log({
//   object,
//   arrayEntries,
//   sortedObject,
//   objectAsString: JSON.stringify(object),
//   sortedObjectAsString: JSON.stringify(sortedObject),
// });


// safely handles circular references
const safeStringify = (obj, indent = 2) => {
  let cache = [];
  const retVal = JSON.stringify(
    obj,
    (key, value) =>
      typeof value === "object" && value !== null
        ? cache.includes(value)
          ? undefined // Duplicate reference found, discard key
          : cache.push(value) && value // Store value in our collection
        : value,
    indent
  );
  cache = null;
  return retVal;
};

module.exports = {
  requestAsObject,
  safeStringify
}