/// <reference path="../config.ts" />
let paragraphs = document.getElementsByTagName("p");

function addCell(index: string, colorFromOrder: string, row: HTMLTableRowElement) {
    let td = document.createElement("td");
    td.innerText = index;
    td.style.backgroundColor = colorFromOrder;
    row.appendChild(td);

    return td;
}

// First add our stylesheet

let head = document.querySelector("head")

if (head) {
    let style = document.createElement("style")

    style.innerHTML = `
    table.city {
        border-spacing: 2px;
        border-collapse: separate;
        border-radius: 6px;
    }
    
    table.city td { 
        padding: 3px;
    }
    
    table.city td a {
        color: black;
    }
    `

    head.appendChild(style)
}
let greaseMonkeySweetHome = new HomeSweetHome(cities, config);
const destinationOutputs = greaseMonkeySweetHome.getDestinationOutputs();

// We consider the worse position for a city is after limit
const maxPositionCity = Math.min(greaseMonkeySweetHome.getCities().length, greaseMonkeySweetHome.config.limit);

for (let i in paragraphs) {
    if (paragraphs.hasOwnProperty(i)) {
        let p: HTMLElement = paragraphs[i]
        if (p.attributes.hasOwnProperty("itemprop") && (p.attributes[<any>"itemprop"]).value == "availableAtOrFrom") {
            let pCity = (<string>p.textContent).split(' ');
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
                let colorFromOrder = getColorFromOrder(index, maxPositionCity);

                let table = document.createElement("table");
                table.setAttribute("class", "city")
                table.style.backgroundColor = colorFromOrder

                let row = document.createElement("tr");

                let link = document.createElement("a");
                let url = getFullUrl(
                    city,
                    config.destinations[0],
                    config.destinations[1]
                );
                // Use onclick and not href because the parent element is clickable (hence the return false)
                link.onclick = () => {
                    window.open(url);
                    return false;
                };
                link.innerText = city.n

                let indexCell = addCell(`${index.toString()} `, colorFromOrder, row);
                indexCell.appendChild(link);

                for (let i in config.destinations) {
                    let dest = config.destinations[i];
                    let cLink = document.createElement("a");
                    // Use onclick and not href because the parent element is clickable (hence the return false)
                    let cUrl = getUrl(city, dest);
                    cLink.onclick = () => {
                        window.open(cUrl);
                        return false;
                    };
                    let duration = getDurationString(city, Number(i));
                    cLink.innerText = `${dest.for} : ${duration}`;
                    addCell("", getColorFromDuration(duration, destinationOutputs[i].min, destinationOutputs[i].max), row).appendChild(
                        cLink
                    );
                }

                // Clean content
                while (p.hasChildNodes()) {
                    p.removeChild(<Node>p.firstChild);
                }

                table.appendChild(row);
                p.appendChild(table);
            } else {
                console.error(`Ville non trouvée : ${pCity}`);
            }
        }
    }
}