const config: Config = {
  "key" : "yourGoogleAPIKey",
  "workOnlyOnLines": 10,
  "destinations": [
    {
      "for": "Olivier",
      "lower": 50,
      "max": 70,
      "trainStations": [
        {
          "name": "Saint-André-le-Gaz",
          "durationInSeconds": 3900,
          "isDirect": true,
          "location": "45.545359,5.5210913"
        },
        {
          "name": "Virieu",
          "durationInSeconds": 3480,
          "isDirect": true,
          "location": "45.4907225,5.4710849"
        },
        {
          "name": "Châbons",
          "durationInSeconds": 3060,
          "isDirect": true,
          "location": "45.4383212,5.4198982"
        },
        {
          "name": "Le Grand-Lemps",
          "durationInSeconds": 2760,
          "isDirect": true,
          "location": "45.3962631,5.4142042"
        },
        {
          "name": "Rives",
          "durationInSeconds": 2280,
          "isDirect": true,
          "location": "45.3587391,5.4830712"
        },
        {
          "name": "Réaumont",
          "durationInSeconds": 2040,
          "isDirect": true,
          "location": "45.3685138,5.5338758"
        },
        {
          "name": "Voiron",
          "durationInSeconds": 1740,
          "isDirect": true,
          "location": "45.364443,5.594745"
        },
        {
          "name": "La Verpillière",
          "durationInSeconds": 5520,
          "isDirect": false,
          "location": "45.6277981,5.1426842"
        },
        {
          "name": "Bourgoin-Jallieu",
          "durationInSeconds": 4920,
          "isDirect": false,
          "location": "45.5830941,5.2650492"
        },
        {
          "name": "La Tour-du-Pin",
          "durationInSeconds": 4320,
          "isDirect": false,
          "location": "45.5601421,5.4420942"
        }
      ]
    },
    {
      "for": "Céline",
      "lower": 45,
      "max": 60,
      "location": "115 Chemin de l'Islon, 38670 Chasse-sur-Rhône"
    }
  ]
}