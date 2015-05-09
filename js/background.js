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
        capacity = Math.round(usedBytes / grantedBytes * 1000) / 100;
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
                    //fileEntry.moveTo(directory);
                    fileEntry.copyTo(directory);
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

Background.init();
