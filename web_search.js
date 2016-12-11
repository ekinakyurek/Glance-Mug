'use strict'

//For logging/////
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

var my_console_log = function(d) { //
	if (util!=null) {
		log_file.write(util.format(d) + '\n');
		log_stdout.write(util.format(d) + '\n');
	}else{
		console.log(d);
	}
};
////////////////////

//Input
var test_input = "Yasaklar konulsa da güneş balçıkla sıvanmaz RTÜK gerekçesi huzur ve güven ortamının bozuyor yasak,Noun konul,Other da,Other güneş,Noun balçık,Noun sıva,Other RTÜK,Noun gerekçe,Noun huzur,Noun ve,Other güven,Noun ortam,Noun boz,Other";


//required global variables
var debug = false;
var https = require('https')
var api_key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE';
var api_host = 'kgsearch.googleapis.com';


var main = function (test_input, my_event_emitter) {

	var words = [];
	var roots = [];
	var roots_type = [];
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

//testing
// search_word('google', function(result, response){});

	var init_state_machine = function (input) {
		if (debug) my_console_log('State machine is initialized with input: ')
		if (debug) my_console_log(input);

		var input_array = input.split(" ");
		words = input_array.slice(0, input_array.length / 2);
		var temp_roots = input_array.slice(input_array.length / 2, input_array.length);

		for (var i = 0; i < temp_roots.length; i++) {
			var root_and_type = temp_roots[i].split(',');

			roots_type.push(root_and_type[1]);
		    roots.push(root_and_type[0]);
		}
		if(debug) my_console_log('Input words : ');
		if(debug) my_console_log(words);
		if(debug) my_console_log('Input roots : ');
		if(debug) my_console_log(roots);

		first_search(0);
	}

	var first_search = function (index) {

		search_word(words[index], function (isSucceed, result, score) {

			if (isSucceed) {
				if (debug) my_console_log('Callback for word is succeed :' + words[index]);
				if (score != null) {
					if (index + 1 < words.length) {
						if (debug) my_console_log('Word is going to iteration : ' + words[index]);
						iterasyon(result, score, index + 1, words[index])
					} else {
						if (roots_type[index]=='Noun') {
							if(debug) my_console_log('last word is noun here is the result of :' + words[index])
							if (debug) my_console_log(result);
							printed_results.push(result);
							isSomethingFound = true
							if(my_event_emitter!=null) my_event_emitter.emit('result',result)
						} else {
							if(debug) my_console_log('last word is not noun :' + words[index])
							if (debug) my_console_log(result);
							//save for causion
						}
						finish();
					}
				} else {
					if (debug) my_console_log('Word is going to root_serach : ' + words[index]);
					root_search(index)
				}
			}else{
				if (debug) my_console_log('Callback for word is failed :' + words[index]);
			}
		})
	}

	var root_search = function (index) {
		search_word(roots[index], function (isSucceed, result, score) {
			if (isSucceed) {
				if (debug) my_console_log('Callback for root is succeed :' + roots[index]);
				if (score != null) {
					if (index + 1 < words.length) {
						if (debug) my_console_log('Root is going to iteration : ' + roots[index]);
						iterasyon(result, score, index + 1, roots[index])
					} else {
						if (roots_type[index]=='Noun') {
							if(debug) my_console_log('Last root is noun here is the result of :' + roots[index])
							if (debug) my_console_log(result);
							printed_results.push(result);
							isSomethingFound = true
							if(my_event_emitter!=null) my_event_emitter.emit('result',result);
						} else {
							if (debug) my_console_log('Last root is not noun :' + roots[index])
							if (debug) my_console_log(result);
							//save for causion
						}
					}
				} else {
					if (debug) my_console_log('Zero score even in the root. It is going next word search :' + roots[index])
					if (debug) my_console_log(result);
					first_search(index + 1)
				}
			}else{
				if (debug) my_console_log('Callback for root is failed :' + roots[index]);
			}
		})
	}
	var iterasyon = function (result, score, index, phrase) {
		var new_phrase = phrase + ' ' + words[index];
		if (debug) my_console_log('Iteration for phrase : ' + new_phrase);

		search_word(new_phrase, function (isSucceed, result2, score2) {
			if (isSucceed) {
				if (debug) my_console_log('Callback for iteration phrase is succeed :' + new_phrase);
				if (debug) my_console_log('Score for phrase is' + score2  + ' : ' + new_phrase)
				if (score2 != null && score2 >= score) {
					if (debug) my_console_log('iteration phrase is going next iteration :' + new_phrase);
					iterasyon(result2, score2, index + 1, new_phrase)
				} else if (score2 == null || score2 < score) {
					if (debug) my_console_log('iteration phrase is going root iteration :' + new_phrase);
					root_iterasyon(result, score, index, phrase)
				}
			}else{
				if (debug) my_console_log('Callback for iteration phrase is failed :' + new_phrase);
			}
		})
	}

	var root_iterasyon = function (result, score, index, phrase) {
		var new_phrase = phrase + ' ' + roots[index];
		if (debug) my_console_log('Root iteration for phrase : ' + new_phrase);
		search_word(new_phrase, function (isSucceed, result2, score2) {
			if (isSucceed) {
				if (debug) my_console_log('Callback for root iteration phrase is succeed :' + new_phrase);
				if (debug) my_console_log('Score for phrase is' + score2 + ' : ' + new_phrase)
				if (score2 != null && score2 >= score) {
					if (debug) my_console_log('Root iteration phrase is going next iteration :' + new_phrase);
					iterasyon(result2, score2, index + 1, new_phrase)
				} else if (score2 == null || score2 < score) {
					if (debug) my_console_log('Root iteration phrase is going to matching :' + new_phrase);
					matching(result, score, index, phrase)
				}
			}else{
				if (debug) my_console_log('Callback for root iteration phrase is failed :' + new_phrase);
			}
		})
	}

	var matching = function (result, score, index, phrase) {
		if (debug) my_console_log('Matching result for phrase : ' + phrase + '\n');
		if (debug) my_console_log(result)

		var words_unreached = words.slice(index, words.length)
		if (result.name!=undefined) {
			var result_unreached = result.name.toLowerCase().replace(phrase, '').split(" ").splice(1)
		}else{
			var result_unreached = result.description.toLowerCase().replace(phrase, '').split(" ").splice(1)
		}

		var found = false;

		var last_index = index;

		for (var i = 0; i < result_unreached.length; i++) {

			if (i < words_unreached.length) {

				if (words_unreached[i].length > result_unreached[i].length) {
					if (words_unreached[i].indexOf(result_unreached[i]) != -1) {
						index = index + 1
						found = true
					} else {
						break;

					}
				} else {
					if (result_unreached[i].indexOf(words_unreached[i]) != -1) {
						found = true;
						index = index + 1
					} else {
						break;
					}
				}
			} else {
				break;
			}

		}

		if (phrase.split(" ").length == 1 && roots_type[last_index] == 'Noun') {
			if (debug) my_console_log('Result for phrase will be printed : ' + phrase);
			printed_results.push(result);
			isSomethingFound = true
			if(my_event_emitter!=null) my_event_emitter.emit('result',result)

		} else if(phrase.split(" ").length  > 1){
			if (debug) my_console_log('Result for phrase will be printed : ' + phrase);
			printed_results.push(result);
			isSomethingFound = true
			if(my_event_emitter!=null) my_event_emitter.emit('result',result)
			//print that results
		}else{
			if (debug) my_console_log('Result for phrase will not be printed because it is not noun : ' + phrase);
		}

		if (index < words.length) {
			if (debug) my_console_log('System goes new search ');
			first_search(index);
		} else {
			if(debug) my_console_log('System will be shutdown')
			finish()
		}
	}


	var finish = function () {
		if (debug) my_console_log('finish')
		if (!isSomethingFound) {
		if (debug)	my_console_log('Nothing found');
			if (event_emitter != null){
				event_emitter.emit("error", 'Nothing found')
			}
		}
		if (debug) my_console_log('-----------------Printed Results------------------------');
		else console.log('-----------------Printed Results------------------------');
		for(var i = 0 ; i < printed_results.length; i++){
			if (printed_results[i].name != undefined) {
				var name = printed_results[i].name
			}else{
				var name = printed_results[i].description
			}
			if (debug) my_console_log(name);
			else console.log(name);
		}

		//evaluate if nothing is printed
	}


	init_state_machine(test_input);
}

//Event usage
const event_emitter = require('events').EventEmitter;
const myEmitter = new event_emitter();

main(test_input, myEmitter);

myEmitter.on('result', function(result){
	console.log('result: ' + result);
});