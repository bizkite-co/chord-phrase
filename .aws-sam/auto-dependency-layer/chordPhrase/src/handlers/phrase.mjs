import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const http = require('http');
const fs = require('fs');
const aws = require('aws-sdk');
const s3 = new aws.S3({ apiVersion: '2006-03-01' });
const chords = require("./chords.json");
var params = {Bucket: 'handex', Key: '/'};
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
/**
 * A Lambda function that returns a static string
 */
export const getPhrase = async (event) => {

    // fs.readdir("/mnt/handex", function(err, items) {
    //     if(err){
    //         console.err(`Read /mnt/handex error: ${err}`);
    //     }
    //     console.log("Reading /mnt/handex/ content.");
    //     console.log(items);
     
    //     for (var i=0; i<items.length; i++) {
    //         console.log(items[i]);
    //     }
    // });
    console.log("EVENT:", event)
    let requestData = eventToRequestData(event);
    console.log("Request data:", requestData);
    let parsePhrase = requestData.phrase.replace("%20", " ");
    if(!parsePhrase){
        return `Please provide a text string to be converted into a chord phrase.\nRequest content: "${JSON.stringify(event)}"`
    }
    console.log(`Running handler on string: "${JSON.stringify(parsePhrase)}"`);
    // event.status = ["Adding results"];
    const resultPhrase = stringToChordPhrase(parsePhrase);
    const response = {
        statusCode: 200,
        body: `t = thumb\ni = index\nm = middle\nr = ring\np = pinky\n\nmf = metacarpo-flexion\npf = proximal-flexion\nme = metacarpo-extension\n\nphrase = ${parsePhrase}\n\n${resultPhrase}`,
        testMessage: "Hello from Lambda!"
    }




    // All log statements are written to CloudWatch
    console.info(`RESPONSE: ${JSON.stringify(response)}`);
    
    return response;
}

const eventToRequestData = event => {
  var requestData = {};
  //Validate and parse event
  console.log("Processing event:", event);
  if (event && event.requestContext.http.method === 'OPTIONS') {
    return processResponse(IS_CORS);
  }
  if (event && event.requestContext.http.method === 'POST') {
    console.log("Processing POST data:", event);
    if (!event.body) {
      console.error("MISSING EVENT BODY:", event)
      return processResponse(IS_CORS, `Handler event body not found.`, 400);
    }
    requestData = event.body;
  }
  if (event && event.requestContext.http.method === 'GET') {
    console.log("Parsing rawQuerystring", event.rawQueryString);
    const segments = event.rawQueryString.split("&");
    console.log("Splitting querystring segments", segments);
    segments.forEach((segment) => {
      requestData[segment.split("=")[0]] = segment.split("=")[1];
    })
  }
  return requestData;
}

function stringToChordPhrase(inString){
    let phrase = [];
    console.log("stringToChordPhrase:", inString);
    const chordArray = Array.from(inString);
    console.log("chordArray:", chordArray);
    chordArray.forEach((c)=>{
        console.log("c:", c);
        let chordChar = c.replace(' ', 'Spacebar').replace(/([\.\\\(\)\{\}\[\]\?])/,"\\$1");
        console.log("chordChar:", chordChar);
        let matchPhrase = `(^${chordChar}|and ${chordChar})`;
        console.log("matchPhrase:", matchPhrase);
        let chordPhrase = chords.find(chord => chord.report.match(matchPhrase));
        console.log("chordPhrase:", JSON.stringify(chordPhrase));
        phrase.push(`${chordChar.slice(0,5)}\t${chordPhrase.strokes}`);
    })
    return phrase.join('\n');
}

function getChords(){
    let req = http.get("http://handex.io/chords.json", function(res) {
        event.status.push("In callback");
        
        console.log("Got response: " + res.statusCode);
        
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          console.log(parsedData);
        } catch (e) {
          console.error(e.message);
        }
        });
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
    });
}