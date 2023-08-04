function makeCancelable(promise) {
  let isCanceled = false;
  const wrappedPromise = new Promise((resolve, reject) => {
    // Suppress resolution and rejection if canceled
    promise
      .then((val) => !isCanceled && resolve(val))
      .catch((error) => !isCanceled && reject(error));
  });
  return {
    promise: wrappedPromise,
    cancel() {
      isCanceled = true;
    },
  };
}

function useCancellablePromise() {
  const promises = [];

  function cancellablePromise(p) {
    const cancelAblePromise = makeCancelable(p);
    promises.push(cancelAblePromise);
    return cancelAblePromise.promise;
  }

  function cancelAllPromises() {
    promises.forEach((p) => p.cancel());
    promises.length = 0;
  }

  return { cancellablePromise, cancelAllPromises };
}

module.exports = useCancellablePromise;
