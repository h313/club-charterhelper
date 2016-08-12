var app = angular.module('newClubApp', ['ngCookies']);

app.controller('NewClubController', function AccountController($scope, $http, $cookies){
  $scope.name = "Choose a name for your club!";
  $scope.short = "This is a short description. Make it up to 3 sentences long.";
  $scope.long = "This is a longer description that can be as long as you like.";
  $scope.image = "Link a url here containing an image.";
  $scope.state = 0;
  $scope.create = function() {
    $scope.state = 1;
    data = {
      name: $scope.name,
      short: $scope.short,
      long: $scope.long,
      pics: [$scope.image]
    };
    $http.post("/newClub", data, {withCredentials: true}).success(function (data) {
      $scope.state = 2;
    });
  };
});