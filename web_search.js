'use strict'



var test_sentence = "akşam oldu hüzünlendim ben yine bilir misin";
//test_sentence = "yüreğinin götürdüğü yere giti okudum";
test_sentence = "açlık oyunları'nı izledin mi";
test_sentence = "orhan babanın yeni kasetini dinledim";
//test_sentence = "iki kere bosna'ya gittim";
//test_sentence = "hiç tübitakta kodlama yaptın mı"
var root_sentence = "iki kere bosna git";
root_sentence = "akşam oldu hüzün ben yine bilir mi";
root_sentence = "orhan baba yeni kaset dinle";
//root_sentence = "hiç tübitak kodlama yap mı"
//root_sentence = "açlık oyunları izle mi";
var test_input = test_sentence.split(" ").concat(root_sentence.split(" "));
test_input = "orhan babanın yeni kasetini dinledim orhan,Noun baba,Noun yeni,Other kaset,Noun dinle,Other";
//test_input = "bir iki 12 simit oluyor sdfds izliyorum filmlerinki fazlalar bir,Other iki,Other 12,Other simit,Noun ol,Other sdfds,Noun izle,Other film,Noun "


var https = require('https')
var api_key = 'AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE';
var api_host = 'kgsearch.googleapis.com';

var main = function (test_input, event_emitter) {

	var words = [];
	var roots = [];
	var roots_type = [];
	var isSomethingFound = false;

	var search_word = function (phrase, callback, limit) {
		//console.log(phrase)

		if (limit == undefined) {
			limit = 1;
		}

		var query_string = '/v1/entities:search?languages=tr&query=' + phrase + '&key=' + api_key + '&limit=1&indent=True'
		query_string = encodeURI(query_string)
		//console.log(query_string)
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
				//console.log(response);
				if (response.hasOwnProperty('@context')) {
					succeed = true;

					var itemListElement = response['itemListElement'][0]
					//console.log(itemListElement)
					///console.log(itemListElement['result']);
					///console.log(itemListElement['resultScore']);
					if (itemListElement != undefined) {
						callback(succeed, itemListElement['result'], itemListElement['resultScore'])
					} else {
						callback(succeed, null, null)
					}
				}


				//console.log(response)
			});
		});
	}

//testing
// search_word('google', function(result, response){});

	var init_state_machine = function (input) {
		var input_array = input.split(" ");
		words = input_array.slice(0, input_array.length / 2);
		var temp_roots = input_array.slice(input_array.length / 2, input_array.length);

		for (var i = 0; i < temp_roots.length; i++) {
			var root_and_type = temp_roots[i].split(',');

			roots_type.push(root_and_type[1]);
		    roots.push(root_and_type[0]);
		}


		first_search(0);
	}

	var first_search = function (index) {
		search_word(words[index], function (isSucceed, result, score) {
			if (isSucceed) {
				if (score != null) {
					if (index + 1 < words.length) {
						iterasyon(result, score, index + 1, words[index])
					} else {
						if (roots_type[index]=='Noun') {
							console.log(result.name)
							isSomethingFound = true
						} else {
							//save for causion
						}
						finish();
					}
				} else {
					root_search(index)
				}
			}
		})
	}

	var root_search = function (index) {
		search_word(roots[index], function (isSucceed, result, score) {
			if (isSucceed) {
				if (score != null) {
					if (index + 1 < words.length) {
						iterasyon(result, score, index + 1, roots[index])
					} else {
						finish()
					}
				} else {
					first_search(index + 1)
				}
			}
		})
	}
	var iterasyon = function (result, score, index, phrase) {
		var new_phrase = phrase + ' ' + words[index];
		search_word(new_phrase, function (isSucceed, result2, score2) {
			if (isSucceed) {
				if (score2 != null && score2 > score) {
					iterasyon(result2, score2, index + 1, new_phrase)
				} else if (score2 == null || score2 < score) {
					root_iterasyon(result, score, index, phrase)
				}
			}
		})
	}

	var root_iterasyon = function (result, score, index, phrase) {
		var new_phrase = phrase + ' ' + roots[index];
		search_word(new_phrase, function (isSucceed, result2, score2) {
			if (isSucceed) {
				if (score2 != null && score2 > score) {
					iterasyon(result2, score2, index + 1, new_phrase)
				} else if (score2 == null || score2 < score) {
					matching(result, score, index, phrase)
				}
			}
		})
	}

	var matching = function (result, score, index, phrase) {
		var words_unreached = words.slice(index, words.length)
       // console.log(result)
		var result_unreached = result.name.toLowerCase().replace(phrase, '').split(" ").splice(1)

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
			//save for causion
		} else {
			console.log(result)
			isSomethingFound = true
			if (event_emitter != null){
				event_emitter.emit("result", result)
			}
			//print that results
		}

		if (index < words.length) {
			first_search(index);
		} else {
			finish()
		}
	}


	var finish = function () {
		console.log('finish')
		if (!isSomethingFound) {
			console.log('Nothing found');
			if (event_emitter != null){
				event_emitter.emit("error", 'Nothing found')
			}
		}
		//evaluate if nothing is printed
	}


	init_state_machine(test_input);
}

main(test_input)