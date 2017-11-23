//array of Markers, each one representing a city
var cities = [];

var population = [];//current population
var elite;//current best
var eliteScore;//current best score
var oldEliteScore;//storage of the old elite score for comparison
var eliteScoreGen;//generation where the best score hqs been found
var eliteScoreGenCtr//counts for how many generations the best score has been the same
var currentScores = [];//current scores array
var sortedScores = [];//current scores positions
var currentGen;//current gen number
var ctr;//gen counter

//Google API map
var map;//whole world map
var displayPath;//current polyline


//Genetic algorithm initialization
function startGA(popsize, maxGen, mRate, cProb, mode, elitism) {
    //initialzation
    population = [];

    //update visuals
    $("#cGenTxt").text("Generation : ");
    $("#bScoreTxt").text("Best score: ");

    //create firs gen
    makeFirstGen(popsize);
    //initialize counters
    ctr = 0;
    eliteScoreGenCtr = 0;
    //launch genetic algorithm
    GA(popsize, maxGen, mRate, cProb, mode, elitism);
}

//Genetic algorithm: recursive function
function GA(popsize, maxGen, mRate, cProb, mode, elitism) {

    ctr++;
    //update visuals
    $("#cGenTxt").text("Generation : " + ctr);
    $("#bScoreTxt").text("Best score: " + eliteScore);
    currentGen = ctr;


    //get scores
    currentScores = [];
    currentScores = evaluate(1);
    sortByScores();


    ////DISPLAYBESTSCOREROUTE////
    var bestRoute = [];

    for (var j = 0; j < elite.length; j++) {
        bestRoute.push(cities[elite[j]].getPosition());
    }
    if (displayPath != undefined) {
        displayPath.setMap(null);
    }
    displayPath = new google.maps.Polyline({
        path: bestRoute,
        geodesic: true,
        strokeColor: 'blue',
        strokeOpacity: 1.0,
        strokeWeight: 2
    });
    displayPath.setMap(map);
    ////ENDOFDISPLAYFUNCTION////

    //mutate population (the rest of the GA is in there)
    mutate(popsize, mode, elitism, mRate, cProb);

    //if not finished, do one more turn
    //window.setTimeout to let the DOM update, with variable speed
    var speed = 0;
    //select speed
    if (maxGen <= 50) speed = 100;
    else if (maxGen > 50 && maxGen <= 100) speed = 50;
    else speed = 10;
    //launch next turn
    if (ctr < maxGen) window.setTimeout(function () { GA(popsize, maxGen, mRate, cProb, mode, elitism) }, speed);

    else {
        //end of algorithm, display scores
        eliteScoreGen = currentGen - eliteScoreGenCtr;
        //alert the user that the algorithm stopped
        document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
            message: "Finished !"
        });
        //alert user at which generation the last best score has been found
        // /!\ may not be the best solution ever found, just the last best.
        var msg = "Last best found on generation: " + eliteScoreGen;
        document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
            message: msg
        });
    }
}

//creates first generation of GA
function makeFirstGen(popsize) {
    for (var i = 0; i < popsize; i++) {
        var chromosome = [];
        //first city is always 0
        chromosome.push(0);
        //for each city
        for (var j = 0; j < cities.length - 1; j++) { //length -1 because we already added 0.
            //select a random city
            var selected = Math.floor((Math.random() * (cities.length)));
            //while city already seen
            while (chromosome.includes(selected)) {
                //select another
                selected = Math.floor((Math.random() * (cities.length)));
            }
            //add selected city to chromosome
            chromosome.push(selected);
        }
        //last city is always 0, since this is a loop. It could be done otherwise though...
        chromosome.push(0);
        //add chromosome to population
        population.push(chromosome);
    }
}

//evaluation function - TODO: different methods ?
function evaluate(met) {
    var chrScores = [];
    //method 1 - Overall length
    if (met == 1) {
        for (var i = 0; i < population.length; i++) {
            var chromosome = population[i];
            var score = 0;
            //get total length of the path (chromosome)
            for (var j = 0; j < chromosome.length - 1; j++) {
                score += Math.floor(google.maps.geometry.spherical.computeDistanceBetween(cities[chromosome[j]].getPosition(), cities[chromosome[j + 1]].getPosition()));
            }
            //push the score of the path in an array of scores
            chrScores.push(score);
        }
    }
    //return scores
    return chrScores;
}

