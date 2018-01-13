# Glance Mug

Ahmet Börütecene, İdil Bostan, Ekin Akyürek, Alpay Sabuncuoğlu, İlker Temuzkuşu, Çağlar Genç, Tilbe Göksun, Oğuzhan Özcan. (2018). Through the Glance Mug: A Familiar Artefact to Support Opportunistic Search in Meetings. In Proceedings of the 12th International Conference on Tangible, Embedded and Embodied Interaction (TEI ‘18). ACM, Stockholm, Sweden, 10 Pages.

## How To Run
```shell
python main.py
```

## Dependencies
### 1) PyAudio for Recording
#### Follow the instructions
   ```Shell
   https://people.csail.mit.edu/hubert/pyaudio/
   ```

### 2) Google Cloud SDK for Speech-To-Text
#### Download the SDK
   ```HTML
   https://cloud.google.com/sdk/downloads
   ```
#### Unzip and Type:
   ```Shell
	./google-cloud-sdk/install.sh
   ```
#### Init
   ```Shell
	./google-cloud-sdk/bin/gcloud init
   ```
You should not need to login. We use credentials.
#### Put Your Credentials
  ```shell
  keys/
  ```

### 3) Google Knowledge Graph API for Search
#### Get your private key
```HTML
https://developers.google.com/knowledge-graph/
```

### 4) TRMorph for accurate Search
#### Follow the instructions
```Shell
morph/
```

### 5) PyGame for GUI
#### Install via pip
  ```Shell
  pip install pygame
  ```

### 6) Adafruit_ADS1x15 for Gesture Recognition
#### Install via pip
   ```Shell
   pip install adafruit-ads1x15
   ```
Don't need to install it for local development
