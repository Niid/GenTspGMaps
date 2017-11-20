var WIDTH;HEIGHT;
var cities = [];

var currentGen;
var currentBest;
var best, bestScore;
var scores;
var map;

$( document ).ready(function() {
    // Handler for .ready() called.
    //init map.

    initMap();
    console.log(map);
    // This event listener calls addMarker() when the map is clicked.
    google.maps.event.addListener(map, 'click', function(e) {
    placeMarker(e.latLng, map);
  });
});

function initMap() {
    var grenoble = {lat: 45.188529, lng: 5.724524};
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: grenoble
    });

    /*var marker = new google.maps.Marker({
      position: grenoble,
      map: map
    })*/
};



function placeMarker(position, map) {
    var marker = new google.maps.Marker({
      position: position,
      map: map
    });  
    map.panTo(position);
};

    
