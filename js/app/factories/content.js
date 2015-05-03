angular.module("app")
    .factory("Content", function () {
        var Content = {};

        Content.download = function (item, callback, progressCallback) {
            if (item.data instanceof Blob) {
                return;
            }

            var xhr = new XMLHttpRequest();
            xhr.open("GET", item.source, true);
            xhr.responseType = "blob";
            xhr.onprogress = progressCallback;

            xhr.onload = callback;
            xhr.send();
        };

        return Content;
    });
