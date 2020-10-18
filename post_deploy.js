const request = require('request');
const Airtable = require('airtable');

var base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.MEDIATER_BASE_ID);

const options = {
  url: 'https://api.github.com/repos/nitinthewiz/jasp/releases/latest',
  headers: {
    'User-Agent': 'request'
  },
  json: true
};

request(options, (err, res, body) => {
  if (err) { 
      return console.log(err); 
  }
  var github_release_url = body.url;
  console.log(body.url);

  var filter_formula = 'AND({release_type} = "jasp_github_release")';
  base('am_JaspPayload').select({
	    filterByFormula: filter_formula
	}).firstPage(function(err, records) {
	    if (err) { console.error(err); return; }
	    records.forEach(function(record) {
	        // console.log('Retrieved', record.id);
	        recordId = record.id;
	        base('am_JaspPayload').update([
			  {
			    "id": recordId,
			    "fields": {
			      "url": github_release_url
			    }
			  }
			], function(err, records) {
			  if (err) {
			    console.error(err);
			    return;
			  }
			});
	    });
	});
});