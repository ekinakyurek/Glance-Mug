
var https = require('https')
var api_key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE';
var api_host = 'kgsearch.googleapis.com';


this.starter = function (test_input, debug, my_event_emitter, my_console_log) {
	
	var words = [];
//	var roots = [];
//	var roots_type = [];
	var printed_results = [];
	var isSomethingFound = false;

	var search_word = function (phrase, callback, limit) {
		if (debug) my_console_log('Searching for phrase :' + phrase);

		if (limit == undefined) {
			limit = 1;
		}

		var query_string = '/v1/entities:search?languages=tr&query=' + phrase + '&key=' + api_key + '&limit=1&indent=True'
		query_string = encodeURI(query_string)
		//my_console_log(query_string)
		https.get({

			host: api_host,
			path: query_string
		}, function (response) {
			// Continuously update stream with data
			var body = '';
			response.on('data', function (d) {
				body += d;
			});
			response.on('end', function () {
				var response = JSON.parse(body);
				var succeed = true;
				// control if it was succeed
				if (debug) my_console_log('Response for phrase :' + phrase + '\n');
				if (debug) my_console_log(response);

				if (response.hasOwnProperty('@context')) {
					succeed = true;

					var itemListElement = response['itemListElement'][0]
					if (debug) my_console_log('ItemlistElement for phrase : ' + phrase);
					if (debug) my_console_log(itemListElement);
					//my_console_log(itemListElement['result']);
					///my_console_log(itemListElement['resultScore']);
					if (itemListElement != [] && itemListElement != undefined)  {
						if(debug) my_console_log('Callback for phrase : '+ phrase);
						callback(succeed, itemListElement['result'], itemListElement['resultScore'])
					} else {
						if (debug) my_console_log('Failed callback for phras : '+ phrase + '\n');
						callback(true, null, null)
					}
				}else{
					if (debug) my_console_log('Failed result for phrase : '+ phrase);
					callback(false,null, null)
				}


				//my_console_log(response)
			});
		});
	}

	var init_state_machine = function (input) {
		if (debug) my_console_log('State machine is initialized with input: ')
		if (debug) my_console_log(input);
		if (input != '') {
			words = input.split(',')
			iterative_search(0);
		}else{
			finish()
		}
	}

	var iterative_search = function (index) {

		search_word(words[index], function (isSucceed, result, score) {

			if (isSucceed) {
			        			if(debug) my_console_log('result of :' + words[index])
							if (debug) my_console_log(result);
							printed_results.push(result);
							isSomethingFound = true
							if(my_event_emitter!=null) my_event_emitter.emit('result',result)
}else{
						        if(debug) my_console_log('nothing found for :' + words[index])	
			}
  if (index + 1 < words.length) {
                                                        iterative_search(index+1)
  }else{
	finish()	
  }
			}
		})
	}



	init_state_machine(test_input);
}

