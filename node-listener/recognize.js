var google = require('googleapis');
var async = require('async');
var fs = require('fs');

// Get a reference to the speech service
var speech = google.speech('v1beta1').speech;

function getAuthClient (callback) {
  // Acquire credentials
  google.auth.getApplicationDefault(function (err, authClient) {
    if (err) {
      return callback(err);
    }

    // The createScopedRequired method returns true when running on GAE or a
    // local developer machine. In that case, the desired scopes must be passed
    // in manually. When the code is  running in GCE or a Managed VM, the scopes
    // are pulled from the GCE metadata server.
    // See https://cloud.google.com/compute/docs/authentication for more
    // information.
    if (authClient.createScopedRequired && authClient.createScopedRequired()) {
      // Scopes can be specified either as an array or as a single,
      // space-delimited string.
      authClient = authClient.createScoped([
        'https://www.googleapis.com/auth/cloud-platform'
      ]);
    }

    return callback(null, authClient);
  });
}

function prepareRequest (inputFile, callback) {
  fs.readFile(inputFile, function (err, audioFile) {
    if (err) {
      return callback(err);
    }
    console.log('Got audio file!');
    var encoded = new Buffer(audioFile).toString('base64');
    var payload = {
      config: {
        encoding: 'LINEAR16',
        sampleRate: 16000
      },
      audio: {
        content: encoded
      }
    };
    return callback(null, payload);
  });
}

function main (inputFile, callback) {
  var requestPayload;

  async.waterfall([
    function (cb) {
      prepareRequest(inputFile, cb);
    },
    function (payload, cb) {
      requestPayload = payload;
      getAuthClient(cb);
    },
    function sendRequest (authClient, cb) {
      console.log('Analyzing speech...');
      speech.syncrecognize({
        auth: authClient,
        resource: requestPayload
      }, function (err, result) {
        if (err) {
          return cb(err);
        }
        console.log('result:', JSON.stringify(result, null, 2));
        cb(null, result);
      });
    }
  ], callback);
}

if (module === require.main) {
  if (process.argv.length < 3) {
    console.log('Usage: node recognize <inputFile>');
    process.exit();
  }
  var inputFile = process.argv[2];
  main(inputFile, console.log);  
}
