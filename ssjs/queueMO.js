
<script runat="server">
  
if (Platform.Request.Method == "POST") {
    var config = {
        mc:{
            subdomain:"xxxxxxxxxxxxxxxxx",
            clientid:"xxxxxxxxxxxxxxxxxx",
            clientsecret:"xxxxxxxxxxxxxxxxx",
            mid:0123456
        }
    };
    var dataExtensions = {
        errorhandling: "errorhandling",
        tokenstorage: "tokenstorage"
    }

    var post = Platform.Request.GetPostData();
    var postObj = Platform.Function.ParseJSON(post);
   
    var token = checkForStoredToken("Marketing Cloud");

    var url = "https://"+config.mc.subdomain+".rest.marketingcloudapis.com/sms/v1/queueMO"; 

    var payload = {};
        payload.mobileNumbers = [postObj.phone];
        payload.shortCode = "0123456";
        payload.messageText = "KEYWORDOPTIN";
    
    var update = scriptUtilRequest(url,"POST","Authorization","Bearer "+token,Stringify(payload));

    Write(update.content);

}else{
    Write("Not Authorized");
}

function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
/**
 * @author Stan Alachniewicz
 * @description Checks a data extension for a stored authentication token
 * If the token is found it is returned. If the token is expired, a new
 * token will be generated.
 * @param system – text – token system, IE "Marketing Cloud" or "Salesforce"
 * @return – token – the token to make calls to the system provided
*/
function checkForStoredToken(system){
    var prox = new Script.Util.WSProxy(); 
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

    var data = prox.retrieve("DataExtensionObject["+dataExtensions.tokenstorage+"]",cols,complexFilter);
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
        var result = prox.updateItem('DataExtensionObject', {
            CustomerKey: dataExtensions.tokenstorage,
            Properties: props
        },options);	
        Write("<br>result: "+result);
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

</script>