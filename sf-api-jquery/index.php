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
 (async () => {


//================== Bulk Query ==================

  var jobid = await doAjaxAsync("/jobs/query","post","json","application/json",JSON.stringify({
                                operation : "query",
                                query : "SELECT Id FROM Account",
                                contentType : "CSV",
                                columnDelimiter : "COMMA",
                                lineEnding : "CRLF"
                              }));

  console.log(jobid);

  var status = await bulkJobStatus(jobid.id,"query");

  console.log(status);

  var results = await doAjaxAsync("/jobs/query/"+jobid.id+"/results","get","text","application/json");//content type not really important here
  
  console.log(results);

//================== Regular Bulk Job Ingest ==================

  var job = await doAjaxAsync("/jobs/ingest","post","json","application/json",JSON.stringify({
    object : "Contact",
    contentType : "CSV",
    operation : "insert",
    lineEnding : "CRLF"
  }));
  console.log(job);
  //I'm building the URLs for subsequent calls manually, just for demo purposes
  //but you can also use the contentUrl propery of the return json object IE
  console.log(job.contentUrl)

  var csv = 'Email,LastName,FirstName\r\nbuddy100@elf.com,Elffff,Budddddy';

  var ingest = await doAjaxAsync("/jobs/ingest/"+job.id+"/batches","put","text","text/csv",csv);
  console.log(ingest);

  var closejob = await doAjaxAsync("/jobs/ingest/"+job.id,"patch","json","application/json",JSON.stringify({
    state : "UploadComplete"
  }));

  //don't try to get reesults until this job is complete
  var status = await bulkJobStatus(job.id,"ingest");

  var failed = await doAjaxAsync("/jobs/ingest/"+job.id+"/failedResults","get","text","text/csv");
  console.log(failed);//will be undefined if nothing failed, otherwise
  //will look like this
  /*
  "sf__Id","sf__Error",customExtIdField__c,Email,LastName,FirstName
  "","INVALID_FIELD:Number of fields in header is different from the row. header = 4 row = 3:--","","","",""
  "","INVALID_FIELD:Number of fields in header is different from the row. header = 4 row = 3:--","","","",""
  */

  var successful = await doAjaxAsync("/jobs/ingest/"+job.id+"/successfulResults","get","text","application/json");
  console.log(successful);


//================== Bulk Job Upsert ==================

  var job = await doAjaxAsync("/jobs/ingest","post","json","application/json",JSON.stringify({
    object : "Contact",
    externalIdFieldName : "customExtIdField__c",
    contentType : "CSV",
    operation : "upsert",
    lineEnding : "CRLF"
  }));
  console.log(job);
    
  //To do an upsert we just need an external key per this article 
  //https://developer.salesforce.com/docs/atlas.en-us.api_asynch.meta/api_asynch/walkthrough_upsert.htm
  var csv = 'customExtIdField__c,Email,LastName,FirstName\r\n555,buddy2@elf.com,Elf,Buddy\r\n123,aaron@example.com,Erin,Gray';  

  var ingest = await doAjaxAsync("/jobs/ingest/"+job.id+"/batches","put","text","text/csv",csv);
  console.log(ingest);

  var closejob = await doAjaxAsync("/jobs/ingest/"+job.id,"patch","json","application/json",JSON.stringify({
    state : "UploadComplete"
  }));


})();


});//end js anonymous function

async function doAjaxAsync(endpoint,method,dataType,ctype,data){

  let ajaxParams = {
    url: baseURL+endpoint,
    cache: true,//we do cache because otherwise it adds this stupid parameter
    method: method,
    dataType: dataType,
    headers:{
      'Authorization': 'OAuth '+token,
      'Content-Type': ctype
    }
  };
  if(data !== undefined){
    ajaxParams.data = data;
  }

  return $.ajax(ajaxParams);
}   


async function bulkJobStatus(jobid,type){
  console.log("ran it");
  let job = await doAjaxAsync("/jobs/"+type+"/"+jobid,"get","json");

  if(job.state != "JobComplete"){//keep looping until job complete
    return await bulkJobStatus(jobid,type);
  }else{//job is complete, now do something else
    console.log("must be done");
    return job;
  }

}


async function getContacts(nextRecordsUrl = ''){

  if(nextRecordsUrl == ''){
    var endpoint = 'https://'+instance+'.salesforce.com/services/data/v'+version+'/query/';
  }else{
    var endpoint = 'https://'+instance+'.salesforce.com'+nextRecordsUrl;
  }
  console.log("endpoint "+endpoint);

  
  //var token = sessionStorage.getItem("access_token");

  //let cc = await doAjaxAsync({csvstring:bulkAPIObject.contacts.slice(0,-3).replace(/[\r\n]/gm, ''),bid:$('#blazerid').val()},endpoints.contacts,"json");
  
  $.ajax({
    url: endpoint,//was ajax-routing.php
    cache: true,
    method: "get",
    dataType:"json",
    headers:{
      'Authorization': 'OAuth '+token,
      'Content-Type': 'application/json',
    },
    data: {
      q:'SELECT Id,Email FROM Contact'
    }
    }).done(function(resp){  
        console.log(resp);
        console.log(resp.records);
        console.log(originalCSVArray);
        crmContacts = crmContacts.concat(resp.records);
        if(resp.done == false){
          getContacts(resp.nextRecordsUrl);
        }else{
          console.log("length "+crmContacts.length)
          console.log(crmContacts);
        }/*


        //let response = query('SELECT Id, Name FROM Account LIMIT 52000');
        let baseNextUrl = resp.nextRecordsUrl.split('-')[0];
        let nextUrls = [];
        
        for(let i = 1; i < resp.totalSize / 2000; i++){
          let obj = {};
              obj.method = "GET";
              obj.url = `${baseNextUrl}-${i*2000}`;
          nextUrls.push(obj);
        }
        console.log(nextUrls);
        console.log(JSON.stringify(nextUrls));



        $.ajax({
          url: "https://na123.salesforce.com/services/data/v53.0/composite/batch/",//was ajax-routing.php
          cache: true,
          method: "post",
          dataType:"json",
          headers:{
            'Authorization': 'Bearer '+token,
            'Content-Type': 'application/json',
          },
          data:  JSON.stringify({
            "batchRequests": nextUrls
          })
          }).done(function(resp2){ 
            console.log(resp2);
            
            
          });

/*


        resp.records.forEach((contact) => { 
         // console.log(contact);

          let found = originalCSVArray.find(row => row[0] == contact.Email);
          if(found !== undefined){
            console.log("found length "+found.length);

            let deObject = {};
            deObject.SubscriberKey = contact.Id;
            deObject.AttendeeID = contact.Id;
            found.forEach((element, index) => { 
              console.log("header "+originalCSVHeaders[index]+ " "+ element);
              deObject[originalCSVHeaders[index].replace(" ","")] = element;
            });
            jsonForDE.items.push(deObject);
            
            var row = {};
            row.subscriberkey = contact.Id;
            row.email = contact.Email;
            row.firstName = found[1];
            row.lastName = found[2];
            addTableRowSingle(row);
          }
          


        });
        console.log(JSON.stringify(jsonForDE));
        createDataExtension(jsonForDE);
        //Object.assign(contactQueryResults,queryresults.results);
*/

    });
}

</script>        
      

    </body>
</html>









