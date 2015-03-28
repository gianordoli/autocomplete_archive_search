/* Your code starts here */

var app = {};

app.init = function() {

	// GLOBALS
	var countries = [];
	var sites = {
		youtube: { client: 'youtube', ds: 'yt', address: 'https://www.youtube.com/results?search_query=X' },
		books: { client: 'books', ds: 'bo', address: 'https://www.google.com/search?q=X&tbm=bks' },
		products: { client: 'products-cc', ds: 'sh', address: 'https://www.google.com/#q=X&tbm=shop' },
		news: { client: 'news-cc', ds: 'n', address: 'https://www.google.com/#q=X&tbm=nws' },
		images: { client: 'img', ds: 'i', address: 'https://www.google.com/search?site=imghp&tbm=isch&q=X' },
		web: { client: 'psy', ds: '', address: 'https://www.google.com/#q=X' },
		recipes: { client: 'psy', ds: 'r', address: 'https://www.google.com/search?tbs=rcp&q=X'  }
	};

	loadGuiData();

	/*------------------ FUNCTIONS ------------------*/	

	// Loading the list of domais/countries and services from the server
	function loadGuiData(){
        $.post('/start', {}, function(response) {
            // console.log(response);
            if(response.error){
            	throw response.error	
            }else{
				// console.log(response.services);
				// console.log(response.countries);
				// console.log('dates:' + response.dateRange);				
				var letters = [];
				for(var i = 65; i <= 90; i++){
					letters.push(String.fromCharCode(i));
				}
				generateGui('dates', response.dateRange, attachEvents);
				generateGui('letters', letters, attachEvents);
				generateGui('services', response.services, attachEvents);
				generateGui('countries', response.countries, attachEvents);

				countries = response.countries;	// store this one as global
            }
        });		
	}

	// Generating the menu based on the data loaded from the server
	function generateGui(name, options, callback){
		
		$('div[name='+name+']').remove();
		var searchOptions = $('<div name="'+name+'" class="search-options"></div>');
		var title = $('<h2>'+name+'</h2>');
		$(searchOptions).append(title);

		if(name != 'dates'){

			// Select All / Clear buttons
			var btAll = $('<button class="selection-buttons" name="select">Select all</button>');
			var btNone = $('<button class="selection-buttons" name="clear">Clear</button>');
			$(searchOptions).append(btAll).append(btNone).append($('<br/>'));

			// Letters
			if(name == 'letters'){
				var column;
				options.forEach(function(item, index){
					// console.log(item);
					var div, checkbox, label, span;
		      		div = $('<div class="checkbox-container"></div>');
					checkbox = $('<input type="checkbox" name="'+name+'" value="'+item+'" id="'+item+'">');
					label = $('<label for="'+item+'"></label>');
					span = $('<span>'+item+'</span>');
					$(div).append(checkbox).append(label).append(span);
					if(index % 9 == 0){
						column = $('<div class="column"></div>');
						$(searchOptions).append(column);
					}
					$(column).append(div);				
				});

			// Countries and Services
			}else{
				options.forEach(function(item){
					// console.log(item);
					var div, checkbox, label, span;
		      		div = $('<div class="checkbox-container"></div>');
		      		if(name == 'services'){
		      			checkbox = $('<input type="checkbox" name="'+name+'" value="'+item.site+'" id="'+item.site+'">');	
						label = $('<label for="'+item.site+'"></label>');
						span = $('<span>'+item.site+'</span>');	      			
		      		}else if(name == 'countries'){
						checkbox = $('<input type="checkbox" name="'+name+'" value="'+item.domain+'" id="'+item.domain+'">');	
						label = $('<label for="'+item.domain+'"></label>');
						span = $('<span>'+item.language_a_name+'</span>');					
		      		}
					$(div).append(checkbox).append(label).append(span);
					$(searchOptions).append(div);
				});			
			}

		// Calendar
		}else{
			options.forEach(function(item, index, list){
				var div, span, input, inputName, inputValue;
				if(index == 0){
					inputName = 'from';
				}else{
					inputName = 'to';
				}
				div = $('<div class="date-container"></div>');
				span = $('<span>'+inputName.capitalizeFirstLetter()+'</span><br/>')
				input = $('<input type="date" name="'+inputName+'" min="'+formatDateYYYYMMDD(list[0])+'" max="'+formatDateYYYYMMDD(list[1])+'">');
				$(input).val(formatDateYYYYMMDD(item));
				$(div).append(span).append(input);
				$(searchOptions).append(div);
				console.log('Parsed date: ' + formatDateYYYYMMDD(item));
			});
		}
		// Append div to caontainer
		$('#search-div').append(searchOptions);

		// Dates is the last; It will call the attachEvents() function
		if(callback != undefined){
			callback();			
		}
	}

	// A function where we keep all user's interaction listener (buttons, etc)
	function attachEvents() {
	    console.log('Attaching Events');

	    // .off() is the same as removeEventListener
	    // it is needed to cancel out any duplications
		$('#hamburger').off('click').on('click', function() {
			moveMenu();
		});

	    $('#search-bt, #save-img-bt, #save-db-bt').off('click').on('click', function() {
	    	var id = $(this).attr('id');
	    	var mode = id.substring(id.indexOf('-') + 1, id.lastIndexOf('-'));
	    	console.log(mode);
	    	if(mode == '-') mode = undefined;
	    	validateSearch(function(error, response){
	    		console.log(error);
	    		if(!error){
			        moveMenu();
			        callLoader();
			        queryDB(mode);
	    		}else{
	    			console.log(response);
	    			// displayAlert(response);
	    		}
	    	});
	    });		    

		$('.selection-buttons').off('click').on('click', function() {
			var inputs = $(this).parent().find('input');
			if($(this).attr('name') == 'select'){
				$(inputs).prop('checked', true);
			}else{
				$(inputs).prop('checked', false);
			}
		});

		// Reload list of languages based on selected service
		$('input[name=services]').off('change').on('change', function(){
			// console.log($(this).val());
			var services = getSelected('services');
			console.log(services);
			if(services.length > 0){
				$.post('/filter', {
					'service[]': services
				}, function(response) {
					console.log(response);
					generateGui('countries', response.countries, attachEvents);
				});			
			}
		});
	}

	function displayAlert(response){
		var msg = 'Choose at least one ';
		response.forEach(function(value, index, list){
			if(index > 0){
				msg += ', ';
				if(index == list.length - 1) msg += 'and ';
			}
			msg += value;
		});
		msg += '.';
		alert(msg);
	}

	function validateSearch(callback){
		var divs = $('#search-div .search-options');
		// console.log(divs);
		
		var unchecked = [];

		$(divs).each(function(index, obj){
			var isSelected = false;
			var name = "";

			var inputs = $(obj).find('input[type=checkbox]');
			// console.log(inputs.length);

			// Removing date inputs
			if(inputs.length > 0){
				$(inputs).each(function(index, obj){
					name = $(obj).attr('name');
					if($(obj).prop('checked')){
						isSelected = true;
					}
				});

				if(!isSelected){
					unchecked.push(name);
				}
			}
		});		

		// console.log(unchecked);
		if(unchecked.length == 0){
			callback(false);
		}else{
			unchecked = _.map(unchecked, function(value, index){
				var singular = value.substring(0, value.length - 1);
				if(singular == 'countrie') singular = 'country';
				return singular;
			});
			console.log(unchecked);
			callback(true, unchecked);
		}
	}

	function queryDB(mode){

		var from = convertToServerTimeZone($('input[type=date][name=from]').val());
		var to = convertToServerTimeZone($('input[type=date][name=to]').val());
		console.log('from: ' + from);
		console.log('to: ' + to);
		// min = new Date(from);
		// console.log('from: ' + from);

        var data = {
            'letter[]': getSelected('letters'),
            'service[]': getSelected('services'),
            'domain[]': getSelected('countries'),
            'date[]': [from, to],
            'mode': mode
        }

        // Ajax call
        $.post('/search', data,
        function(response) {
            // console.log(response);
            if(response.error) throw response.error
            // console.log(response.data);
            printResults(response.data);
        });
	}

	// Get the selected checkboxes
	function getSelected(checkBoxName){
        var selected = [];
        $('input[name='+checkBoxName+']:checked')
			.each(function(index, obj){
	        	selected.push($(obj).val());
	        });
        return selected;
	}

	// Show/hide sidebar
	function moveMenu(){
		if($('#search-div').offset().left < 0){
			$('#search-div').animate({left: 0}, 300);	
		}else{
			$('#search-div').animate({left: -$('#search-div').outerWidth()}, 300);			
		}
	}

	// Show loading
	function callLoader(){
		$('#results-container').empty();
		var loaderContainer = $('<div id="loader-container"></div>')
		var loader = $('<span class="loader"></span>');
		$(loaderContainer).append(loader);
		$('body').append(loaderContainer)
	}

	// Show search results
	function printResults(data){
		console.log('Called printResults.')
		// console.log(data);

		data = _.sortBy(data, function(item, index, list){
			return item.language;
		});

		$('#results-container').empty();
		$('#loader-container').remove();
		for(var i = 0; i < data.length; i++){
			var newDiv = $('<div class="results"></div>');

			var letter = $('<h2>' + data[i].letter + '</h2>');
			var country = _.find(countries, function(obj){
				return obj['domain'] == data[i].domain;
			});
			country = country['country_name'];
			// console.log(country);
			var details = $('<ul class="details">' +
								'<li>' + formatDateMMDDYYY(data[i].date) + '</li>' +
						  		'<li>' + country + '</li>' +
						  		'<li>' + data[i].language + '</li>' +
								'<li>' + data[i].service + '</li>' +
							'</ul>');

			var predictions = $('<ul></ul>');
			for(var j = 0; j < data[i].results.length; j++){

        		var query = data[i].results[j];
        		while(query.indexOf(' ') > -1){
        			query = query.replace(' ', '+') 
        		}
        		var link = sites[data[i].service].address;
        		link = link.replace('X', query);
        		link += "&hl=" + data[i].language;

				var prediction = $('<li><a href ="'+link+'" target="_blank">' + data[i].results[j] + '</a></li>');
				predictions.append(prediction);
			}

			$(newDiv).append(letter).append(predictions).append(details);
			$('#results-container').append(newDiv);
		}
	}

	// Formats UTC date to MM/DD/YYYY
	function formatDateMMDDYYY(date){
		var newDate = new Date(date);
		var monthString = newDate.getMonth() + 1;
		if (monthString < 10) monthString = '0' + monthString;
		var dateString = newDate.getDate();
		var yearString = newDate.getFullYear();
		return monthString + '/' + dateString + '/' + yearString;
	}

	// Formats UTC date to YYYY-MM-DD (for input[type=date])
	function formatDateYYYYMMDD(date){
		var newDate = new Date(date);
		var monthString = newDate.getMonth() + 1;
		if (monthString < 10) monthString = '0' + monthString;
		var dateString = newDate.getDate();
		var yearString = newDate.getFullYear();
		return yearString + '-' + monthString + '-' + dateString;
	}

	function convertToServerTimeZone(date){
	    //EST
	    var localToUtcOffsetMin = new Date().getTimezoneOffset();
	    var localToUtcOffsetMillis = localToUtcOffsetMin * 60000;
	    var clientDateMillis = Date.parse(new Date(date));
	    var serverDateMillis = clientDateMillis + localToUtcOffsetMillis;
	    return serverDateMillis;
	    // offset = -5.0
	    // clientDate = new Date(date);
	    // utc = clientDate.getTime() + (clientDate.getTimezoneOffset() * 60000);
	    // serverDate = new Date(utc + (3600000*offset));
	    // console.log(serverDate.toLocaleString());
	}

	// Capitalize first letter of any String
	String.prototype.capitalizeFirstLetter = function() {
    	return this.charAt(0).toUpperCase() + this.slice(1);
	}
}

app.init();