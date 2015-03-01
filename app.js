/*-------------------- MODULES --------------------*/
var		express = require('express'),
	 bodyParser = require('body-parser')
	MongoClient = require('mongodb').MongoClient,
			 jf = require('jsonfile'),
			  _ = require('underscore');

var app = express();
 

/*-------------------- SETUP --------------------*/
var app = express();
// .use is a middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(bodyParser.json());
app.use(function(req, res, next) {
    // Setup a Cross Origin Resource sharing
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('incoming request from ---> ' + ip);
    // Show the target URL that the user just hit
    var url = req.originalUrl;
    console.log('### requesting ---> ' + url);
    next();
});

app.use('/', express.static(__dirname + '/public'));


/*------------------- ROUTERS -------------------*/
app.post('/start', function(request, response) {
	// console.log(request.body);
	var loadedCountries = jf.readFileSync('data/countries_domains_languages.json');
	loadedCountries = _.filter(loadedCountries, function(obj){
		return obj.language_a_script == 'latin';
	});
	// console.log(loadedCountries);
	var loadedServices = jf.readFileSync('data/services.json');
	response.json({
		countries: loadedCountries,
		services: loadedServices
	});
});

function loadDomains(){
	console.log('Called loadDomains.');
}

// Create a project
app.post('/search', function(request, response) {
	console.log('Route: /search');
    console.log(request.body);
    console.log(request.body['letter[]']);
    console.log(request.body['service[]']);
    console.log(request.body['domain[]']);
	request.body['letter[]'] = _.map(request.body['letter[]'], function(item){
		return item.toLowerCase();
	});

    searchMongoDB(request.body, function(results){
    	console.log('Called callback.');
    	console.log(results);
	    response.json({
	    	error: null,
	        data: results
	    });    	
    });
});


/*------------------ FUNCTIONS ------------------*/
function searchMongoDB(query, callback){
	console.log('Called searchMongoDB.')
	console.log(query);

	MongoClient.connect('mongodb://127.0.0.1:27017/autocomplete', function(err, db) {
		console.log('Connecting to DB...');
		if(err) throw err;
		console.log('Connected.');
		var collection = db.collection('records');

		// Define query parameters
		var params = {};
		params.getParams = function(paramName, query){
			// console.log(this);
			var request = query[paramName+'[]'];
			console.log(request);
			if(request != undefined){
				console.log(Array.isArray(request));
				if(Array.isArray(request)){ // Array search
					this[paramName] = {'$in': request};	
				}else{					// Single param search
					this[paramName] = request;
				}
			}
			return this;
		}
		params.getParams('letter', query)
			  .getParams('service', query)
			  .getParams('domain', query);
		delete params.getParams;
		console.log(params);

		// Locate all the entries using find 
		collection.find(params).toArray(function(err, results) {
			// console.dir(results);
			callback(results);
			db.close();	// Let's close the db 
		});		

	});
}

function getParams(obj, param, query){
	// console.log(query[param+'s[]']);

	return obj;
}


/*----------------- INIT SERVER -----------------*/
var PORT = 3111; //the port you want to use
app.listen(PORT, function() {
    console.log('Server running at port ' + PORT + '. Ctrl+C to terminate.');
});