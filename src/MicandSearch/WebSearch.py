import requests, json
from requests.utils import quote

def my_console_log(phrase) :
    print phrase


def console_log(phrase) :
    print phrase


class WebSearch:
    api_host = "https://kgsearch.googleapis.com";

    def __init__(self, api_key="AIzaSyDoTp6UicPtIH_JVy-cFwoebTEp9-rRHYE",debug=False) :
        self.api_key = api_key
        self.words = []
        self.roots = []
        self.roots_type = []
        self.printed_results = []
        self.isSomethingFound = False
        self.debug = debug
        self.my_event_emitter = None

    def starter(self, test_input, debug, my_event_emitter, my_console_log) :
        self.debug = debug
        self.my_event_emitter = my_event_emitter
        if len(test_input) > 2:
             self.init_state_machine(test_input)
             return self.printed_results
        else:
            return [""]

    def search_word(self, phrase, limit=1) :
        if self.debug : my_console_log("Searching for phrase :" + phrase)
        query_string = "/v1/entities:search?languages=tr&query=" + quote(phrase.encode("utf-8")) + "&key=" + self.api_key + "&limit=1&indent=True"
        query_string = WebSearch.api_host+query_string
        r = requests.get(query_string)
        response = r.json()
        succeed = r.status_code == 200
        if self.debug: my_console_log("Response for phrase :" + phrase + "\n")
        if self.debug: my_console_log(response)
        if '@context' in response:
            succeed = True
            itemListElement = response["itemListElement"]
            if len(itemListElement ) > 0:
                itemListElement = itemListElement[0]
                if self.debug : my_console_log("ItemlistElement for phrase : " + phrase)
                if self.debug : my_console_log(itemListElement)
                if self.debug : my_console_log(itemListElement["result"])
                if self.debug : my_console_log(itemListElement["resultScore"])
            else:
                itemListElement = None


            if itemListElement != [] and itemListElement != None :
                if self.debug : my_console_log("Callback for phrase : "+ phrase)
                return succeed, itemListElement["result"], itemListElement["resultScore"]
            else :
                if self.debug : my_console_log("Failed callback for phras : "+ phrase + "\n")
                return True, None, None;

        else:
            if self.debug : my_console_log("Failed result for phrase : "+ phrase)
            return False, None, None;

    def first_search(self, index) :
        isSucceed, result, score = self.search_word(self.words[index])
        if isSucceed:
            if self.debug: my_console_log("Callback for word is succeed :" + self.words[index]);
            if score is not None:
                if index + 1 < len(self.words) :
                    if self.debug: my_console_log("Word is going to iteration : " + self.words[index]);
                    return self.iterasyon(result, score, index + 1, self.words[index])
                else:
                    if self.roots_type[index] == "Noun" :
                        if self.debug: my_console_log("last word is noun here is the result of :" + self.words[index]);
                        if self.debug: my_console_log(result);
                        self.printed_results.append(result)
                        self.isSomethingFound = True
                        if self.my_event_emitter is not None: my_event_emitter.emit("result",result);
                    else:
                        if self.debug: my_console_log("last word is not noun :" + self.words[index]);
                        if self.debug: my_console_log(result);
                        #save for causion
                    print "--firstsearch calls finish"
                    return self.finish()
            else :
                if self.debug : my_console_log("Word is going to root_serach : " + self.words[index])
                return self.root_search(index)
        else:
            if self.debug : my_console_log("Callback for word is failed :" + self.words[index])

    def root_search(self, index):
        isSucceed, result, score = self.search_word(self.words[index])
        if isSucceed:
            if self.debug: my_console_log("Callback for root is succeed :" + self.roots[index])
            if score is not None:
                if index + 1 < len(self.words):
                    if self.debug : my_console_log("Root is going to iteration : " + self.roots[index])
                    return self.iterasyon(result, score, index + 1, self.roots[index])
                else:
                    if self.roots_type[index] == "Noun":
                        if self.debug: my_console_log("Last root is noun here is the result of :" + self.roots[index])
                        if self.debug: my_console_log(result)
                        self.printed_results.append(result)
                        self.isSomethingFound = True
                        if my_event_emitter is not None:
                            my_event_emitter.emit("result", result)
                    else:
                        if self.debug: my_console_log("Last root is not noun :" + self.roots[index])
                        if self.debug: my_console_log(result);
                        #save for causion
                    print "--rootsearch calls finish1"
                    return self.finish()
            else:
                if self.debug: my_console_log("Zero score even in the root. It is going next word search :" + self.roots[index])
                if self.debug: my_console_log(result)
                if index + 1 < len(self.words):
                    return self.first_search(index + 1)
                else:
                    print "--rootsearch calls finish2"
                    return self.finish()

        else:
            if self.debug : my_console_log("Callback for root is failed :" + self.roots[index]);
            return ""

    def iterasyon(self, result, score, index, phrase) :
        new_phrase = phrase + " " + self.words[index]
        if self.debug:
            my_console_log("Iteration for phrase : " + new_phrase);

        isSucceed, result2, score2 = self.search_word(self.words[index])
        if isSucceed :
            if self.debug: my_console_log("Callback for iteration phrase is succeed :" + new_phrase);
            if score2 is not None and score2 >= score :
                if self.debug: my_console_log("Score for phrase is" + str(score2) + " : " + new_phrase);
                if index + 1 < len(self.words) :
                    if self.debug: my_console_log("iteration phrase is going next iteration :" + new_phrase);
                    return self.iterasyon(result2, score2, index + 1, new_phrase);
                else:
                    if self.debug: my_console_log("Last iteration the result of :" + new_phrase);
                    if self.debug: my_console_log(result2);
                    self.printed_results.append(result2)
                    self.isSomethingFound = True;
                    if self.my_event_emitter is not None :
                        self.my_event_emitter.emit("result",result2);
                    return self.finish()
            elif score2 is None or score2 < score:
                if self.debug: my_console_log("iteration phrase is going root iteration :" + new_phrase)
                return self.root_iterasyon(result, score, index, phrase)
        else :
            if self.debug : my_console_log("Callback for iteration phrase is failed :" + new_phrase);
            return ""

    def root_iterasyon(self,result, score, index, phrase) :

        new_phrase = phrase + " " + self.roots[index]

        if self.debug:
            my_console_log("Root iteration for phrase : " + new_phrase);
        isSucceed, results, score2 = self.search_word(self.words[index]);
        if isSucceed:
            if self.debug: my_console_log("Callback for root iteration phrase is succeed :" + new_phrase);
            if score2 is not None and score2 >= score :
                if self.debug : my_console_log("Score for phrase is" + str(score2) + " : " + new_phrase)
                if index + 1 < self.words.length :
                    if self.debug: my_console_log("Root iteration phrase is going next iteration :" + new_phrase);
                    return self.iterasyon(result2, score2, index + 1, new_phrase)
                else :
                    if self.debug: my_console_log("Last root iteration the result of :" + new_phrase)
                    if self.debug: my_console_log(result2);
                    self.printed_results.append(result2)
                    self.isSomethingFound = true
                    if my_event_emitter is not None:
                        my_event_emitter.emit("result", result2)
                    return self.finish()

            elif score2 is None or score2 < score:
                if self.debug :
                    my_console_log("Root iteration phrase is going to matching :" + new_phrase)
                return self.matching(result, score, index, phrase)
        else:
            if self.debug: my_console_log("Callback for root iteration phrase is failed :" + new_phrase)

    def init_state_machine(self, input):
        if self.debug :
            my_console_log("State machine is initialized with input: ")
        if self.debug :
            my_console_log(input)
        if input != "" :
            input_array = input.split(" ")
            print input_array
            self.words = input_array[slice(0, len(input_array) / 2)]
            temp_roots = input_array[slice(len(input_array) / 2, len(input_array))];
            for i in range(0, len(temp_roots)):
                root_and_type = temp_roots[i].split(",")
                self.roots_type.append(root_and_type[1])
                self.roots.append(root_and_type[0])
            if self.debug: my_console_log("Input words : ")
            if self.debug: my_console_log(self.words);
            if self.debug: my_console_log("Input roots : ")
            if self.debug: my_console_log(self.roots);
            return self.first_search(0)
        else:
            print "init state machine calls finish"
            return self.finish()

    def matching(self, result, score, index, phrase):
        if self.debug:
            my_console_log("Matching result for phrase : " + phrase + "\n")
        if self.debug:
            my_console_log(result)

        words_unreached = self.words[slice(index, len(self.words))]
        result_unreached = None
        if 'name' in result:
            result_unreached = result['name'].lower().replace(phrase, "").split(" ")[1:]
        elif 'description' in result:
            result_unreached = result['description'].lower().replace(phrase, "").split(" ")[1:]

        found = False
        last_index = index

        if result_unreached is not None:
            for i in range(0, len(result_unreached)):
                if i < len(words_unreached):
                    if len(words_unreached[i]) > len(result_unreached[i]) :
                        try:
                            words_unreached[i].index(result_unreached[i])
                            index = index + 1
                            found = True
                        except ValueError:
                            break
                    else:
                        try:
                            result_unreached[i].index(words_unreached[i])
                            found = True
                            index = index + 1
                        except ValueError:
                            break
                else:
                    break
        if 'name' not in result:
            result['name'] = phrase

        if len(phrase.split(" ")) == 1 and self.roots_type[last_index] == "Noun":
            if self.debug: my_console_log("Result for phrase will be printed : " + phrase)
            self.printed_results.append(result)
            self.isSomethingFound = True
            if self.my_event_emitter is not None : my_event_emitter.emit("result",result)
        elif len(phrase.split(" ")) > 1:
            if self.debug: my_console_log("Result for phrase will be printed : " + phrase)
            self.printed_results.append(result)
            self.isSomethingFound = True
            if self.my_event_emitter is not None : my_event_emitter.emit("result",result)
            #print that results
        else :
            if self.debug : my_console_log("Result for phrase will not be printed because it is not noun : " + phrase)

        if index < len(self.words):
            if self.debug: my_console_log("System goes new search ")
            return self.first_search(index)
        else:
            if self.debug:  my_console_log("System will be shutdown")
            return self.finish()

    def finish(self):

        if self.debug:
            my_console_log("finish")

        if not self.isSomethingFound:
            if self.debug:
                my_console_log("Nothing found")
            if self.my_event_emitter is not None:
                my_event_emitter.emit("error_occurs", "NothingFound")
        else:
            if self.my_event_emitter is not None:
                my_event_emitter.emit("finished", "SearchIsFinished")

        if self.debug:
            my_console_log("-----------------Printed Results------------------------");
        else:
            console_log("-----------------Printed Results------------------------");

        for i in range(0, len(self.printed_results)):
            if 'name' in self.printed_results[i]:
                name = self.printed_results[i]['name']
            else:
                name = printed_results[i]['description']

            if self.debug:
                my_console_log(name);
            else:
                console_log(name);
        return self.printed_results
        #console.timeEnd("websearch")
