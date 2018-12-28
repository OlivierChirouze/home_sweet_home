
let markers: google.maps.Marker[];

function addScript(scriptSrc: string) {
    let header = document.getElementsByTagName("head")[0];
    let scriptTag = document.createElement("script");
    scriptTag.type = "text/javascript";
    scriptTag.src = scriptSrc;
    header.appendChild(scriptTag);
}

for (let i in config.destinations) {
    let dest = config.destinations[i];
    let button = document.createElement('button');
    button.innerText = dest.for;
    button.onclick = () => {
        (<any>window).type = (i === 0) ? 'o' : 'c'; // TODO fix this
        updateMarkers();
    };
    (<HTMLElement>document.querySelector('#header')).appendChild(button);
    // TODO <button onclick="window.type='o_d';updateMarkers();">voiture olivier</button>
}

addScript("https://maps.googleapis.com/maps/api/js?key=" + config.key + "&callback=initMap");

let type = "order";

let map;

let max = 30;

function updateMarkers() {
    let label: string = "";
    let color: string = "";
    for (let i in cities) {

        let city = cities[i];

        if ((Number(i) + 1) <= max) {
            switch (type) {
                case "order":
                case "order_name":
                    label = "" + (Number(i) + 1);
                    if (type === "order_name") label += " " + city.n;
                    color = getColorFromOrder(i);
                    break;
                case "0":
                case "1":
                    label = "" + (type === "0" ? city.o : city.c); // TODO use index
                    let destConfig = config.destinations[parseInt(type)];
                    color = getColorFromDuration(city.c, destConfig.lower, destConfig.middle, destConfig.max);
                    break;
                // TODO
                /*
            case "o_d":
                label = "" + city.o_d;
                color = getColorFromDuration(city.o_d, 5, 10, 20);
                break;
                */
            }

            let marker = markers[i];

            marker.label.text = label;
            marker.icon.fillColor = color;
            marker.icon.strokeColor = color;

            marker.opacity = 1;
        } else {
            marker.opacity = 0;
        }

        // Refresh
        marker.setMap(null);
        marker.setMap(map);
    }
}

function getColorFromDuration(durationString, a, b, c) {
    let dur = getDuration(durationString);
    let color;
    if (dur <= a) {
        color = "#40ff00";
    } else if (dur <= b) {
        color = "#54fcff";
    } else if (dur <= c) {
        color = "#ffd176";
    } else {
        color = "#ff0000";
    }

    return color;
}

function getDuration(durationString) {
    const arr = durationString.split(":");
    return Number(arr[0]) * 60 + Number(arr[1]);
}

function getUrl(city) {
    const cityLocation = Number(city.lat.replace(',', '.')) + "," + Number(city.lng.replace(',', '.'));
    const url = "https://www.google.com/maps/dir/"
        + encodeURIComponent(city.via)
        + "/" + cityLocation
        + "/" + encodeURIComponent("115 Chemin de l'Islon, 38670 Chasse-sur-Rhône")
        + "/@45.4719624,5.0736569,11z/";
    return url;
}

function initMap() {
    const geocoder = new google.maps.Geocoder();

    let map: google.maps.Map;

    function addMarker(position: number) {

        const displayPos = Number(position) + 1;

        const city = cities[position];

        const location = {
            lat: Number(city.lat.replace(',', '.')),
            lng: Number(city.lng.replace(',', '.'))
        };

        if (map === undefined) {
            // Map will be centered on the first city in list
            map = new google.maps.Map(document.getElementById('map'), {
                zoom: 11,
                center: location
            });
        }

        // https://developers.google.com/maps/documentation/javascript/reference/3.exp/marker#MarkerOptions
        let marker = new google.maps.Marker({
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
            title: city.n + "\n"
                + "o : " + city.o + " (" + city.o_d + ")\n"
                + "c : " + city.c + "\n"
                + "via " + city.via,
            map: map,
            zIndex: 1 / displayPos,
            clickable: true,
            opacity: 0
        });

        marker.addListener('click', function () {
            const url = getUrl(city);

            window.open(
                url,
                city.n
            );
        });

        markers[position] = marker;
    }

    for (let position in cities) {
        addMarker(position);
    }

    (<HTMLSelectElement>document.getElementById("max")).value = max.toString();

    updateMarkers();
}