//Sort chromosomes by their scores
function sortByScores() {
    sortedScores = [];
    for (var i = 0; i < currentScores.length; i++) {
        sortedScores[i] = 0;
        var val = currentScores[i];
        //compare scores to every other score
        for (var j = 0; j < currentScores.length; j++) {
            //if a score is better than the one we picked
            if (currentScores[j] < val && i != j) {
                //increase the "position" ctr of the solution we are evaluating
                sortedScores[i] = sortedScores[i] + 1;
            }
            //if the scores are the same, the first one is arbitrary declared worse.
            if (currentScores[j] == val && i < j) {
                sortedScores[i] = sortedScores[i] + 1;
            }
        }

        //Elite Score
        if (sortedScores[i] == 0) {
            elite = population[i];
            //initialise the oldEliteScore buffer
            if (oldEliteScore == undefined) {
                oldEliteScore = eliteScore;
            }
            //define current best score
            eliteScore = currentScores[i];
            //if current best < old best reset ctr
            if (eliteScore != oldEliteScore) {
                eliteScoreGenCtr = 0;
                oldEliteScore = eliteScore;
            }
            //else if current best = old best increment ctr
            else if (eliteScore == oldEliteScore) {
                eliteScoreGenCtr++;
            }
        }
    }
}

//Mutation function
function mutate(popsize, mode, elitism, mrate, probCrois) {
    var newPop = [];
    //elitism
    if (elitism) {
        newPop.push(elite);
    }

    //select parents and cross
    while (newPop.length < popsize) {
        //select parents
        var parents = selectParents(mode);
        //create new children
        var children = crossParents(parents, probCrois);
        //add children to new population
        for (var i = 0; i < children.length; i++) {
            newPop.push(children[i]);
        }
    }
    //put out excess of population induced by elitism (should remove one child)
    while (newPop.length > population.length) {
        newPop.pop();
    }

    //mutate the new population
    mutateNewPop(newPop, mRate);

    //accept new population
    population = newPop;

}

//select parent chromosomes according to mode
function selectParents(mode) {
    var p = [];
    var total = 0;
    switch (mode) {
        case false: //mode rank
            var ranks = [];
            var nbScores = sortedScores.length;
            var noName = 2; //bottom of the division
            for (var i = 0; i < sortedScores.length; i++) {
                noName = 2;
                ranks.push(1 / Math.pow(noName, sortedScores[i] + 1));
            }

            var inc1 = -1;
            var inc2 = -1;
            var pos1 = 0;
            var pos2 = 0;
            while (pos1 == pos2) {
                pos1 = Math.random();
                pos2 = Math.random();
            }

            for (var i = 0; i < ranks.length; i++) {
                if (pos1 > 0 && pos1 - ranks[i] <= 0) {
                    inc1 = i;
                    pos1 = pos1 - ranks[i];
                } else {
                    pos1 = pos1 - ranks[i];
                }

                if (pos2 > 0 && pos2 - ranks[i] <= 0) {
                    inc2 = i;
                    pos2 = pos2 - ranks[i];
                } else {
                    pos2 = pos2 - ranks[i];
                }
            }

            p.push(population[inc1]);
            p.push(population[inc2]);
            break;

        case true://mode roulette // seems broken...
            for (var i = 0; i < currentScores.length; i++) {
                total = total + currentScores[i];
            }

            var inc1 = -1;
            var inc2 = -1;
            //get where we stop in the roulette
            var pos1 = 0;
            var pos2 = 0;
            while (pos1 == pos2) {
                pos1 = Math.floor(Math.random() * total);
                pos2 = Math.floor(Math.random() * total);
            }
            //find the corresponding chromosomes
            //push them in p
            //return p
            for (var i = 0; i < currentScores.length; i++) {
                if (pos1 > 0 && pos1 - currentScores[i] <= 0) {
                    inc1 = i;
                    pos1 = pos1 - currentScores[i];
                } else {
                    pos1 = pos1 - currentScores[i];
                }

                if (pos2 > 0 && pos2 - currentScores[i] <= 0) {
                    inc2 = i;
                    pos2 = pos2 - currentScores[i];
                } else {
                    pos2 = pos2 - currentScores[i];
                }
            }
            if (inc1 > currentScores.length) {
                inc1--;
            }
            if (inc2 > currentScores.length) {
                inc2--;
            }

            p.push(population[inc1]);
            p.push(population[inc2]);

            break;
    }

    return p;
}

