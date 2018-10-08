
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
/*
 * Starter Project for Messenger Platform Quick Start Tutorial
 *
 * Remix this as the starting point for following the Messenger Platform
 * quick start tutorial.
 *
 * https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start/
 *
 */

//adding fetch, read about callbacks and promises
// PLEASE READ ABOUT CALLBACKS AND PROMISES ME OF THE FUTURE!
const fetch = require('node-fetch');


'use strict';

// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Accepts POST requests at /webhook endpoint
app.post('/webhook', (req, res) => {  

  // Parse the request body from the POST
  let body = req.body;

  // Check the webhook event is from a Page subscription
  if (body.object === 'page') {

    // Iterate over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Get the webhook event. entry.messaging is an array, but 
      // will only ever contain one event, so we get index 0
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);
      
      //Get the user's PSID
      let sender_psid = webhook_event.sender.id;
      console.log("Sender PSID: " + sender_psid);
      
      //Check what kind of event we are dealing with
      //then pass it to the correct handler fuction 
      if(webhook_event.message){
        handleMessage(sender_psid, webhook_event.message);
      }
      else{
        handlePostback(sender_psid, webhook_event.postback);
      }
    });

    // Return a '200 OK' response to all events
    res.status(200).send('EVENT_RECEIVED');

  } else {
    // Return a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

// Accepts GET requests at the /webhook endpoint
app.get('/webhook', (req, res) => {
  
  /** UPDATE YOUR VERIFY TOKEN **/
  const VERIFY_TOKEN = "Eliter4k";
  
  // Parse params from the webhook verification request
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Check if a token and mode were sent
  if (mode && token) {
  
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

/////////////////

// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;
  let mid_response;
  let final_response;
  
  //Check if message contains text
  if(received_message.text){
    //Create the payload for a basic text message
    response = {
      "text" : `What is this nonsense?: "${received_message.text}". Don't bother me!`
    };
    
    mid_response = { "text" : `Don't make me repeat myself`
    };
    
    //works to send an image
    
    final_response = {
      "attachment":{
      "type":"image", 
      "payload":{
        "url":"https://cdn.glitch.com/f7db7971-0f57-4669-8438-9e372bdcf64e%2Frain.PNG?1538529739982", 
        "is_reusable":true,
      }
    }
  }
    
    console.log("Response produced");
 }else if(received_message.attachments){
   //Get URL of attachment mesagge
   let attachment_url = received_message.attachments[0].payload.url;
   response = {
   "attachment": {
     "type": "template",
     "payload": {
       "template_type": "generic",
       "elements": [{
         "title": "Why SEND this annoying image?",
         "subtitle": "Tap a button to answer",
         "image_url": attachment_url,
         "buttons": [
           {
             "type": "postback",
             "title": "Deal with it",
             "payload": "yes",
           },
           {
             "type":"postback",
             "title": "I'm sorry :(",
             "payload": "no",
           }
         ],
       }]
     }
   }
   }
 }
  
  if(received_message.text){
    //If message is a text, we send three responses
    callSendAPI2(sender_psid,response).then(()=> {
      return callSendAPI2(sender_psid,mid_response).then(()=> {
        return callSendAPI2(sender_psid,final_response); //Can send as many as you want
      });
    });
  }
  else{ //Else we send only one
    callSendAPI(sender_psid, response); //Send response message
  }
  
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;
  
  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Urgggggg!!!" }
  } else if (payload === 'no') {
    response = { "text": "OK! Don't do it again!" }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  //Contruct the message body
  let request_body = {
    "recipient": {
      "id":sender_psid
    },
    "message": response,
  }
  
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": {"access_token": PAGE_ACCESS_TOKEN},
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if(!err){
      console.log('message sent')
    } else{
      console.error("Unable to send message: " + err);
    }
  });
}

function callSendAPI2(sender_psid,response) {
  //call this API when multiple messages need to be sent
  let body = {
    "recipient": {
      "id" : sender_psid
    },
    "message": response
  };
  const qs = 'access_token=' + encodeURIComponent(PAGE_ACCESS_TOKEN); // Here you'll need to add your PAGE TOKEN from Facebook
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    "method": 'POST',
    "headers": {'Content-Type': 'application/json'},
    "body": JSON.stringify(body),
  });
}