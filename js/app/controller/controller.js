angular.module('controller')
    .controller('mainCtrl', ['$scope', function ($scope) {
        $scope.tab = 0;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };

        $scope.status = [
            {
                "docs": [
                    {"filename": "LastResortTAB.jpg"}
                ],
                "video": [
                    {"filename": "LastResortTAB.jpg"}
                ]
            }
        ];
        //console.log($scope.status);
    }]);
