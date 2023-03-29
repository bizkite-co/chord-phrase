// Import helloFromLambdaHandler function from hello-from-lambda.mjs
import { phraseHandler } from '../../../src/handlers/phrase.mjs';

// This includes all tests for helloFromLambdaHandler()
describe('Test for phraseHandler', function () {
    // This test invokes helloFromLambdaHandler() and compare the result 
    it('Verifies successful response', async () => {
        // Invoke helloFromLambdaHandler()
        const data = {
            "requestContext": {
                "http": {
                    "method": "POST"
                }
            },
            "body": "Hello World!"
        }


        const result = await phraseHandler(data);
        /* 
            The expected result should match the return from your Lambda function.
            e.g. 
            if you change from `const message = 'Hello from Lambda!';` to `const message = 'Hello World!';` in hello-from-lambda.mjs
            you should change the following line to `const expectedResult = 'Hello World!';`
        */
        const expectedResult = 200;
        // Compare the result with the expected result
        expect(result.statusCode).toEqual(expectedResult);
    });
    // Test using the GET method
    it('Verifies successful response using GET', async () => {
        // Invoke helloFromLambdaHandler()
        const data = {
            "requestContext": {
                "http": {
                    "method": "GET"
                }
            },
            "rawQueryString": "Hello World!"
        }
        const result = await phraseHandler(data);
        console.log("Result:", result);
        const expectedResult = 200;

        // Compare the result with the expected result
        expect(result.statusCode).toEqual(expectedResult);
    });

});
