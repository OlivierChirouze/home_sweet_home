function addScript(scriptSrc: string) {
    let header = document.getElementsByTagName("head")[0];
    let scriptTag = document.createElement("script");
    scriptTag.type = "text/javascript";
    scriptTag.src = scriptSrc;
    header.appendChild(scriptTag);
}


let type = "order";

let map: google.maps.Map;

let max = 30;

interface MarkedCity extends City {
    marker: google.maps.Marker;
}

config.destinations.forEach((dest: any, i: number) => {
        let button = document.createElement('button');
        button.innerText = dest.for;
        button.onclick = () => {
            type = i === 0 ? 'o' : 'c'; // TODO fix this
            updateMarkers();
        };
        (<any>document).querySelector('#header').appendChild(button);
        // TODO <button onclick="window.type='o_d';updateMarkers();">voiture olivier</button>
    }
)

addScript("https://maps.googleapis.com/maps/api/js?key=" + config.key + "&callback=initMap");


function updateMarkers() {
    cities.forEach((c: City, i: number) => {
            let city = <MarkedCity>c;

            if (i + 1 <= max) {
                let label = "";
                let color = "";

                switch (type) {
                    case "order":
                    case "order_name":
                        label = "" + (i + 1);
                        if (type === "order_name") label += " " + city.n;
                        color = getColorFromOrder(i);
                        break;
                    case "0":
                    case "1":
                        label = "" + (type === "0" ? city.o : city.c); // TODO use index
                        let destConfig = config.destinations[Number(type)];
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

                city.marker.setLabel(label);
                let icon = (<google.maps.Symbol>city.marker.getIcon());
                icon.fillColor = color;
                icon.strokeColor = color;

                city.marker.setOpacity(1);
            } else {
                city.marker.setOpacity(0);
            }

            // Refresh
            city.marker.setMap(null);
            city.marker.setMap(map);
        }
    )
}

function initMap() {
    const geocoder = new google.maps.Geocoder();

    function addMarker(position: number): void {

        const displayPos = position + 1;

        const city = <MarkedCity>cities[position];

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
        city.marker = new google.maps.Marker({
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

        city.marker.addListener('click', function (event) {
            const url = getUrl(city);

            window.open(
                url,
                city.n
            );
        });
    }
    
    cities.forEach((city: City, position: number) => addMarker(position))

    updateMarkers();
}