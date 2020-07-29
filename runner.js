var shell = require('shelljs');
const shortid = require('shortid');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');

var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.MEDIATER_BASE_ID);

// https://stackoverflow.com/questions/46948489/puppeteer-wait-page-load-after-form-submit
async function loadUrl(page, url) {
    try {
        await page.goto(url, {
            timeout: 60000,
            waitUntil: ['load', 'domcontentloaded', 'networkidle0', 'networkidle2']
        });
    } catch (error) {
        throw new Error("url " + url + " url not loaded -> " + error);
    }
}

async function launcher() {

    filter_formula = 'AND({Animated} = "Static")';

    await base('am_Embed').select({
        // set maxRecords 1 for testing
        // maxRecords: 1,
        filterByFormula: filter_formula
    }).firstPage(async function(err, records) {
        if (err) { console.error(err); return; }
        records.forEach(async function(record) {
            // console.log(record);
            // console.log(record.id);
            // console.log(record.get("jasp_info_element"));
            // console.log(record.get("jasp_info_url"));
            recordId = record.id;

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

            run_cmd = run_cmd + " -r \"" + record.id + "\"";

            // console.log(run_cmd);

            // Run external tool synchronously
            if (shell.exec(run_cmd).code !== 0) {
              shell.echo('Error: node command failed');
              shell.exit(1);
            }

        });
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