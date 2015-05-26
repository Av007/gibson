Background = {
    avg: [],
    list: [],
    files: 0,
    status: null,
    progress: 0,
    handle: null,
    init: function() {
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if (changes.state != undefined && changes.state.newValue != undefined) {
                Background.status = changes.state.newValue;
                for (var i = 0; i < Background.status.length; i++) {
                    for (var j = 0; j < Background.status[i].docs.length; j++) {
                        Background.downloadFile(Background.status[i].docs[j], Background.status[i].source);
                    }

                    for (j = 0; j < Background.status[i].video.length; j++) {
                        Background.downloadFile(Background.status[i].video[j], Background.status[i].source);
                    }
                }
            }
        });
    },

    downloadFile: function (file, directory) {

        if ((!file.saved || file.saved == undefined) && (Background.list.indexOf(file.filename) < 0)) {
            Background.list.push(file.filename);
            Background.files++;

            Content.download(file, function () {
                file.data = this.response;
                file = Storage.save(file, directory);
                Background.files--;

                chrome.storage.sync.set({state: Background.status});
            }, Background.onProgress);

        }
    },

    onProgress: function (event) {
        if (event.lengthComputable) {
            var href = event.target.responseURL,
                sum = 0,
                isFound = false;

            for (item in Background.avg) {
                if (Background.avg[item].name == href.split('/')[5]) {
                    Background.avg[item].value = event.loaded / event.total;
                    isFound = true;
                }
            }

            if (!isFound) {
                Background.avg.push({
                    name: href.split('/')[5],
                    value: event.loaded / event.total
                });
                chrome.storage.sync.set({avg: Background.avg});
            }

            for (item in Background.avg) {
                sum += Background.avg[item].value;
            }

            Background.progress = (sum / Background.avg.length) / Background.files;
            Background.progress = Math.round(Background.progress * 100) / 100;

            if (!Background.handle) {
                Background.updateStorage();
            }

            if (Background.progress >= 1) {
                chrome.storage.sync.set({progress: Background.progress});
                clearInterval(Background.handle);
                Background.handle = null;
            }
        }
    },

    updateStorage: function() {
        Background.handle = setInterval(function () {
            chrome.storage.sync.set({progress: Background.progress});
        }, 3000);
    }
};

var Storage = {
    init: syncStorage(),
    fileSystem: null,
    capacity: 0,
    getCapacity: function () {
        this.capacity;
    }
};

Storage.save = function (item, directory) {
    saveFile(directory, item);
    item.saved = true;

    return item;
};

function syncStorage() {
    navigator.webkitPersistentStorage.queryUsageAndQuota(function (usedBytes, grantedBytes) {
        Storage.capacity = Math.round(usedBytes / grantedBytes * 1000) / 100;
    }, errorHandler);

    var requestedBytes = 1024 * 1024 * 280;

    navigator.webkitPersistentStorage.requestQuota(requestedBytes, function (grantedBytes) {
        window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
    }, errorHandler);
}

function onInitFs(fs) {
    Storage.fileSystem = fs;
}

function saveFile(directoryName, file) {
    Storage.fileSystem.root.getDirectory(directoryName, {create: true}, function (directory) {
        if (file.data instanceof Blob) {
            Storage.fileSystem.root.getFile(file.filename.toString(), {create: true}, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.onerror = errorHandler;

                    fileWriter.write(file.data);
                    fileEntry.copyTo(directory);

                    console.log("Try to upload drive");
                    if (!GDrive.accessToken) {
                        GDrive.auth(false, function () {
                            GDrive.upload(file.data, file.filename.toString());
                        });
                    }

                    //fileEntry.delete();
                }, errorHandler);
            }, errorHandler);
        }
    });
}

function errorHandler(e) {
    var msg = "";

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = "QUOTA_EXCEEDED_ERR";
            break;
        case FileError.NOT_FOUND_ERR:
            msg = "NOT_FOUND_ERR";
            break;
        case FileError.SECURITY_ERR:
            msg = "SECURITY_ERR";
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = "INVALID_MODIFICATION_ERR";
            break;
        case FileError.INVALID_STATE_ERR:
            msg = "INVALID_STATE_ERR";
            break;
        default:
            msg = "Unknown Error";
            break;
    }

    console.error("Error: " + msg);
}

