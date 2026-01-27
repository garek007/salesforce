<script runat="server">
//creates a data extension and updates an existing query to target it. 
var response = {}; //for logging

var startingNum = Platform.Request.GetQueryStringParameter("start")*1;
var queryDefinitionId = Platform.Request.GetQueryStringParameter("id");


var config = {
        mc:{
            subdomain:"xxxx",
            clientid:"xxxx",
            clientsecret:"xxxx",
            mid:0123456789
        }
    };  
  
var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);

  
var endpoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/data/v1/customobjects';
var sqlEndPoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/automation/v1/queries/'+queryDefinitionId;
/*
var retentionProps = {};
    retentionProps.isDeleteAtEndOfRetentionPeriod = true;
    retentionProps.isRowBasedRetention = false;
    retentionProps.isResetRetentionPeriodOnImport = false;
    retentionProps.dataRetentionPeriodLength = 120;
    retentionProps.dataRetentionPeriodUnitOfMeasure = 3;
*/
  

try{
        
    var deName = 'Invalid_MDM_LPIDS_ACCTID_'+startingNum+'_500000';

    var query = 'SELECT \r\n';
        query +='   AccountID \r\n';
        query +=',  ContactKey \r\n';
        query +='FROM '+deName+'SD'; 

    var queryActivity = {
        "name": "DailyLPIDCleanup_Staging",
        "targetName": "DailyLPIDCleanup_Staging",
        "targetKey": "048AE0E0-xxxx-xxxx-xxxx-B719BB7541B6",
        "targetUpdateTypeId": 0,
        "targetUpdateTypeName": "Overwrite",
        "queryText" : query
    };


       
Write("\r\n");
Write("\r\n");


//check response from trying to create DE, if it has a key, proceed to create Query Definition

    //response.message = "Data extension was created.";
    response.deNAME = deName;
    //response.deID = resp.id;
    response.type = "Success";
    Write(Stringify(response));

    var request2 = scriptUtilRequest(sqlEndPoint,"PATCH","Authorization", "Bearer "+token,Stringify(queryActivity));
    var resp2 = Platform.Function.ParseJSON(request2.content + "");
    Write(Stringify(resp2));

    if(resp.key){
        Write("\r\n");
        Write("Query Definition created.");
        Write("\r\n");
    }


   
  
} catch(e){
  Write(Stringify(e));
}
  
  
  
function scriptUtilRequest(url,method,headerName,headerValue,postData){
    var req = new Script.Util.HttpRequest(url);

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "application/json"
    req.setHeader(headerName,headerValue);
    req.method = method;
    req.encoding = "UTF-8";
    if(postData){
        req.postData = postData;
    }

try{
    var resp = req.send();
    return resp;

    }catch(e){
        //res.errors.push({ErrorMsg:e.message,ErrorDescription:e.description,IP_Address:Platform.Request.ClientIP});
        var message = "Script Util Request Failed: "+e.message + " " + e.description;
        Write(message)
    }
}  
  
function authMC(subdomain,accountid,clientid,clientsecret){

    var baseURI = 'https://'+subdomain+'.auth.marketingcloudapis.com/';
    var endpoint = 'v2/token';
    var url = baseURI+endpoint;
    var grant = 'client_credentials';
    var contentType = 'application/json';
    var payload = '{"grant_type":"'+grant+'","client_id":"'+clientid+'","client_secret":"'+clientsecret+'","account_id":"'+accountid+'"}';
    try {

        var request = scriptUtilRequest(url,"POST","Accept", "application/json",payload);
        var resp = Platform.Function.ParseJSON(request.content + "");
        return resp.access_token; 

    } catch (e) {
        Write("<br>e: " + Stringify(e));
    }
}
function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
</script>
