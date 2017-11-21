//array of Markers, representing a city
var cities = [];

var population = [];
var elite;
var currentScores = [];
var sortedScores=[];
var displayPath;
var currentGen;
var currentBest;
//Google API map
var map;


//Start GA

function startGA(popsize, maxGen, mRate, mode, elitism) {
    /*console.log(popsize);
    console.log(maxGen);
    console.log(mRate);
    console.log(mode);
    console.log(elitism);*/
    population = [];
    makeFirstGen(popsize);

    for (var i = 1; i <= maxGen+1; i++) {
        //tout faire dans le setTimeout, sinon on perd les valeurs.
        //setTimeout(function(){
            //update visuals
            $("#cGenTxt").text("Generation : " + i);
            //get scores - no time to update visuals ? :/
            currentScores = evaluate(1);
            sortByScores();


            ////DISPLAYBESTSCOREROUTE////
            var bestRoute = [];
            
            //console.log(elite);
            for(var j=0;j<elite.length;j++){
                bestRoute.push(cities[elite[j]].getPosition());
            }
            if(displayPath != undefined){
                displayPath.setMap(null);
            }
            displayPath = new google.maps.Polyline({
                path: bestRoute,
                geodesic: true,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2
              });
              displayPath.setMap(map);
              ////ENDOFDISPLAYFUNCTION////
      
            var probCrois = 80;//crossing probability, should be set by user(slider)
            mutate(popsize,mode,elitism,mRate,probCrois);
       //},10);
        
    }
    

}

//creates first generation of GA
function makeFirstGen(popsize) {
    for (var i = 0; i < popsize; i++) {
        var chromosome = [];
        chromosome.push(0);
        for (var j = 0; j < cities.length-1; j++) {
            var selected = Math.floor((Math.random() * (cities.length)));
            if (chromosome.includes(selected)) {
                while (chromosome.includes(selected)) {
                    selected = Math.floor((Math.random() * (cities.length)));
                }
            }
            chromosome.push(selected);
        }
        chromosome.push(0);
        population.push(chromosome);
    }
}

//evaluation function - TODO: different methods
function evaluate(met) {
    var chrScores = [];
    if(met == 1){
        for (var i = 0; i < population.length;i++){
            var chromosome = population[i];
            var score = 0;
            for (var j = 0; j < chromosome.length - 1; j++) {
                score += google.maps.geometry.spherical.computeDistanceBetween(cities[chromosome[j]].getPosition(), cities[chromosome[j+1]].getPosition());
            }
            chrScores.push(score);
        }
    }
    return chrScores;
}

//Sort chromosomes by their scores
function sortByScores(){
    sortedScores = [];
    for (var i = 0; i < currentScores.length; i++) {
        sortedScores[i]=0;
        var val=currentScores[i];
        for (var j = 0; j < currentScores.length; j++) {
            if(currentScores[j]<val && i!=j){
                sortedScores[i]=sortedScores[i]+1;
            }
            if(currentScores[j]==val && i<j){
                sortedScores[i]=sortedScores[i]+1;
            }
        }
        if(sortedScores[i]==0){
            elite = population[i];
        }
    }
}

//Mutation function
function mutate(popsize,mode,elitism,mrate,probCrois){
    var newPop = [];
    
    if(elitism){
        newPop.push(elite);
    }
    //while(newPop.length<popsize){
        var parents = selectParents(mode,popsize);
    console.log(parents);
        //}
}

//select parent chromosomes according to mode
function selectParents(mode,popsize){
    var p = [];
    var total=0;
    switch (mode){
        case false: //mode rank
            
            return p;
            break;
        
            case true://mode roulette
            for(var i=0;i<currentScores.length;i++){
                total = total + currentScores[i];
            }

            var inc1=-1;
            var inc2=-1;
            while(inc1=inc2){
                inc1=-1;
                inc2=-1;
                //get where we stop in the roulette
                var pos1 =(Math.random() * total);
                var pos2 =(Math.random() * total);

                //find the corresponding chromosomes
                //push them in p
                //return p
                while(pos1 > 0){
                    pos1=pos1-(currentScores[inc1]);
                    inc1++;
                }
                while(pos2 > 0){
                    pos2=pos2-(currentScores[inc2]);
                    inc2++;
                }
            }
            
            p.push(population[inc1]);
            p.push(population[inc2]);
            return p;
            break;
    }
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
    //console.log(map);
    // This event listener calls addMarker() when the map is clicked.
    
});




    