var Content = {
    download: function (item, callback, progressCallback) {
        if (item.data instanceof Blob) {
            return;
        }

        var xhr = new XMLHttpRequest();
        xhr.open("GET", item.source, true);
        xhr.responseType = "blob";
        xhr.onprogress = progressCallback;

        xhr.onload = callback;
        xhr.send();
    }
};

var GDrive = {
    accessToken: null,
    auth: function (interactive, callback) {
        try {
            chrome.identity.getAuthToken({interactive: interactive}, function (token) {
                if (token) {
                    GDrive.accessToken = token;
                    callback && callback();
                }
            }.bind(this));
        } catch (error) {
            console.log(error);
        }
    },
    upload: function (blob, filename) {
        var onComplete = function (response) {
            //var entry = JSON.parse(response);
        }.bind(this);
        var onError = function (response) {
            throw new Error("Error: " + response);
        }.bind(this);

        var uploader = new MediaUploader({
            token: GDrive.accessToken,
            file: blob,
            params: {"title": filename},
            onComplete: onComplete,
            onError: onError
        });

        uploader.upload();
    }
};

/**
 * Uploads a file to Google Docs.
 */


/**
 * Helper for implementing retries with backoff. Initial retry
 * delay is 1 second, increasing by 2x (+jitter) for subsequent retries
 *
 * @constructor
 */
var RetryHandler = function() {
    this.interval = 1000; // Start at one second
    this.maxInterval = 60 * 1000; // Don't wait longer than a minute
};

/**
 * Invoke the function after waiting
 *
 * @param {function} fn Function to invoke
 */
RetryHandler.prototype.retry = function(fn) {
    setTimeout(fn, this.interval);
    this.interval = this.nextInterval_();
};

/**
 * Reset the counter (e.g. after successful request.)
 */
RetryHandler.prototype.reset = function() {
    this.interval = 1000;
};

/**
 * Calculate the next wait time.
 * @return {number} Next wait interval, in milliseconds
 *
 * @private
 */
RetryHandler.prototype.nextInterval_ = function() {
    var interval = this.interval * 2 + this.getRandomInt_(0, 1000);
    return Math.min(interval, this.maxInterval);
};

/**
 * Get a random int in the range of min to max. Used to add jitter to wait times.
 *
 * @param {number} min Lower bounds
 * @param {number} max Upper bounds
 * @private
 */
RetryHandler.prototype.getRandomInt_ = function(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};


/**
 * Helper class for resumable uploads using XHR/CORS. Can upload any Blob-like item, whether
 * files or in-memory constructs.
 *
 * @example
 * var content = new Blob(["Hello world"], {"type": "text/plain"});
 * var uploader = new MediaUploader({
 *   file: content,
 *   token: accessToken,
 *   onComplete: function(data) { ... }
 *   onError: function(data) { ... }
 * });
 * uploader.upload();
 *
 * @constructor
 * @param {object} options Hash of options
 * @param {string} options.token Access token
 * @param {blob} options.file Blob-like item to upload
 * @param {string} [options.fileId] ID of file if replacing
 * @param {object} [options.params] Additional query parameters
 * @param {string} [options.contentType] Content-type, if overriding the type of the blob.
 * @param {object} [options.metadata] File metadata
 * @param {function} [options.onComplete] Callback for when upload is complete
 * @param {function} [options.onError] Callback if upload fails
 */
var MediaUploader = function(options) {
    var noop = function() {};
    this.file = options.file;
    this.contentType = options.contentType || this.file.type || 'application/octet-stream';
    this.metadata = options.metadata || {
        'title': this.file.name,
        'mimeType': this.contentType
    };
    this.token = options.token;
    this.onComplete = options.onComplete || noop;
    this.onError = options.onError || noop;
    this.offset = options.offset || 0;
    this.chunkSize = options.chunkSize || 0;
    this.retryHandler = new RetryHandler();
    this.params = [];

    this.url = options.url;
    if (!this.url) {
        var params = options.params || {};
        params.uploadType = 'resumable';
        this.url = this.buildUrl_(options.fileId, params);
    }
    this.httpMethod = this.fileId ? 'PUT' : 'POST';
};

