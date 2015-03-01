/* Your code starts here */

var app = {};

app.init = function() {
	console.log('Your code starts here!');

	loadGuiData();

	attachEvents();

	/*------------------ FUNCTIONS ------------------*/	

	// Loading the list of domais/countries and services from the server
	function loadGuiData(){
        $.post('/start', {}, function(response) {
            // console.log(response);
            if(response.error){
            	throw response.error	
            }else{

				var letters = [];
				for(var i = 65; i <= 90; i++){
					letters.push(String.fromCharCode(i));
				}
				generateGui('letters', letters);

				// console.log(response.services);
				var services = [];
				response.services.forEach(function(item){
					services.push(item.site);
				});
				// console.log(services);
				generateGui('services', services);

				// console.log(response.countries);
				var countries = [];
				response.countries.forEach(function(item){
					countries.push(item.country_name);
				});
				// console.log(services);
				generateGui('countries', countries);			
				// generateGui('domains', response.domains);

            }
        });		
	}

	// Generating the menu based on the data loaded from the server
	function generateGui(name, options){
		
		var searchOptions = $('<div class="search-options"></div>');
		var title = $('<h2>'+name+'</h2>')
		$(searchOptions).append(title);

		// Countries and Services
		if(name != 'letters'){
			options.forEach(function(item){
				// console.log(item);
	      		var div = $('<div class="checkbox-container"></div>');
				var checkbox = $('<input type="checkbox" name="'+name+'" value="'+item+'" id="'+item+'">');
				var label = $('<label for="'+item+'"></label>');
				var span = $('<span>'+item+'</span>');
				$(div).append(checkbox).append(label).append(span);
				$(searchOptions).append(div);
			});

		// Letters
		}else{
			var column;

			options.forEach(function(item, index){
				// console.log(item);
	      		var div = $('<div class="checkbox-container"></div>');
				var checkbox = $('<input type="checkbox" name="'+name+'" value="'+item+'" id="'+item+'">');
				var label = $('<label for="'+item+'"></label>');
				var span = $('<span>'+item+'</span>');
				$(div).append(checkbox).append(label).append(span);
				if(index % 9 == 0){
					column = $('<div class="column"></div>');
					$(searchOptions).append(column);
				}
				$(column).append(div);				
			});

		}

		$('#search-div').append(searchOptions);
	}

	// A function where we keep all user's interaction listener (buttons, etc)
	function attachEvents() {
	    console.log('Attaching Events');

		$('#hamburger').off('click').on('click', function() {
			moveMenu();
		});

	    // .off() is the same as removeEventListener
	    // it is needed to cancel out any duplications
	    $('#search-bt').off('click').on('click', function() {

	        moveMenu();
	        callLoader();

	        // Ajax call
	        $.post('/search', {
	            letters: getSelected('letters'),
	            services: getSelected('services'),
	            countries: getSelected('countries')
	        }, function(response) {
	            // console.log(response);
	            if(response.error) throw response.error
	            // console.log(response.data);
	            printResults(response.data);
	        });
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
			$('#search-div').animate({left: 0}, 500);	
		}else{
			$('#search-div').animate({left: -$('#search-div').outerWidth()}, 500);			
		}
	}

	// Show loading
	function callLoader(){
		$('#results-container').empty();
		var loader = $('<span class="loader"></span>');
		$('#results-container').append(loader);
	}

	// Show search results
	function printResults(data){
		console.log('Called printResults.')
		console.log(data);
		$('#results-container').empty();
		for(var i = 0; i < data.length; i++){
			var newDiv = $('<div class="results"></div>');

			var letter = $('<h2>' + data[i].letter + '</h2>');
			var description = $('<p>' + formatDate(data[i].date) + '<br>' +
						  				data[i].domain + '<br>' +
						  				data[i].language + '<br>' + '</p>');
			var predictions = $('<ul></ul>');
			for(var j = 0; j < data[i].results.length; j++){
				var prediction = $('<li>' + data[i].results[j] + '</li>');
				predictions.append(prediction);
			}

			$(newDiv).append(letter);
			$(newDiv).append(description);
			$(newDiv).append(predictions);
			$('#results-container').append(newDiv);
		}
	}

	// Formats UTC date to MM/DD/YYYY
	function formatDate(date){
		var newDate = new Date(date);
		var monthString = newDate.getMonth() + 1;
		if (monthString < 10) monthString = '0' + monthString;
		var dateString = newDate.getDate();
		var yearString = newDate.getFullYear();
		return monthString + '/' + dateString + '/' + yearString;
	}
}

app.init();