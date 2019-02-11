/// <reference path="../config.ts" />
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
        let p: HTMLElement = paragraphs[i]
        if (p.attributes.hasOwnProperty("itemprop") && (<any>p.attributes["itemprop"]).value == "availableAtOrFrom") {
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
                let colorFromOrder = getColorFromOrder(index);

                let table = document.createElement("table");
                table.style.backgroundColor = colorFromOrder;
                table.style.border = "solid 1px #8d8d8d"

                let row = document.createElement("tr");

                let link = document.createElement("a");
                link.href = getFullUrl(
                    city,
                    config.destinations[0],
                    config.destinations[1]
                );
                link.target = "top";
                link.innerText = city.n;
                link.style.color = colorFromOrder;

                let indexCell = addCell(`${index.toString()} `, "#FFF", row);
                indexCell.style.color = colorFromOrder;
                indexCell.appendChild(link);

                for (let i in config.destinations) {
                    let dest = config.destinations[i];
                    let cLink = document.createElement("a");
                    cLink.href = getUrl(city, dest);
                    cLink.target = "top";
                    let duration = getDuration(city, Number(i));
                    cLink.innerText = `${dest.for} : ${duration}`;
                    cLink.style.color = "black";
                    addCell("", getColorFromDuration(duration, dest.lower, dest.middle, dest.max), row).appendChild(
                        cLink
                    );
                }

                // Clean content
                while (p.hasChildNodes()) {
                    p.removeChild(<Node>p.firstChild);
                }

                table.appendChild(row);
                p.appendChild(table);

                // Finally set parent color
                (<HTMLElement>(<HTMLElement>p.parentElement).parentElement).style.borderColor = LightenDarkenColor(colorFromOrder, 50);
            } else {
                console.error(`Ville non trouvée : ${pCity}`);
            }
        }
    }
}