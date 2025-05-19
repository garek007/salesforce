<script runat="server">

var response = {};  
var loops = 6;
var startingNum = 35;

var upperLimit = 16200000;
var lowerLimit = 15700000;
var batchSize = 500000;

var config = {
        mc:{
            subdomain:"xxxxxx",
            clientid:"xxxxxxx",
            clientsecret:"xxxxxxx",
            mid:123456789
        }
    };  
  
var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);

  
var endpoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/data/v1/customobjects';
var sqlEndPoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/automation/v1/queries';
/*
var retentionProps = {};
    retentionProps.isDeleteAtEndOfRetentionPeriod = true;
    retentionProps.isRowBasedRetention = false;
    retentionProps.isResetRetentionPeriodOnImport = false;
    retentionProps.dataRetentionPeriodLength = 120;
    retentionProps.dataRetentionPeriodUnitOfMeasure = 3;
*/
  

   
  
try{


    for(var l = 0; l < loops; l++){
        
        var deName = 'Invalid__AccountID_'+startingNum+'_500000SD';


        var de = {};
            de.name = deName;
            de.key = deName;
            de.isSendable = true;
            de.isTestable = false;
            de.sendableCustomObjectField = "ContactKey";
            de.sendableSubscriberField = "_SubscriberKey";
            de.categoryId = 460262;
            de.clientId = config.mc.mid;
            de.isObjectDeletable = true;
            //de.dataRetentionProperties = retentionProps;

            de.fields = [ 
                fieldObj("AccountID","Text",18,1,true,false),
                fieldObj("ContactKey","Text",18,2,false,true)
                ];

        var query = 'SELECT \r\n';
            query +='   AccountID \r\n';
            query +=',  ContactKey \r\n';
            query +='FROM Invalid_AccountID_with_rownumber \r\n';
            query +='WHERE RowNumber <= '+upperLimit + ' \r\n';
            query +='AND RowNumber > '+lowerLimit + ' \r\n'; 

        var queryActivity = {
            "name": deName,
            "targetName": deName,
            "targetKey": deName,
            "targetUpdateTypeId": 0,
            "targetUpdateTypeName": "Overwrite",
            "queryText" : query,
            "categoryId": 460263
        };
    




        Write("de name "+deName);
        Write("\r\n");
        Write("upper limit "+ upperLimit);
Write("\r\n");
        Write("lower limit "+ lowerLimit);
Write("\r\n");
Write("\r\n");
        var request = scriptUtilRequest(endpoint,"POST","Authorization", "Bearer "+token,Stringify(de));
        var resp = Platform.Function.ParseJSON(request.content + "");

        //check response from trying to create DE, if it has a key, proceed to create Query Definition
        if(resp.key){
            response.message = "Data extension was created.";
            response.deNAME = deName;
            response.deID = resp.id;
            response.type = "Success";
            Write(Stringify(response));

            var request2 = scriptUtilRequest(sqlEndPoint,"POST","Authorization", "Bearer "+token,Stringify(queryActivity));
            var resp2 = Platform.Function.ParseJSON(request2.content + "");

            if(resp.key){
                Write("\r\n");
                Write("Query Definition created.");
                Write("\r\n");
            }
        }  

        //increase upper and lower limit numbers by your chosen size.        
        upperLimit += batchSize;
        lowerLimit += batchSize;

        //increase startingNum
        startingNum += 1;

    }




  //Write(Stringify(resp));

  
   
  
  
} catch(e){
  Write(Stringify(e));
}
  
  
/**
 fieldObj function makes it easier to set up fields for data extension creation
 fieldObj(fieldName,fieldType,ordinal,isPrimaryKey,isNullable);
*/
function fieldObj(n,t,len,o,pk,nullable){
    var obj = {}
        obj.name = n;
        obj.type = t;
        obj["Length"] = len;
        obj.ordinal = o;
        obj.IsPrimaryKey = pk;
        obj.isNullable = nullable;
        obj.isTemplateField = false;
        obj.isInheritable = true;
        obj.isOverridable = true;
        obj.isHidden = false;
        obj.isReadOnly = false;
        obj.mustOverride = false;

    return obj;    
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
