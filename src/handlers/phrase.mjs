import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const http = require('http');
const fs = require('fs');
const chords = require("./chords.json");
var params = {Bucket: 'handex', Key: '/'};
// require('aws-sdk/lib/maintenance_mode_message').suppress = true;
// this imports just the getObject operation from S3
import { GetObjectCommand } from "@aws-sdk/client-s3"
/**
 * A Lambda function that returns a static string
 */
export const phraseHandler = async (event) => {
    console.log("EVENT:", event)
    let requestData = eventToRequestData(event);
    console.log("Request data:", requestData);
    if(!requestData.phrase) {
        return {
            statusCode: 404,
            body: `Please provide a phrase parameter of type string.\nRequest content: "${JSON.stringify(event)}"`,
            message: `Please provide a phrase parameter of type string.\nRequest content: "${JSON.stringify(event)}"`
        }
    }
    // base64 decode the phrase 
    let phraseDecoded = Buffer.from(requestData.phrase, "base64").toString().trim();
    console.log("\nphraseDecoded:", phraseDecoded);
    if(!phraseDecoded){
        return `Please provide a text string to be converted into a chord phrase.\nRequest content: "${JSON.stringify(event)}"`
    }
    console.log(`\nRunning handler on string: "${JSON.stringify(phraseDecoded)}"`);
    // event.status = ["Adding results"];
    const resultPhrase = stringToChordPhrase(phraseDecoded);
    console.log(`\nresultPhrase: ${resultPhrase}`);
    const body = requestData.ascii === "true" 
        ? JSON.stringify(`t = thumb\ni = index\nm = middle\nr = ring\np = pinky\n\nmf = metacarpo-flexion\npf = proximal-flexion\nme = metacarpo-extension\n\nphrase = ${phraseDecoded}\n\n${resultPhrase}`) 
        : JSON.stringify(resultPhrase.replace(/\n/g, "<br>"));
    const response = {
        statusCode: 200,
        body: body,
        testMessage: "Hello from Lambda!"
    }
    // All log statements are written to CloudWatch
    console.info(`\nRESPONSE: ${JSON.stringify(response)}`);
    
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
    requestData = JSON.parse(event.body);
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
    console.log("\nchordArray:", chordArray);
    chordArray.forEach((c)=>{
        console.log("c:", c);
        let chordChar = c.replace(' ', 'Spacebar').replace(/([\.\\\(\)\{\}\[\]\?\+\*\|\$\^])/,"\\$1");
        console.log("\nchordChar:", chordChar);
        // Create a regex to match the current character
        // Escape any special characters
        // chordChar = chordChar.replace(/([\.\\\(\)\{\}\[\]\?])/,"\\$1");
        let matchPhrase = `(^${chordChar}|and ${chordChar})`;
        console.log("\nmatchPhrase:", matchPhrase);
        // Find the chord that matches the current character
        let chordPhrase = chords.find(chord => chord.report.match(matchPhrase));
        if(chordPhrase){
            console.log("\nchordPhrase:", JSON.stringify(chordPhrase));
            // Check if c matches chordPhrase.report before or after "and"
            // If it's after the "and", add Shift to the strokes
            const isShift = chordPhrase.report.match(`and ${chordChar}`);
            // TODO: Replace the hard-coded "tmf" with the looked-up chord.
            phrase.push(`${chordChar.slice(0,5).replace(/^\\/, "")}: ${isShift ? "tmf, " : ""}${chordPhrase.strokes}`);
        }
    })
    return phrase.join('\n');
}

function getChords(){
    // NOTE: Lambda functions don't have access to the web by default.
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