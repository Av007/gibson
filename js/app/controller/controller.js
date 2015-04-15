angular.module('controller')
    .controller('mainCtrl', ['$scope', function ($scope) {
        $scope.tab = 0;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };

        chrome.storage.sync.get("state", function(value) {
            $scope.status = value.state;
        });
    }]);
