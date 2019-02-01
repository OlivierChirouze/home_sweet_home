/// /// <reference path="./model.ts" /> ../node_modules/stats-lite/stats.js

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

interface MarkedCity extends City {
    marker: google.maps.Marker;
}

config.destinations.forEach((dest: any, i: number) => {
        let button = document.createElement('button');
        button.innerText = dest.for;
        button.className = "mdl-button mdl-js-button";
        button.onclick = () => {
            updateMarkers(i.toString());
        };
        (<any>document).querySelector('#header').appendChild(button);
        // TODO <button onclick="window.type='o_d';updateMarkers();">voiture olivier</button>
    }
)

addScript("https://maps.googleapis.com/maps/api/js?key=" + config.key + "&callback=initMap");


function updateMarkers(newType: string = type) {
    type = newType
    let max = (<any>document).getElementById("max").value

    markedCities.forEach((markedCity: MarkedCity, i: number) => {
            if (i + 1 <= max) {
                let label = "";
                let color = "";

                switch (type) {
                    case "order":
                    case "name":
                        label = "" + (i + 1);
                        if (type === "name") label += " " + markedCity.n;
                        color = getColorFromOrder(i);
                        break;
                    case "0":
                    case "1":
                        // TODO use index
                        let duration = (type === "0" ? markedCity.o : markedCity.c);
                        label = "" + duration;
                        let destConfig = config.destinations[Number(type)];
                        color = getColorFromDuration(duration, destConfig.lower, destConfig.middle, destConfig.max);
                        break;
                    // TODO
                    /*
                case "o_d":
                    label = "" + markedCity.o_d;
                    color = getColorFromDuration(markedCity.o_d, 5, 10, 20);
                    break;
                    */
                }

                markedCity.marker.setLabel(label);
                let icon = (<google.maps.Symbol>markedCity.marker.getIcon());
                icon.fillColor = color;
                icon.strokeColor = color;

                markedCity.marker.setOpacity(1);
            } else {
                markedCity.marker.setOpacity(0);
            }

            // Refresh
            markedCity.marker.setMap(null);
            markedCity.marker.setMap(map);
        }
    )
}

function initMap() {
    const geocoder = new google.maps.Geocoder();

    function addMarker(position: number): void {

        const displayPos = position + 1;

        const markedCity = <MarkedCity>cities[position];

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
            title: markedCity.n + "\n"
                + "o : " + markedCity.o + " (" + markedCity.o_d + ")\n"
                + "c : " + markedCity.c + "\n"
                + "via " + markedCity.via,
            map: map,
            zIndex: 1 / displayPos,
            clickable: true,
            opacity: 0
        });

        markedCity.marker.addListener('click', function (event) {
            const url = getUrl(markedCity);

            window.open(
                url,
                markedCity.n
            );
        });

        markedCities.push(markedCity);
    }
    
    cities.forEach((city: City, position: number) => addMarker(position))

    updateMarkers(type);
}