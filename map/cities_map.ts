/// /// <reference path="./model.ts" /> ../node_modules/stats-lite/stats.js

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

interface MarkedCity extends City {
    marker: google.maps.Marker;
}

config.destinations.forEach((dest: any, i: number) => {
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
    let max = (<any>document).getElementById("max").value;

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
                        let duration = getDuration(markedCity, Number(type));
                        label = duration.toString();
                        let destConfig = config.destinations[Number(type)];
                        color = getColorFromDuration(duration, destConfig.lower, destConfig.middle, destConfig.max);
                        break;
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
        let title = markedCity.n;

        config.destinations.forEach((dest: any, i: number) => {
                title += `\n${dest.for}: ${getDuration(markedCity, i)}`;
                if (isATrainDestination(dest))
                    title += ` (${getDurationVia(markedCity, i)})\n`;
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

        markedCity.marker.addListener('click', function (event) {
            const url = getFullUrl(
                markedCity,
                config.destinations[0],
                config.destinations[1]
            );

            window.open(
                url,
                markedCity.n
            );
        });

        markedCities.push(markedCity);
    }

    cities.forEach((city: City, position: number) => addMarker(position));

    updateMarkers(type);
}