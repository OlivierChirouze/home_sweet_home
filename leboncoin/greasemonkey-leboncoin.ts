function getCityLocation(city: City) {
    return Number(city.lat.replace(',', '.')) + "," + Number(city.lng.replace(',', '.'));
}

function getFullUrl(city: City) {
    let cityLocation = getCityLocation(city);
    return "https://www.google.com/maps/dir/"
        + encodeURIComponent(city.via)
        + "/" + cityLocation
        + "/" + encodeURIComponent("115 Chemin de l'Islon, 38670 Chasse-sur-Rhône")
        + "/@45.4719624,5.0736569,11z/";
}

function getOUrl(city: City) {
    let cityLocation = getCityLocation(city);
    return "https://www.google.com/maps/dir/"
        + cityLocation
        + "/" + encodeURIComponent(city.via);
}

function getCUrl(city: City) {
    let cityLocation = getCityLocation(city);
    return "https://www.google.com/maps/dir/"
        + cityLocation
        + "/" + encodeURIComponent("115 Chemin de l'Islon, 38670 Chasse-sur-Rhône");
}

let paragraphs = document.getElementsByTagName("p");

function addCell(index: string, colorFromOrder: string, row: HTMLTableRowElement) {
    let td = document.createElement("td");
    td.innerText = index;
    td.style.backgroundColor = colorFromOrder;
    row.appendChild(td);

    return td;
}

for (let i in paragraphs) {
    if (paragraphs.hasOwnProperty(i)) {
        let p = paragraphs[i]
        if (p.attributes.hasOwnProperty("itemprop") && (<any>p.attributes["itemprop"]).value == "availableAtOrFrom") {
            let pCity = p.textContent.split(' ');
            let city: City | null = null;

            // By name and cp
            let exactCities = cities.filter((city: City) => city.n === pCity[0] && city.cp === pCity[1]);

            if (exactCities.length === 1) city = exactCities[0];
            else {
                // By name
                let nameCities = cities.filter((city: City) => city.n === pCity[0]);
                if (nameCities.length === 1) city = nameCities[0];
                else {
                    // By cp
                    let cpCities = cities.filter((city: City) => city.cp === pCity[1]);
                    if (cpCities.length === 1) {
                        city = cpCities[0];
                    }
                }

            }

            if (city !== null) {
                let index = cities.indexOf(city);
                let colorFromOrder = getColorFromOrder(index);

                let table = document.createElement("table");
                table.style.backgroundColor = colorFromOrder;

                let row = document.createElement("tr");

                let link = document.createElement("a");
                link.href = getFullUrl(city);
                link.target = "top";
                link.innerText = city.n;
                link.style.color = colorFromOrder;

                let indexCell = addCell(`${index.toString()} `, "#FFF", row);
                indexCell.style.color = colorFromOrder;
                indexCell.appendChild(link);

                // TODO handle this
                /*
                let oLink = document.createElement("a");
                oLink.href = getOUrl(city);
                oLink.target = "top";
                oLink.innerText = `(${city.o_d} -> ${city.via})`;
                oLink.style.color = "black";
                addCell("", getColorFromDuration(city.o_d, 5, 10, 20), row).appendChild(
                    oLink
                );
                */

                for (let i in config.destinations) {
                    let dest = config.destinations[i];
                    let cLink = document.createElement("a");
                    cLink.href = getCUrl(city);
                    cLink.target = "top";
                    cLink.innerText = `${dest.for} : ${city.c}`;
                    cLink.style.color = "black";
                    addCell("", getColorFromDuration(city.c, dest.lower, dest.middle, dest.max), row).appendChild(
                        cLink
                    );
                }

                // Clean content
                while (p.hasChildNodes()) {
                    p.removeChild(p.firstChild);
                }

                table.appendChild(row);
                p.appendChild(table);

                // Finally set parent color
                p.parentElement.parentElement.style.borderColor = LightenDarkenColor(colorFromOrder, 50);
            } else {
                console.error(`Ville non trouvée : ${pCity}`);
            }
        }
    }
}