angular.module("controller")
    .controller("mainCtrl", ["$scope", function ($scope) {
        $scope.tab = 0;
        $scope.progress = 0;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };

        setInterval(update, 3000);

        update();

        function update() {
            chrome.storage.sync.get("progress", function(items) {
                if (items.progress != undefined) {
                    $scope.progress = items.progress;

                    $scope.$apply(function () {
                        $scope.progress = $scope.progress;
                    });
                }
            });

            chrome.storage.sync.get("state", function(items) {
                if (items.state != undefined) {
                    $scope.status = items.state;
                }
            });
        }
    }]
);
