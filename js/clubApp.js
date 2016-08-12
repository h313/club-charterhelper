var app = angular.module('clubApp', ['ngCookies', 'angular-clipboard']);

app.controller('ClubController', ['$scope','$http', 'clipboard', function ClubController($scope, $http, $cookies, clipboard){
  $scope.state = 0;
  $scope.clubs = [];
  $scope.orderProp="name";
  $scope.query = {};
  $scope.queryBy = 'name';
  $scope.club = {};
  $scope.emails = "";
  $http.get("/clubData", {withCredentials: true }).success(function(data){
    $scope.clubs = data.data;
    $scope.state = 1;
  });
  $scope.getData = function() {
    $http.get("/clubData", {withCredentials: true }).success(function(data){
      $scope.clubs = data.data;
      $scope.state = 1;
    });
  };
  $scope.subscribe = function(id) {
    $scope.state = 0;
    $http.post("/subscribe", {id: id}, {withCredentials: true}).success(function() {
      $scope.clubs = [];
      $http.get("/clubData", {withCredentials: true}).success(function (data) {
        $scope.clubs = data.data;
        $scope.state = 1;
      });
    });
  };
  $scope.unsubscribe = function(id) {
    $scope.state = 0;
    $http.post("/unsubscribe", {id: id}, {withCredentials: true}).success(function() {
      $scope.clubs = [];
      $http.get("/clubData", {withCredentials: true}).success(function (data) {
        $scope.clubs = data.data;
        $scope.state = 1;
      });
    });
  };
  $scope.Asubscribe = function(id) {
    $scope.state = 0;
    $http.post("/subscribe", {id: id}, {withCredentials: true}).success(function() {
      $scope.clubs = [];
      $http.get("/clubData", {withCredentials: true}).success(function (data) {
        $scope.clubs = data.data;
        $http.post('/oneClubData', {id: id}, {withCredentials: true}).success(function(data){
          $scope.club = data;
          $scope.state = 2;
        });
      });
    });
  };
  $scope.Aunsubscribe = function(id) {
    $scope.state = 0;
    $http.post("/unsubscribe", {id: id}, {withCredentials: true}).success(function() {
      $scope.clubs = [];
      $http.get("/clubData", {withCredentials: true}).success(function (data) {
        $scope.clubs = data.data;
        $http.post('/oneClubData', {id: id}, {withCredentials: true}).success(function(data){
          $scope.club = data;
          $scope.state = 2;
        });
      });
    });
  };
  $scope.getClub = function(id) {
    $scope.state = 0;
    $http.post('/oneClubData', {id: id}, {withCredentials: true}).success(function(data){
      $scope.club = data;
      $scope.emails = "";
      data.members.forEach(function(member){
        $scope.emails += member.email + ',';
      });
      $('.carousel.carousel-slider').carousel({full_width: true});
      $scope.state = 2;
    });
  };
  $scope.getEmails = function(id) {
    clipboard.copyText($scope.emails);
  }
}
]);