var app = angular.module('accountApp', ['ngCookies']);

app.controller('AccountController', function AccountController($scope, $http, $cookies){
  $scope.name = "";
  $scope.email = "";
  $scope.state = 0;
  $scope.clubs = [];
  $http.get("/accountData", {withCredentials: true}).success(function(data){
    console.log(data);
    $scope.name = data.name;
    $scope.email = data.email;
    $scope.clubs = data.clubs;
    $scope.state = 1;
  });
  $scope.unsubscribe = function(id) {
    $scope.state = 0;
    $http.post("/unsubscribe", {id: id}, {withCredentials: true}).success(function() {
      $scope.clubs = [];
      $http.get("/accountData", {withCredentials: true }).success(function(data){
        $scope.name = data.name;
        $scope.email = data.email;
        $scope.clubs = data.clubs;
        $scope.state = 1;
      });
    });
  };
});