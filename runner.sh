#!/bin/bash

echo "Screenshot John Hopkins Covid-19 ArcGIS page"
node index.js -u "https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6"

echo "Screenshot John Hopkins Covid-19 ArcGIS world map"
node index.js -u "https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6" -e ".map"

echo "Screenshot eleval observablehq div"
node index.js -u "https://observablehq.com/@elaval/coronavirus-worldwide-evolution" -e "div#el2"

echo "Screenshot eleval observablehq page"
node index.js -u "https://observablehq.com/@elaval/coronavirus-worldwide-evolution"

echo "Screenshot worldspandemic World card"
node index.js -u "https://worldspandemic.com/"  -e ".cov19u-card"

echo "Screenshot worldspandemic Total World chart"
node index.js -u "https://worldspandemic.com/"  -e ".covid19-ultimate-evolution-chart"

echo "Screenshot worldspandemic Daily New Cases World chart"
node index.js -u "https://worldspandemic.com/"  -e ".covid19-ultimate-daily-chart"

echo "UW IHME - Total Deaths"
node index.js -u "https://covid19.healthdata.org/united-states-of-america"  -e "#total-deaths"

echo "State scorecard test - AZ"
node index.js -u "https://projects.propublica.org/reopening-america/" -e "#state-row-AZ"

echo "zip the folder"
zip -r screenshots.zip screenshots/
cp screenshots.zip /tmp/.
