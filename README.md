# Home Sweet Home

## Pre-requisites
1. TODO define Google key procedure
1. Copy `config.example.ts` to `config.ts` and update it

1. Copy list of cities from Wikipedia to the spreadsheet
    - visit Wikipedia. Example https://fr.wikipedia.org/wiki/Liste_des_communes_du_Rh%C3%B4ne
    - Copy the table. Plugins exist to help: https://chrome.google.com/webstore/detail/table-capture/iebpjdmgckacbodjpijphcplhebcmeop
    - Make sure "postal code" is the third column
    - Paste it in spreadsheet at column A
1. Generate script
    `npm run build:spreadsheet`
1. Copy the generated `build/home_sweet_home.js` content to script editor
1. Run `step2_updateFromGPSLocations`
1. Run `step3_updateToFromDurations`
1. Copy `cities.example.ts` to `cities.ts`
1. Copy content of column U to the file