var yandex_speech = require('./node_modules/yandex-speech');

yandex_speech.ASR({
    developer_key: '4e9c6bb2-c18b-4f34-baa9-bee46f2c40ef',  //get in Yandex Developer Center
    file: './../../../..data/1.mp3', //check format  //UUID without hyphens
    topic: 'queuries',  // ['queries', 'maps', 'notes', 'music']
    lang: 'tr-TR',      // ['ru-RU', 'tr-TR'],
    filetype: 'audio/x-wav'  // ['audio/x-speex', 'audio/x-pcm;bit=16;rate=8000', 'audio/x-pcm;bit=16;rate=16000', 'audio/x-alaw;bit=13;rate=8000', 'audio/x-wav', 'audio/x-mpeg-3']
}, function(err, httpResponse, xml){
    if(err){
	console.log(err);
    }else{
	console.log(httpResponse.statusCode, xml)
    }
}
		 );
