(function (namespace) {
    'use strict';

    if (typeof namespace.ya === 'undefined') {
        namespace.ya = {};
    }
    if (typeof namespace.ya.speechkit === 'undefined') {
        namespace.ya.speechkit = {};
    }
    /**
     * Global settings for speechkit
     * @memberof ya.speechkit
     * @property {String} websocketProtocol - Which protocol to use (wss:// or ws://)
     * @property {String} asrUrl - Url of asr websocket
     * @property {String} ttsUrl - Url of tts server
     * @property {String} lang - Default language for recognition
     * @property {String} model - Default model for recognition
     * @property {String} apiKey - Developer's API key {@link http://ya.ru}
     * @property {String} uuid - Pregenerated uuid of asr session
     * @see https://developer.tech.yandex.ru/
     */
    var settings = {
        websocketProtocol: 'wss://',
        asrUrl: 'webasr.yandex.net/asrsocket.ws',
        spotterUrl: 'webasr.yandex.net/spottersocket.ws',
        ttsUrl: 'https://tts.voicetech.yandex.net',
        ttsStreamUrl: 'webasr.yandex.net/ttssocket.ws',
        lang: 'ru-RU',
        lang_whitelist: ['ru-RU', 'tr-TR', 'en-EN'],
        model: 'freeform',
        applicationName: 'local',
        apiKey: '',
        uuid: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                function (c) {
                    var r = Math.random() * 16 | 0;
                    var v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                }
            ),
    };

    if (typeof namespace.ya.speechkit._extend === 'undefined') {
        namespace.ya.speechkit.settings = settings;
    } else {
        namespace.ya.speechkit.settings = namespace.ya.speechkit._extend(settings, namespace.ya.speechkit.settings);
    }
})(this);
