let Promise = require('bluebird');

module.exports = {
    /*
    Converts the specified promise result as an array [err, data]
    */
    to_array: function(promise) {
        return promise
            .then(data => [null, data])
            .catch(err => [err]);
    },
    
    /*
    Retry `fn` until it succeeds (`fn` must returns a Promise)

    Waits `options.interval` milliseconds (default 1000) between attempts.
    If none is specified, then the default is to make 5 attempts.
    */
    retry: function(fn, {retry = 4, interval = 1000} = {}) {
        function try_once() {
            return fn()
                .catch(err => {
                    if (retry > 0) {
                        retry--;
                        return Promise.delay(interval).then(try_once);
                    }
                    return Promise.reject(err);
                });
        }
        return try_once();
    },

    /*
    Returns an object containing a promise that is resolved after the specified delay and a function to cancel it
    */
    promiseTimeout: function(delay) {
        let timeout, promise;
        promise = new Promise((resolve, reject) => {
            timeout = setTimeout(() => resolve(), delay)
        });
        return {
            promise,
            cancel: () => clearTimeout(timeout)
        }
    }
};