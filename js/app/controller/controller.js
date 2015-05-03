angular.module("controller")
    .controller("mainCtrl", ["$scope", "Storage", "Content", function ($scope, Storage, Content) {
        $scope.tab = 0;
        $scope.progress = 0;
        $scope.files = 0;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };

        chrome.storage.sync.get("state", function(value) {
            $scope.status = value.state;

            if (value.state != undefined) {
                for (var i = 0; i < value.state.length; i++) {
                    if (!value.state.saved || value.state.saved == undefined) {
                        for (var j = 0; j < value.state[i].docs.length; j++) {
                            downloadFile(value.state[i].docs[j]);
                        }

                        for (j = 0; j < value.state[i].video.length; j++) {
                            downloadFile(value.state[i].video[j]);
                        }
                    }
                }
            }
        });

        $scope.$watch("progress", function(newValue) {
            $scope.progress = newValue;
        });

        var onProgress = function (event) {
            if (event.lengthComputable) {
                $scope.progress = (event.loaded / event.total) / $scope.files;
                $scope.progress = Math.round($scope.progress * 100) / 100;

                $scope.$apply(function () {
                    $scope.progress = $scope.progress;
                });
            }
        };
        
        var downloadFile = function (file) {
            $scope.files++;
            Content.download(file, function () {
                file.data = this.response;
                $scope.files--;
            }, onProgress);
        }
    }]
);
