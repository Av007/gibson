angular.module('controller')
    .controller('mainCtrl', ['$scope', function ($scope) {
        $scope.tab = 1;

        $scope.setTab = function (item) {
            $scope.tab = item;
        };


        $scope.treeData = [
            {name: "Root", file: "test.txt"},
            {name: "Root", file: "test.txt"},
            {name: "Root", file: "test.txt"},
            {name: "Root", file: "test.txt"}
        ];
    }]);
