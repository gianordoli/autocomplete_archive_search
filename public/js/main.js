/* Your code starts here */

var app = {};

app.init = function() {

	loadGuiData();
	loadDates();
	attachEvents();

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
				var letters = [];
				for(var i = 65; i <= 90; i++){
					letters.push(String.fromCharCode(i));
				}
				generateGui('letters', letters);
				generateGui('services', response.services);
				generateGui('countries', response.countries);
            }
        });		
	}

	// Loading the dates to build the calendar
	function loadDates(){
        $.post('/date', {}, function(response) {
            // console.log(response);
            if(response.error){
            	throw response.error	
            }else{
				console.log(response.dateRange);
				generateGui('dates', response.dateRange);
            }
        });		
	}	

	// Generating the menu based on the data loaded from the server
	function generateGui(name, options){
		
		var searchOptions = $('<div class="search-options"></div>');
		var title = $('<h2>'+name+'</h2>')
		$(searchOptions).append(title);

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

		// Calendar
		}else if(name == 'dates'){
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
					span = $('<span>'+item.country_name+'</span>');					
	      		}
				$(div).append(checkbox).append(label).append(span);
				$(searchOptions).append(div);
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
	        queryDB();
	    });	
	}

	function queryDB(){
        var data = {
            'letter[]': getSelected('letters'),
            'service[]': getSelected('services'),
            'domain[]': getSelected('countries')
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
		console.log(data);
		$('#results-container').empty();
		$('#loader-container').remove();
		for(var i = 0; i < data.length; i++){
			var newDiv = $('<div class="results"></div>');

			var letter = $('<h2>' + data[i].letter + '</h2>');
			var description = $('<p>' + formatDateMMDDYYY(data[i].date) + '<br>' +
						  				data[i].domain + '<br>' +
						  				data[i].language + '<br>' +
										data[i].service + '<br>' + '</p>');
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

	// Capitalize first letter of any String
	String.prototype.capitalizeFirstLetter = function() {
    	return this.charAt(0).toUpperCase() + this.slice(1);
	}
}

app.init();