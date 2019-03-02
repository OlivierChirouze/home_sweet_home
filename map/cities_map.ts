/// <reference path="../model.ts" />

// TODO "max" select input should be injected to have appropriate values suggested

const forEach = function <T extends Node>(array: NodeListOf<T>, callback: (i: number, t: T) => any) {
    for (let i = 0; i < array.length; i++) {
        callback(i, array[i]); // passes back stuff we need
    }
};

function addScript(scriptSrc: string) {
    let header = document.getElementsByTagName("head")[0];
    let scriptTag = document.createElement("script");
    scriptTag.type = "text/javascript";
    scriptTag.src = scriptSrc;
    header.appendChild(scriptTag);
}

let type = "order";

let map: google.maps.Map;
let markedCities: MarkedCity[] = [];

function resetMarkers() {
    markedCities.forEach((m) => {
        m.marker.setMap(null);
    });

    markedCities = [];
}

let citiesMapSweetHome = new HomeSweetHome(cities, config);
(<any>document).getElementById("max").value = config.limit;

function changeLimit(newLimit: string) {
    // TODO optimize
    config.limit = newLimit == 'All' ? cities.length : Number(newLimit);
    citiesMapSweetHome = new HomeSweetHome(cities, config);
    initMap();
}

interface MarkedCity extends City {
    marker: google.maps.Marker;
}

citiesMapSweetHome.config.destinations.forEach((dest: any, i: number) => {
        let button = document.createElement('button');
        let newType = i.toString();
        button.innerText = dest.for;
        button.id = "btn_" + newType;
        button.className = "mdl-button mdl-js-button";
        button.onclick = () => {
            updateMarkers(newType);
        };
        (<any>document).querySelector('#header').appendChild(button);
    }
);

addScript("https://maps.googleapis.com/maps/api/js?key=" + config.key + "&callback=initMap");

function updateMarkers(newType: string = type) {
    type = newType;

    const destinationOutputs = citiesMapSweetHome.getDestinationOutputs();

    markedCities.forEach((markedCity: MarkedCity, i: number) => {
            let label = "";
            let color = "";
            let url = "";

            switch (type) {
                case "order":
                case "name":
                    label = "" + (i + 1);
                    if (type === "name") label += " " + markedCity.n;
                    color = getColorFromOrder(i, citiesMapSweetHome.config.limit);

                    // Complete journey
                    url = getFullUrl(
                        markedCity,
                        config.destinations[0],
                        config.destinations[1]
                    );

                    break;
                case "0":
                case "1":
                    let destIndex = Number(type);
                    let duration = getDurationString(markedCity, destIndex);
                    label = duration.toString();
                    let min = destinationOutputs[destIndex].min;
                    let max = destinationOutputs[destIndex].max;
                    color = getColorFromDuration(duration, min, max);

                    // Journey to destination
                    url = getUrl(
                        markedCity,
                        config.destinations[destIndex],
                    );

                    break;
            }

            markedCity.marker.setLabel(label);
            let icon = (<google.maps.Symbol>markedCity.marker.getIcon());
            icon.fillColor = color;
            icon.strokeColor = color;

            markedCity.marker.setOpacity(1);

            // On click
            markedCity.marker.addListener('click', function (event) {
                window.open(
                    url,
                    markedCity.n
                );
            });

            // Refresh
            markedCity.marker.setMap(null);
            markedCity.marker.setMap(map);
        }
    );

    // Reset previous tab
    forEach(document.querySelectorAll<HTMLElement>(".currentTab"),
        (i: number, e: HTMLElement) => e.classList.remove("currentTab")
    );

    let htmlElement = document.querySelector<HTMLElement>("#btn_" + type);
    if (htmlElement)
        htmlElement.classList.add("currentTab");
}

function initMap() {
    function addMarker(position: number, city: City): void {

        const displayPos = position + 1;

        const markedCity = <MarkedCity>city;

        const location = {
            lat: Number(markedCity.lat.replace(',', '.')),
            lng: Number(markedCity.lng.replace(',', '.'))
        };

        if (map === undefined) {
            // Map will be centered on the first city in list
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 11,
                center: location
            });
        }

        // https://developers.google.com/maps/documentation/javascript/reference/3.exp/marker#MarkerOptions

        // Build a title to show on mouse over
        let title = markedCity.n;
        let durations: number[] = config.destinations.map((dest: any, i: number) => getDuration(markedCity, i));
        let total = durations.reduce((a, b) => a + b);
        config.destinations.forEach((dest: any, i: number) => {
            let duration = durations[i];
            let percentage = Math.floor(duration / total * 100);
                title += `\n${dest.for}: ${duration} - ${percentage}%`;
                if (isATrainDestination(dest))
                    title += ` (${getDurationStringVia(markedCity, i)})`;
            }
        );
        if (isATrainDestination(config.destinations[0]) || isATrainDestination(config.destinations[1]))
            title += "via " + markedCity.via;

        markedCity.marker = new google.maps.Marker({
            position: location,
            label: {
                text: "...",
                fontSize: "10px"
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#eee",
                fillOpacity: 1,
                strokeColor: "#eee"
            },
            title: title,
            map: map,
            zIndex: 1 / displayPos,
            clickable: true,
            opacity: 0
        });

        markedCities.push(markedCity);
    }

    resetMarkers();

    // Create a marker for all cities, not limited
    citiesMapSweetHome.getCities()
        .forEach((city: ScoredCity, position: number) => addMarker(position, city));

    updateMarkers(type);
}