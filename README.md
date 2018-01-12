# Glance Mug

Ahmet Börütecene, İdil Bostan, Ekin Akyürek, Alpay Sabuncuoğlu, İlker Temuzkuşu, Çağlar Genç, Tilbe Göksun, Oğuzhan Özcan. (2018). Through the Glance Mug: A Familiar Artefact to Support Opportunistic Search in Meetings. In Proceedings of the 12th International Conference on Tangible, Embedded and Embodied Interaction (TEI ‘18). ACM, Stockholm, Sweden, 10 Pages.

## Dependencies

### 1) Google Cloud SDK for Speech-To-Text
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

### 2) Google Knowledge Graph API for Search
#### Get your private key
```HTML
https://developers.google.com/knowledge-graph/
```

### 3) TRMorph for accurate Search
### Follow the instructions
```Shell
morph/
```

### 4) PyGame for GUI
#### Install via pip
  ```Shell
  pip install pygame
  ```

### 5) Adafruit_ADS1x15 for Gesture Recognition
#### Install via pip
   ```Shell
   pip install adafruit-ads1x15
   ```
Don't need to install it to your computer.
