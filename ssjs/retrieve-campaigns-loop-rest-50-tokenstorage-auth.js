<script runat="server">     
Platform.Load("Core","1");  

var soapAPI = new Script.Util.WSProxy();//soap API 
var config = {
        mc:{
            subdomain:"xxxxxx",
            clientid:"xxxxxx",
            clientsecret:"xxxxxx",
            mid:0123456
        }
    };
var dataExtensions = {
        tokenstorage: "tokenstorage",
        dimcampaign: "C9ECE178-8092-46F0-960B-39B3F54C1191"
    }
var token = checkForStoredToken("Marketing Cloud");
var baseURL = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/hub/v1/campaigns';

try {
    var page = 1;
    var pageSize = 50;
    var url = baseURL + '?$page=' + page + '&$pageSize=' + pageSize;
    var request = scriptUtilRequest(url,"GET","Authorization", "Bearer "+token,"");
    var resp = Platform.Function.ParseJSON(request.content + "");

    if(resp.count > pageSize){
        var loops = resp.count / pageSize;
        //you may ask, why start at 1 and not 0? Because we already have the items from page 1 in our first call!
        for(var i = 1; i < loops; i++){
            var nextPage = i + 1;
            var url = baseURL + '?$page=' + nextPage + '&$pageSize=' + pageSize;
            var request = scriptUtilRequest(url,"GET","Authorization", "Bearer "+token,"");
            var resp = Platform.Function.ParseJSON(request.content + "");
        }
    }

    var objectString = '';
    for(var index in resp.items){
        Write(resp.items[index].name+"\r\n");
        var props = {};
            props.CampaignID = resp.items[index].id;
            props.CampaignName = resp.items[index].name;
            props.CampaignCode = resp.items[index].campaignCode;
            props.CreatedDate = resp.items[index].createdDate;
            props.ModifiedDate = resp.items[index].modifiedDate;
        objectString += Stringify(props)+",";
    }
    Write(objectString);

    var insert = upsertDERowsAsync(config.mc.subdomain,config.mc.mid,token,deJSON(objectString.slice(0,-1)),dataExtensions.dimcampaign);
} catch (e) {
    Write("<br>e: " + Stringify(e));
}


function deJSON(json){
    var items = '{"items":['+json+']}';//json variable is a string of objects, IE '{key:value},{key:value},{key:value}'
    return items;
}


function upsertDERowsAsync(subdomain,mid,token,payload,deName){

    var baseURI = 'https://'+subdomain+'.rest.marketingcloudapis.com/';
    var endpoint = 'data/v1/async/dataextensions/key:'+deName+'/rows';
    var url = baseURI+endpoint;
    var contentType = 'application/json';
    var headerNames = ["Authorization"];
    var headerValues = ["Bearer "+token];    
   
    try {

        var req = new Script.Util.HttpRequest(url);

        req.emptyContentHandling = 0;
        req.retries = 2;
        req.continueOnError = false;
        req.contentType = "application/json"
        req.setHeader("Authorization", 'Bearer ' + token);
        req.method = "PUT";
        req.encoding = "UTF-8";
        req.postData = payload;
        //var p = '{ "items": [{"Email": "umezawa244@gmail.com","FirstName": "毅","LastName": "梅澤","beamery_id": "ec1f7002-33a0-4e59-9bd6-6e7389f7ffeb"}]}';

        var resp = req.send();      // return value will be "typeof clr"; Script.Util.HttpResponse
    
        Write(resp.content)


     } catch (e) {
        Write("<br>e: " + Stringify(e));
     }
    
}


function checkForStoredToken(system){

    var rightNow = new Date();
    var expiry = new Date();
        if(system == "Marketing Cloud"){
            expiry = expiry.setMinutes(expiry.getMinutes()-19);
        }else{
            expiry = expiry.setHours(expiry.getHours()-24);
        }
        

    var cols = ["token"];
    var leftFilter = {
        Property: "expiration",
        SimpleOperator: "greaterThan",
        Value: expiry
    };

    var rightFilter = {
        Property: "system",
        SimpleOperator: "equals",
        Value: system
    };

    var complexFilter = {
        LeftOperand: leftFilter,
        LogicalOperator:"AND",
        RightOperand: rightFilter
    }

    var data = soapAPI.retrieve("DataExtensionObject["+dataExtensions.tokenstorage+"]",cols,complexFilter);
    var existingToken = data.Results[0].Properties[0].Value;

    if(existingToken == null){

        switch(system){
            case "Marketing Cloud":var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);break;
            default:Write("something went wrong");
        }
 
        var props = [
            {
                "Name": "token",
                "Value": token
            },
            {
                "Name": "expiration",
                "Value": new Date()
            },
            {
                "Name": "system",
                "Value": system
            }
        ];
        var options = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};  
        var result = soapAPI.updateItem('DataExtensionObject', {
            CustomerKey: dataExtensions.tokenstorage,
            Properties: props
        },options); 
     
        return token; 
    }else{
        return existingToken
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
        var message = "Failed at Authentication: "+e.message;
        Write(message)
        //logFailed({ErrorMsg:message,ErrorDescription:e.description},"not_applicable");
    }
    
}
function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
</script>