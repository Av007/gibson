angular.module('app.tree')
    .directive('tree', function($parse, $window) {
        return {
            restrict: 'EA',
            scope: {
                data: "=",
                label: "@"
            },
            link: function(scope, iElement, iAttrs) {

            }
        }
    });
