// const axios = require('axios');

module.exports = async function (context, eventGridEvent) {
  context.log(eventGridEvent);

  // Confirm this event is for a 'Microsoft.Storage.BlobCreated' event (in case the event is created with the Microsoft.Storage.BlobDeleted event)
  // if (eventGridEvent.eventType != "Microsoft.Storage.BlobCreated") return;

  // Call the OpenALPR API - just use the image_url function for now (with unauth access to the images container)
  const openalpr_baseurl = process.env.OPENALPR_URL;
  const openalpr_operation = "recognize_url";
  const openalpr_country = "country=us";
  const openalpr_key = "secret_key=" + process.env.OPENALPR_KEY;
  const openalpr_imageurl = "image_url=" + eventGridEvent.data.url;
  const openalpr_url = openalpr_baseurl + openalpr_operation + "?" + openalpr_country + "&" + openalpr_key + "&" + openalpr_imageurl;
  
  context.log("OpenALPR url:",openalpr_url);

  // axios.post(openalpr_url)
  //   .then( (response) => {
  //     context.log(response);
  //   })
  //   .catch( (error) => {
  //     context.log(error);
  //   });
  
  let confidence = 90;  // TODO: Set to the result from the API call

  // Check for confidence based on a provided threshold
  const confidence_threshold = process.env.CONFIDENCE_THRESHOLD;
  let isDetected = (confidence >= confidence_threshold);
  context.log("confidence_threshold:",confidence_threshold);
  context.log("confidence:",confidence);
  context.log("isDetected:",isDetected);

  // Create the message
  const eventTime = eventGridEvent.eventTime;
  const message = {
    file: eventGridEvent.data.url,
    time: eventTime
  };

  // Send processing results to the appropriate queue
  if (isDetected) {
    context.log("Pushing message to exportimage queue:",message);
    context.bindings.outputExportImageDetailsQueue = message;
  } else {
    context.log("Pushing message to manuallyprocess queue",message);
    context.bindings.outputManuallyProcessImageQueue = message;
  }
  context.done();
};