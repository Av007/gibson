angular.module("app")
    .factory("Storage", function () {
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
                            fileEntry.copyTo(directory);
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

            console.log("Error: " + msg);
        }

        return Storage;
    });
