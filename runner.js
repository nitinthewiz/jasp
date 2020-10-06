var shell = require('shelljs');
const shortid = require('shortid');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');

var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.MEDIATER_BASE_ID);
// var base = new Airtable({apiKey: ''}).base(''); // Add mine here the revert while pushing 

async function launcher() {

    filter_formula = 'AND({Animated} = "Static")';

    await base('am_JaspPayload').select({
        // set maxRecords 1 for testing
        // maxRecords: 1,
        filterByFormula: filter_formula
    // }).firstPage(async function(err, records) {
    }).eachPage(function page(records, fetchNextPage) {
        // if (err) { console.error(err); return; }
        records.forEach(async function(record) {
            // console.log(record);
            // console.log(record.id);
            // console.log(record.get("jasp_info_element"));
            // console.log(record.get("jasp_info_url"));
            recordId = record.id;
            var producerRec = record.get("CovidFeedUSA_Producer")[0]; //Note - only pulls 1st connected record, in case multiple then will need to update this code

            var run_cmd = ""

            if (record.get("jasp_info_element")) {
                run_cmd = "node index.js -u \"" + record.get("jasp_info_url") + "\" -e \"" + record.get("jasp_info_element") + "\"";
            }
            else {
                run_cmd = "node index.js -u \"" + record.get("jasp_info_url") + "\"";
            }

            if (record.get("view_type") == "mobile") {
                run_cmd = run_cmd + " -w \"" + record.get("dimension - width") + "\"";
            }
            // console output because otherwise travis fails after 10 minutes.

            run_cmd = run_cmd + " -r \"" + record.id + "\"";
            run_cmd = run_cmd + " -p \"" + producerRec + "\"";

            console.log(run_cmd);


            // Run external tool synchronously
            if (shell.exec(run_cmd).code !== 0) {
              shell.echo('Error: node command failed');
              shell.exit(1);
            }

        });
        fetchNextPage();
    }, function done(err) {
        if (err) { console.error(err); return; }
        if (shell.exec("zip -r screenshots.zip screenshots/").code !== 0) {
          shell.echo('Error: zip command failed');
          shell.exit(1);
        }
        if (shell.exec("cp screenshots.zip /tmp/.").code !== 0) {
          shell.echo('Error: zip copy command failed');
          shell.exit(1);
        }
    });

};

launcher();