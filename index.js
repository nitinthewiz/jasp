const ceil = require('ceil');
const shortid = require('shortid');
const Airtable = require('airtable');
const puppeteer = require('puppeteer');
const { program } = require('commander');

var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.MEDIATER_BASE_ID);
// var base = new Airtable({apiKey: ''}).base(''); //Add your API keys here from guide

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
	  .option('-v, --view <type>', 'the view type. Options are tv and mobile. Default is tv', 'tv')
	  .option('-w, --width <type>', 'the width of the page')
	  .option('-r, --row <type>', 'the airtable row ID.')
	  .option('-p, --producerRec <type>', 'The respective producer table recordID.')
	  .parse(process.argv);

	// console.log(process.argv);
	// console.log(`${program.type}`);


	// set headless false for testing
	// const browser = await puppeteer.launch({headless: false});
	const browser = await puppeteer.launch();
	

	const page = await browser.newPage();
	VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: 2 };
	if (program.width){
		// the + 88 is an ugly hack. Make Nipun set the correct viewport width in airtable.
		VIEWPORT = Object.assign({}, VIEWPORT, { width: ceil(Number(program.width) + 88) });
		// VIEWPORT = { width: 1920, height: 1080, deviceScaleFactor: 2 };
	}
	// console.log(VIEWPORT);
	await page.setViewport(VIEWPORT);

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
			// This code should ideally go outside this program.elem block, because, why
			// not take a full screenshot of the entire page, right? But for some reason,
			// it throws an error of 
			// Protocol error (Page.captureScreenshot): Unable to capture screenshot
			// for node index.js -u "https://observablehq.com/@elaval/coronavirus-worldwide-evolution"
			// and so we'll have to figure that out at some later point.
			// I can bet Nipun will ask for this at some point :D
			// https://github.com/puppeteer/puppeteer/issues/2423#issuecomment-590738707
			const fullPage = await page.$('body');
			const fullPageSize = await fullPage.boundingBox();
			// console.log(ceil(fullPageSize.height));
		    await page.setViewport(
		      Object.assign({}, VIEWPORT, { height: ceil(fullPageSize.height) })
		    );
			// const divElement = await page.$('div#ember61');
			const domElement = await page.$(`${program.elem}`);
			// this is redundant, but I'm keeping it here as an error
			// check. If after the page content has loaded, this waitforselector
			// doesn't return immediately, the script should fail.
			await page.waitForSelector(`${program.elem}`);
			// await page.evaluate((elem_to_move_to) => {
			//    document.querySelector(elem_to_move_to).scrollIntoView();
			// }, `${program.elem}`);

			// waitForTimeout doesn't work in the current version of puppeteer.
			// If we update the version, use this function instead of a normal timeout.
			// await page.waitForTimeout(1000).then(() => console.log('Waited a second!'));
			
			if (`${program.type}` == 'jpeg'){
				// await page.screenshot({
		  //         clip: await domElement.boundingBox(),
		  //         path: 'screenshots/screenshot_'+short_id+'.jpeg',
		  //         quality: 100
		  //       });
				await domElement.screenshot({path: 'screenshots/screenshot_'+short_id+'.jpeg', quality: 100});
			}
			else{
				// https://github.com/puppeteer/puppeteer/issues/2423#issuecomment-493188223
				// await page.screenshot({
		  //         clip: await domElement.boundingBox(),
		  //         path: 'screenshots/screenshot_'+short_id+'.png'
		  //       });
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

		// comment browser.close for testing
		await browser.close();

		if (program.elem) {
			filter_formula = 'AND({jasp_info_url} = "'+`${program.url}`+'", {jasp_info_element} = "'+`${program.elem}`+'")';
		}
		else {
			filter_formula = 'AND({jasp_info_url} = "'+`${program.url}`+'", {jasp_info_element} = "")';
		}

		// console.log(filter_formula);

		var file_name = "";
        if (`${program.type}` == 'jpeg'){
			file_name = 'screenshot_'+short_id+'.jpeg';
		}
		else{
			file_name = 'screenshot_'+short_id+'.png';
		}

		base('am_JaspPayload').update([
		  {
		    "id": program.row,
		    "fields": {
		      "file_name": file_name
		    }
		  }
		], function(err, records) {
		  if (err) {
		    console.error(err);
		    return;
		  }
		});

		if (program.producerRec !== undefined){
			// TO UPDATE CovidProducer with filename 	
			base('CovidFeedUSA_Producer').update([
			  {
			    "id": program.producerRec,
			    "fields": {
			      "data_output": file_name,
			      "payload": "https://" + process.env.AWS_S3_BUCKET + ".s3-" + process.env.AWS_REGION + ".amazonaws.com/screenshots/" + file_name
			    }
			  }
			], function(err, records) {
			  if (err) {
			    console.error(err);
			    return;
			  }
			});
		}


		// base('am_Embed').select({
		//     maxRecords: 1,
		//     filterByFormula: filter_formula
		// }).firstPage(function(err, records) {
		//     if (err) { console.error(err); return; }
		//     records.forEach(function(record) {
		//         // console.log('Retrieved', record.id);
		//         recordId = record.id;

		//         var file_name = "";
		//         if (`${program.type}` == 'jpeg'){
		// 			file_name = 'screenshot_'+short_id+'.jpeg';
		// 		}
		// 		else{
		// 			file_name = 'screenshot_'+short_id+'.png';
		// 		}

		//         base('am_Embed').update([
		// 		  {
		// 		    "id": recordId,
		// 		    "fields": {
		// 		      "file_name": file_name
		// 		    }
		// 		  }
		// 		], function(err, records) {
		// 		  if (err) {
		// 		    console.error(err);
		// 		    return;
		// 		  }
		// 		});
		//     });
		// });
	} catch (error) {
        console.log(error);
        await browser.close();
        // process.exit(1)
    }

})();
