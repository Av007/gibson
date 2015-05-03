angular.module("app")
    .factory("Storage", function () {
        var Storage = {};

        var entity = null,
            file = null;

        Storage.save = function (item) {
            entity = item;

            syncStorage();
            entity.saved = true;

            return entity
        };

        function syncStorage() {
            navigator.webkitPersistentStorage.queryUsageAndQuota(function (usedBytes, grantedBytes) {
                //console.log("we are using ", usedBytes, " of ", grantedBytes, "bytes");
            }, errorHandler);

            var requestedBytes = 1024 * 1024 * 280;

            navigator.webkitPersistentStorage.requestQuota(requestedBytes, function (grantedBytes) {
                window.webkitRequestFileSystem(PERSISTENT, grantedBytes, onInitFs, errorHandler);
            }, errorHandler);
        }

        function onInitFs(fs) {
            fs.root.getDirectory(entity.source.toString(), {create: true}, function (directory) {

                for (var j = 0; j < entity.docs.length; j++) {
                    file = entity.docs[j];

                    if (file.data instanceof Blob && (file.data.length > 0)) {
                        fs.root.getFile(file.filename.toString(), {create: true}, function (fileEntry) {
                            fileEntry.createWriter(function (fileWriter) {
                                fileWriter.onerror = errorHandler;

                                fileWriter.write(file.data);
                                fileEntry.moveTo(directory);

                            }, errorHandler);
                        }, errorHandler);
                    }
                }

                for (j = 0; j < entity.video.length; j++) {
                    file = entity.video[j];

                    if (file.data instanceof Blob && (file.data.length > 0)) {
                        fs.root.getFile(file.filename.toString(), {create: true}, function (fileEntry) {
                            fileEntry.createWriter(function (fileWriter) {
                                fileWriter.onerror = errorHandler;
                                fileWriter.write(file.data);
                                fileEntry.moveTo(directory);

                            }, errorHandler);
                        }, errorHandler);
                    }
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