/**
 * Initiate the upload.
 */
MediaUploader.prototype.upload = function() {
    var self = this;
    var xhr = new XMLHttpRequest();

    console.log(this.url);
    xhr.open(this.httpMethod, this.url, true);
    xhr.setRequestHeader('Authorization', 'Bearer ' + this.token);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('X-Upload-Content-Length', this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.contentType);
    xhr.params(this.params);

    xhr.onload = function(e) {
        var location = e.target.getResponseHeader('Location');
        this.url = location;
        this.sendFile_();
    }.bind(this);
    xhr.onerror = this.onUploadError_.bind(this);
    xhr.send(JSON.stringify(this.metadata));
};

/**
 * Send the actual file content.
 *
 * @private
 */
MediaUploader.prototype.sendFile_ = function() {
    var content = this.file;
    var end = this.file.size;

    if (this.offset || this.chunkSize) {
        // Only bother to slice the file if we're either resuming or uploading in chunks
        if (this.chunkSize) {
            end = Math.min(this.offset + this.chunkSize, this.file.size);
        }
        content = content.slice(this.offset, end);
    }

    var xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Type', this.contentType);
    xhr.setRequestHeader('Content-Range', "bytes " + this.offset + "-" + (end - 1) + "/" + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send(content);
};

/**
 * Query for the state of the file for resumption.
 *
 * @private
 */
MediaUploader.prototype.resume_ = function() {
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', this.url, true);
    xhr.setRequestHeader('Content-Range', "bytes */" + this.file.size);
    xhr.setRequestHeader('X-Upload-Content-Type', this.file.type);
    xhr.onload = this.onContentUploadSuccess_.bind(this);
    xhr.onerror = this.onContentUploadError_.bind(this);
    xhr.send();
};

/**
 * Extract the last saved range if available in the request.
 *
 * @param {XMLHttpRequest} xhr Request object
 */
MediaUploader.prototype.extractRange_ = function(xhr) {
    var range = xhr.getResponseHeader('Range');
    if (range) {
        this.offset = parseInt(range.match(/\d+/g).pop(), 10) + 1;
    }
};

/**
 * Handle successful responses for uploads. Depending on the context,
 * may continue with uploading the next chunk of the file or, if complete,
 * invokes the caller's callback.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadSuccess_ = function(e) {
    if (e.target.status == 200 || e.target.status == 201) {
        this.onComplete(e.target.response);
    } else if (e.target.status == 308) {
        this.extractRange_(e.target);
        this.retryHandler.reset();
        this.sendFile_();
    }
};

/**
 * Handles errors for uploads. Either retries or aborts depending
 * on the error.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onContentUploadError_ = function(e) {
    if (e.target.status && e.target.status < 500) {
        this.onError(e.target.response);
    } else {
        this.retryHandler.retry(this.resume_.bind(this));
    }
};


/**
 * Handles errors for the initial request.
 *
 * @private
 * @param {object} e XHR event
 */
MediaUploader.prototype.onUploadError_ = function(e) {
    this.onError(e.target.response); // TODO - Retries for initial upload
};

/**
 * Construct a query string from a hash/object
 *
 * @private
 * @param {object} [params] Key/value pairs for query string
 * @return {string} query string
 */
MediaUploader.prototype.buildQuery_ = function(params) {
    params = params || {};
    return Object.keys(params).map(function(key) {
        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    }).join('&');
};

/**
 * Build the drive upload URL
 *
 * @private
 * @param {string} [id] File ID if replacing
 * @param {object} [params] Query parameters
 * @return {string} URL
 */
MediaUploader.prototype.buildUrl_ = function(id, params) {
    var url = 'https://www.googleapis.com/upload/drive/v2/files/';
    if (id) {
        url += id;
    }
    var query = this.buildQuery_(params);
    if (query) {
        url += '?' + query;
    }
    return url;
};

Background.init();
