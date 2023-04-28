<?php
session_start();
header("Access-Control-Allow-Origin: *");
require('../vendor/autoload.php');
use GuzzleHttp\Client;

include '../creds.php';

$headers = [
    'Content-Type' => "application/x-www-form-urlencoded",        
    'Accept'        => "*/*",
];
  
try{
  $api = new Client([
    'verify' => false
  ]);
  
  $result = $api->request('POST', 'https://login.salesforce.com/services/oauth2/token' , ['headers'=> $headers,'form_params' => $body]);

  $tokenInfo = json_decode($result->getBody()->getContents(), true);

}catch(Exception $e){
  echo "Error: ".$e->getResponse()->getBody()->getContents();
}

?>
<!DOCTYPE html>
<html>
 <head>
 <meta charset="UTF-8">
 <title>page title</title>
 <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
 <meta name="format-detection" content="telephone=no" />
 <link href="/favicons/favicon.ico" rel="shortcut icon" type="image/x-icon" />
</head>
<body>



<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
<script>
<?php echo "var token = '{$tokenInfo['access_token']}';"; ?>
<?php echo "sessionStorage.setItem('access_token', '{$tokenInfo['access_token']}');"; ?>  

var instance = 'na123';
var version = '53.0';
var baseURL = 'https://'+instance+'.salesforce.com/services/data/v'+version;

$(document).ready(function() {
/**
  this came in handy before. eventually maybe I'll make a function for it. This will make the script wait a period of time before continuing
  these jobs take a while, so I used this before checking the status, since otherwise I'm pining the API once a second or more. 
*/
//let delay = 5000;//5 seconds
//await new Promise(resolve => setTimeout(resolve, delay));  

//turn into a module later https://javascript.info/async-await
/*
postData("https://example.com/answer", { answer: 42 }).then((data) => {
    console.log(data); // JSON data parsed by `data.json()` call
  });
  */
  (async () => {
    let test = await postData(baseURL + "/jobs/query",{
        operation : "query",
        query : "SELECT Id FROM Account",
        contentType : "CSV",
        columnDelimiter : "COMMA",
        lineEnding : "CRLF"
    });

    console.log(test);

})();

// Example POST method implementation:
async function postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "force-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        'Authorization': 'OAuth '+token,
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  




});//end js anonymous function




</script>        
      

    </body>
</html>









