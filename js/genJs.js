var cities = [];

var population = [];
var currentGen;
var currentBest;
var best, bestScore;
var scores;
//Google API map
var map;


//Start GA

function startGA(popsize, maxGen, mRate, mode, elitism) {
    /*console.log(popsize);
    console.log(maxGen);
    console.log(mRate);
    console.log(mode);
    console.log(elitism);*/


}

///////////END OF GA///////////////
//add or remove a city simply by clicking on the map
function placeMarker(position, map) {
    //no more than X cities, here 10
    if(cities.length<10){
        //create new Marker
        var marker = new google.maps.Marker({
            position: position,
            map: map
          });
          //add a click listener on the marker (to remove it later)
          //can bug if 2 markers are at the exact same position, but shouldn't happen.
          //please tell me it won't...
          //if clicked
        marker.addListener("click", function (e) {
            //remove marker from the cities array
            for (var i = 0; i < cities.length; i++) {
                if (cities[i].getPosition().equals(marker.getPosition())) {
                    cities.splice(i, 1);
                }
            }
              //remove marker from map
              marker.setMap(null);
          });
          //add marker to cities array
          cities.push(marker);

          /*console.log(cities);
    for (var i=0; i<cities.length; i++) {
        console.log(cities[i].position.lat());
        console.log(cities[i].position.lng());
        }*/
    }
    else{
        //if there is too many cities, alert the user.
        //alert("please delete a city first !");
        document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
            message: "please delete a city first !"
        });
    }
};

//create the map
function initMap() {
    //center the map on grenoble, zoom is arbitrary
    var grenoble = {lat: 45.188529, lng: 5.724524};
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 10,
      center: grenoble
    });
    //add click listener to map to place markers and register cities
    map.addListener ('click', function(e) {
        placeMarker(e.latLng, map);
    });
    map.setOptions({ draggableCursor: 'default' });
};

$( document ).ready(function() {
    // Handler for .ready() called.
    //init map.
    initMap();

    $("#start").bind("click", function (e) {
        if ($("#popSize").val() == undefined || $("#maxGen").val() == undefined || $("#popSize").val() == '' || $("#maxGen").val() == '' || cities.length < 2) {
            document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
                message: "please fill population size and max number of generations. Please put at least 2 markers on the map."
            });
        }
        else {
            document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
                message: "start"
            });
            startGA($("#popSize").val(), $("#maxGen").val(), $("#mRate").val(), $("#switch-mode").is(':checked'), $("#switch-elitism").is(':checked'));
        }
    });
    console.log(map);
    console.log("map");
    // This event listener calls addMarker() when the map is clicked.
    
});




    