//cross parents to return children
function crossParents(parents, probCrois) {
    var childs = [];
    if (Math.floor((Math.random() * 100)) < probCrois) {
        //cross parents
        var crosspoint1 = Math.floor((Math.random() * parents[0].length));
        var crosspoint2 = Math.floor((Math.random() * parents[0].length));
        var child1 = [];
        var child2 = [];
        //take everything from parent until crosspoint
        for (var i = 0; i < crosspoint1; i++) {
            child1.push(parents[0][i]);
        }
        for (var i = 0; i < crosspoint2; i++) {
            child2.push(parents[1][i]);
        }
        //add the rest of the other parent after crosspoint
        for (var j = 0; j < parents[0].length; j++) {
            if (!(child1.includes(parents[1][j]))) {
                child1.push(parents[1][j]);
            }
            if (!(child2.includes(parents[0][j]))) {
                child2.push(parents[0][j]);
            }
        }
        //push last city
        child1.push(child1[0]);
        child2.push(child2[0]);
        //return childs
        childs.push(child1);
        childs.push(child2);
    }
    else {
        //return parents without crossing
        childs.push(parents[0]);
        childs.push(parents[1]);
    }
    return childs;
}

//Mutate new population
function mutateNewPop(newPop, mRate) {
    //for each element of the newpopulation
    for (var i = 0; i < newPop.length; i++) {
        //random to simulate the chance of mutation
        var rand = Math.floor((Math.random() * 100));
        //if mutation then
        if (rand < mRate.value) {
            var pos1 = 0;
            var pos2 = 0;
            //choose two non identical positions
            while (pos1 == pos2) {
                pos1 = Math.floor((Math.random() * (newPop[i].length - 2)) + 1);
                pos2 = Math.floor((Math.random() * (newPop[i].length - 2)) + 1);
            }
            //swap their contents
            var buffer = newPop[i][pos1];
            newPop[i][pos1] = newPop[i][pos2];
            newPop[i][pos2] = buffer;
        }
    }
    //return new population modified
    return newPop;
}
///////////END OF GA///////////////
//add or remove a city simply by clicking on the map
function placeMarker(position, map) {

    //no more than X cities, here 50
    if (cities.length < 50) {
        //remove drawn path if it exists
        if (displayPath != undefined) {
            displayPath.setMap(null);
        }
        if (cities.length == 0) {
            //create first marker
            var marker = new google.maps.Marker({
                position: position,
                map: map
            });
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
        }
        else {
            //if not first
            var marker = new google.maps.Marker({
                position: position,
                map: map
            });
            marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
        }

        //add a click listener on the marker (to remove it later)
        //if clicked
        marker.addListener("click", function (e) {
            //remove marker from the cities array
            for (var i = 0; i < cities.length; i++) {
                if (cities[i].getPosition().equals(marker.getPosition())) {
                    cities.splice(i, 1);
                    //if first marker deleted color new first marker
                    if (i == 0 && cities[0] != undefined) {
                        cities[0].setIcon('http://maps.google.com/mapfiles/ms/icons/green-dot.png');
                    }
                }

            }
            //remove marker from map
            marker.setMap(null);
            //remove drawn path if it exists
            if (displayPath != undefined) {
                displayPath.setMap(null);
            }
        });
        //add marker to cities array
        cities.push(marker);

    }
    else {
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
    var grenoble = { lat: 45.188529, lng: 5.724524 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: grenoble,
        mapTypeControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        fullScreenControl: false
    });
    //add click listener to map to place markers and register cities
    map.addListener('click', function (e) {
        placeMarker(e.latLng, map);
    });
    map.setOptions({ draggableCursor: 'default' });
};

$(document).ready(function () {
    // Handler for .ready() called.
    //init map.
    initMap();

    $("#start").bind("click", function (e) {
        //if settings not filled correctly or not enough cities
        if ($("#popSize").val() == undefined || $("#maxGen").val() == undefined || $("#popSize").val() == '' || $("#maxGen").val() == '' || cities.length < 2) {
            //display error
            document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
                message: "please fill population size and max number of generations. Please put at least 2 markers on the map."
            });
        }
        else {
            //alert the user that the algorithm starts
            document.querySelector('#toastCreator').MaterialSnackbar.showSnackbar({
                message: "Working ..."
            });
            //hide drawer (and its obfuscator)
            $('.mdl-layout__drawer').toggleClass('is-visible');
            $('.mdl-layout__obfuscator').toggleClass('is-visible');

            //start
            startGA($("#popSize").val(), $("#maxGen").val(), $("#mRate").val(), $("#cProb").val(), $("#switch-mode").is(':checked'), $("#switch-elitism").is(':checked'));
        }
    });
});