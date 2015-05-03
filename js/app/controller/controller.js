angular.module("controller")
    .controller("mainCtrl", ["$scope", "Storage", "Content", function ($scope, Storage, Content) {
        $scope.tab = 0;
        $scope.progress = 0;
        $scope.files = 0;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };

        chrome.storage.sync.get("state", function (value) {
            $scope.status = value.state;

            if (value.state != undefined) {
                for (var i = 0; i < value.state.length; i++) {
                    for (var j = 0; j < value.state[i].docs.length; j++) {
                        downloadFile(value.state[i].docs[j], value.state[i].source);
                    }

                    for (j = 0; j < value.state[i].video.length; j++) {
                        downloadFile(value.state[i].video[j], value.state[i].source);
                    }
                }
            }
        });

        $scope.avg = [];

        var onProgress = function (event) {
            if (event.lengthComputable) {
                var href = event.target.responseURL,
                    sum = 0,
                    isFound = false;

                for (item in $scope.avg) {
                    if ($scope.avg[item].name == href.split('/')[5]) {
                        $scope.avg[item].value = event.loaded / event.total;
                        isFound = true;
                    }
                }

                if (!isFound) {
                    $scope.avg.push({
                        name: href.split('/')[5],
                        value: event.loaded / event.total
                    });
                }

                for (item in $scope.avg) {
                    sum += $scope.avg[item].value;
                }

                $scope.progress = (sum / $scope.avg.length) / $scope.files;
                $scope.progress = Math.round($scope.progress * 100) / 100;

                $scope.$apply(function () {
                    $scope.progress = $scope.progress;
                });
            }
        };

        var downloadFile = function (file, directory) {
            if (!file.saved || file.saved == undefined) {
                $scope.files++;
                Content.download(file, function () {
                    file.data = this.response;
                    file = Storage.save(file, directory);

                    chrome.storage.sync.clear();
                    chrome.storage.sync.set({state: $scope.status});
                    $scope.files--;
                }, onProgress);
            }
        }
    }]
);
