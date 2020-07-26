const shortid = require('shortid');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');
const { program } = require('commander');

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

(async () => {

	program
	  .option('-u, --url <type>', 'the url to screenshot', 'https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6')
	  .option('-t, --type <type>', 'the type of image. Options are jpeg and png. Default is png', 'png')
	  .option('-e, --elem <type>', 'the dom element to focus on')
	  .parse(process.argv);

	// console.log(process.argv);
	// console.log(`${program.type}`);


	const browser = await puppeteer.launch();

	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

	// await page.goto('https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6');

	// await loadUrl(page, 'https://www.arcgis.com/apps/opsdashboard/index.html#/bda7594740fd40299423467b48e9ecf6');
	// console.log(`${program.url}`);
	try {
		await loadUrl(page, `${program.url}`);

		// console.log(await page.content());
		await page.content();

		const short_id = shortid.generate();

	  	// await divElement.click();

		// function takeScreenshot(interceptedRequest) {
		// 	page.screenshot({path: 'screenshot1.png'});
		// }
		// page.on('load', takeScreenshot);
		// await page.on('load');

		// await page.screenshot({path: 'screenshot.png'});
		if (program.elem) {
			// const divElement = await page.$('div#ember61');
			const domElement = await page.$(`${program.elem}`);
			if (`${program.type}` == 'jpeg'){
				await domElement.screenshot({path: 'screenshots/screenshot_'+short_id+'.jpeg', quality: 100});
			}
			else{
				await domElement.screenshot({path: 'screenshots/screenshot_'+short_id+'.png'});
			}
		}
		else {
			if (`${program.type}` == 'jpeg'){
				await page.screenshot({path: 'screenshots/screenshot_'+short_id+'.jpeg', quality: 100});
			}
			else{
				await page.screenshot({path: 'screenshots/screenshot_'+short_id+'.png'});
			}
			// await page.screenshot({path: 'screenshot.png'});
			// await page.screenshot({path: 'screenshot.jpeg', quality: 100});	
		}

		await browser.close();

		if (program.elem) {
			filter_formula = 'AND({jasp_info_url} = "'+`${program.url}`+'", {jasp_info_element} = "'+`${program.elem}`+'")';
		}
		else {
			filter_formula = 'AND({jasp_info_url} = "'+`${program.url}`+'", {jasp_info_element} = "")';
		}

		console.log(filter_formula);

		base('am_Embed').select({
		    maxRecords: 1,
		    filterByFormula: filter_formula
		}).firstPage(function(err, records) {
		    if (err) { console.error(err); return; }
		    records.forEach(function(record) {
		        console.log('Retrieved', record.id);
		        recordId = record.id;

		        var file_name = "";
		        if (`${program.type}` == 'jpeg'){
					file_name = 'screenshot_'+short_id+'.jpeg';
				}
				else{
					file_name = 'screenshot_'+short_id+'.png';
				}

		        base('am_Embed').update([
				  {
				    "id": recordId,
				    "fields": {
				      "file_name": file_name
				    }
				  }
				], function(err, records) {
				  if (err) {
				    console.error(err);
				    return;
				  }
				  records.forEach(function(record) {
				    console.log(record.get('Name'));
				  });
				});
		    });
		});
	} catch (error) {
        console.log(error);
    }

})();
