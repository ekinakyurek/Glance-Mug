"""Google Cloud Speech API sample application using the REST API for batch
processing."""

import argparse
import base64
import json
import io
import codecs

from googleapiclient import discovery
import httplib2
from oauth2client.client import GoogleCredentials

DISCOVERY_URL = ('https://{api}.googleapis.com/$discovery/rest?'
                 'version={apiVersion}')

def get_speech_service():
    credentials = GoogleCredentials.get_application_default().create_scoped(
        ['https://www.googleapis.com/auth/cloud-platform'])
    http = httplib2.Http()
    credentials.authorize(http)

    return discovery.build(
        'speech', 'v1beta1', http=http, discoveryServiceUrl=DISCOVERY_URL)

def main(speech_file):
    """Transcribe the given audio file.

    Args:
        speech_file: the name of the audio file.
    """
    with open(speech_file, 'rb') as speech:
        speech_content = base64.b64encode(speech.read())

    service = get_speech_service()
    service_request = service.speech().syncrecognize(
        body={
            'config': {
                'encoding': 'FLAC',  # raw 16-bit signed LE samples
                'sampleRate': 16000,  # 16 khz
                'languageCode': 'tr-TR',  # a BCP-47 language tag
            },
            'audio': {
                'content': speech_content
                }
            })
    response = service_request.execute()
    sentence = json.dumps(response)
    with open('test.txt','wb') as f:
    	f.write((sentence[73:-6]).decode("ISO-8859-9"))
    f.close()
    with open('test.txt','r+') as f:
    	sentence_in_file = f.read()
    word_list = sentence_in_file.split(" ")
    print(word_list)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        'speech_file', help='Full path of audio file to be recognized')
    args = parser.parse_args()
    main(args.speech_file)
