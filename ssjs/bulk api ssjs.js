<script runat=server>
Platform.Load('Core','1');
try{
/* 
  Title: Bulk API integration to Sales Cloud
  Author: Eliot Harper, eliot.harper@cloudkettle.com
  Modified: Jul 21, 2022
  Description: creates batch jobs to create or update records in Sales Cloud

 Backlog:
 1. Log batch jobs to separate DE
 2. Create separate script activity to query jobs using API (see https://sforce.co/3RK86fr)
 3. Log failed record results using API (see https://sforce.co/3J8jMVr)
*/

var authUrl = 'https://test.salesforce.com';  

var deKey = 'BULK_API_TEST'; // DE key containing records to process
var pk = 'Id'; // field name for Salesforce record Id to process
var processedField = 'IsUpdated'; // Boolean field to update after uploading records
var debug = true; // will not update processedField if value is true (used for testing)

var prox = new Script.Util.WSProxy();
var mid = Platform.Function.AuthenticatedMemberID();
var jobId = null;
var operation = Request.GetQueryStringParameter("op");

// Plain text for POC purposes. Recommend using DecryptSymmetric 
// to decode encrypted object using keys in Key Management.

var creds = {
  clientId: 'xxxxx',
  clientSecret: 'xxxxx',
  username: 'mcbulk@test.com',
  password: 'xxxxx',
  securityToken: 'xxxxx'
}

var filter = { Property: processedField,
               SimpleOperator: 'notEquals', 
               Value: true
             }

// get data
var data = getData(deKey, filter);

if (data) { // only process if there are records returned

  // get access token
  var auth = oAuth(
    authUrl, 
    creds.clientId, 
    creds.clientSecret, 
    creds.username,
    creds.password, 
    creds.securityToken);

  var token = auth.access_token;
  var instance = auth.instance_url;

  // open bulk api job for lead update
  var leadJob = openBulkReq(instance, token, 'Lead', 'update');

  // create data file for lead data
  var id = 'Id'; // record Id value to update
  var cols = ['Currently_Enrolled_in_MC_Journey__c']; // columns to update
  var vals = [1]; // values to update
  var batch = processBatch(instance, token, leadJob.id, id, cols, vals);

  // close job
  var closeBulkLead = closeBulkReq(instance, token, leadJob.id);

  // open bulk api job for insert campaign member
  var cmJob = openBulkReq(instance, token, 'CampaignMember', 'insert');

  // create data file for campaign members
  var id = 'LeadId'; // record Id value
  var cols = ['CampaignID']; // columns to insert
  var vals = ['701AE000004NFfBYAW']; // values to insert (change value to requried CampaignId)
  var batch = processBatch(instance, token, cmJob.id, id, cols, vals);

  // close job
  var closeBulkCM = closeBulkReq(instance, token, cmJob.id);

  // update DE records
  if (!debug) updateData(deKey, filter);
}

// ================ functions ================

function oAuth(host, clientId, clientSecret, username, password, token) {

  var route = '/services/oauth2/token';
  var url = host + route;
  var contentType = 'application/x-www-form-urlencoded';

  var payload = 'grant_type=password';
  payload += '&client_id=' + clientId;
  payload += '&client_secret=' + clientSecret;
  payload += '&username=' + username;
  payload += '&password=' + password + token;
  
  var req = HTTP.Post(url, contentType, payload);
  var res = Platform.Function.ParseJSON(req['Response'][0]);
  
  return res;
}

function openBulkReq(host, token, obj, op) {
  
  var route = '/services/data/v49.0/jobs/ingest/';
  var contentType = 'application/json';
  var headerNames = ['Authorization'];
  var headerValues = ['Bearer ' + token];
  var url = host + route;
  var payload = {
    object: obj,
    contentType: 'CSV',
    operation: op,
    lineEnding: 'CRLF'
  };
  
  var req = HTTP.Post(url, contentType, Stringify(payload), headerNames, headerValues);
  var res = Platform.Function.ParseJSON(req['Response'][0]);
  
  return res;
}

function processBatch(instance, token, jobId, id, cols, vals) {

  var moreData = true;                
  var reqID = null;                                                                

  var csvData = id + ',' + cols.toString() + '\r\n'; 
      csvData += data.join(',' + vals.toString() + '\r\n');
  
  var updateJob = updateBulkReq(instance, token, jobId, csvData);  
  return updateJob;
}

function updateBulkReq(host, token, jobId, csvData) {

  var route = '/services/data/v49.0/jobs/ingest/' + jobId + '/batches';
  var url = host + route;
  var req = new Script.Util.HttpRequest(url);
  req.emptyContentHandling = 0;
  req.retries = 2;
  req.continueOnError = true;
  req.contentType = 'text/csv';
  req.method = 'PUT';
  req.setHeader('Authorization', 'Bearer ' + token);
  req.postData = csvData;

  var res = req.send();
  var resObj = Platform.Function.ParseJSON(String(resp.content));

  return resObj;
}

function closeBulkReq(host, token, jobId) {

  var url = host + '/services/data/v49.0/jobs/ingest/' + jobId;
  var payload = {}
  payload.state = 'UploadComplete';
  
  var req = new Script.Util.HttpRequest(url);
  req.emptyContentHandling = 0;
  req.retries = 2;
  req.continueOnError = true;
  req.contentType = 'application/json';
  req.method = 'PATCH';
  req.setHeader('Authorization', 'Bearer ' + token);
  req.postData = Stringify(payload);

  var res = req.send();
  var resObj = Platform.Function.ParseJSON(String(res.content));

  return resObj;
} 


function getData(key, filter) {

  var moreData = true,
      reqID = data = null;

  while (moreData) {

    moreData = false;

    if (reqID == null) {
      data = prox.retrieve('DataExtensionObject[' + key + ']', [pk], filter);
    } else {
      data = prox.getNextBatch('DataExtensionObject[' + key + ']', reqID);
    }

    if (data != null) {
      var arr = [];
      moreData = data.HasMoreRows;
      reqID = data.RequestID;
      for (var i = 0; i < data.Results.length; i++) {
        var res = data.Results[i].Properties;
        for (k in res) {
          if (res[k].Name == pk) { // ignore internal fields
            var id = res[k].Value;
          }
        }
        arr.push(id);
      }
    return arr;
    }
  }
}

function updateData(key, filter) {

  var moreData = true,
      reqID = data = null,
      pk = 'Id';

  while (moreData) {

    moreData = false;

    if (reqID == null) {
      data = prox.retrieve('DataExtensionObject[' + key + ']', [pk], filter);
    } else {
      data = prox.getNextBatch('DataExtensionObject[' + key + ']', reqID);
    }

    if (data != null) {
      var arr = [];
      moreData = data.HasMoreRows;
      reqID = data.RequestID;
      for (var i = 0; i < data.Results.length; i++) {
        var res = data.Results[i].Properties;
        for (k in res) {
          if (res[k].Name == pk) { // ignore internal fields
            var obj = {
            CustomerKey: key,
            Properties: [ 
                    { Name: pk, Value: res[k].Value },
                    { Name: processedField, Value: true }
                  ]
            }
          }
        }
        arr.push(obj);
      }
    var res = prox.updateBatch('DataExtensionObject', arr); 
    return res;
    }
  }
}
  
  }catch(e){
 Write(Stringify(e));
}
</script>