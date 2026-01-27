<script runat="server">
  Platform.Load("Core", "1");
  var logDE = DataExtension.Init('automation_log');//where automation errors are logged
    var config = {
        mc:{
            subdomain:'xxxx',
            clientid:'xxxx',
            clientsecret:'xxxx',
            mid:0123456789,
            restURL:'https://[subdomain].rest.marketingcloudapis.com/'
        }
    };   
    var dataExtensions = {
        tokenstorage: "tokenstorage"
    };
  
try{
var accessToken = checkForStoredToken("Marketing Cloud",config,dataExtensions.tokenstorage);//ensure your DE exists before you use this and set name and Key to tokenstorage

  
var url = 'https://'+config.subdomain+'.soap.marketingcloudapis.com/Service.asmx';
var contentType = 'text/xml; charset=UTF-8';
var headerNames = ["SOAPAction"];
var headerValues = ["Perform"];
var automationObjectId = "0d674c3d-xxxx-xxxx-xxxx-2bd137ba3909";

payload= '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">'
payload+= '   <s:Header>'
payload+= '   <fueloauth xmlns="http://exacttarget.com">' + accessToken + '</fueloauth>'
payload+= '   </s:Header>'
payload+= '   <s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">'
payload+= '        <PerformRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">'
payload+= '            <Action>start</Action>'
payload+= '            <Definitions>'
payload+= '                <Definition xsi:type="Automation">'
payload+= '                    <ObjectID>' + automationObjectId +'</ObjectID>'
payload+= '                </Definition>'
payload+= '            </Definitions>'
payload+= '        </PerformRequestMsg>'
payload+= '   </s:Body>'
payload+= '</s:Envelope>'




var result = HTTP.Post(url,contentType,payload,headerNames,headerValues);
var statusCode = result["StatusCode"];
var performResponse = result["Response"][0];
//performResponse = Stringify(performResponse).replace(/[\n\r]/g, '');
//Output(performResponse);
//logDE.Rows.Add({error:performResponse});
  
  
  
  
var index = performResponse.indexOf('StatusCode');
var index2 = performResponse.indexOf('</StatusCode');


var index3 = performResponse.indexOf('StatusMessage');
var index4 = performResponse.indexOf('</StatusMessage');

var statCode = performResponse.substring(index+11,index2);

var statusCode = performResponse.substring(index+11,index2);
var statusMsg = performResponse.substring(index3+14,index4);


logDE.Rows.Add({StatusCode:statusCode,StatusMessage:statusMsg});  
  
  
  
} catch (e){

  Output(Stringify(e));
  
  logDE.Rows.Add({other_errors:Stringify(e)});
}
  
  
  
  
  
function Output(str) {
    Platform.Response.Write(str);
 }
function Stringify(obj) {
    return Platform.Function.Stringify(obj);
}  
  
   
  
function checkForStoredToken(system,config,dataExtension){
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

    var data = prox.retrieve("DataExtensionObject["+dataExtension+"]",cols,complexFilter);
    var existingToken = data.Results[0].Properties[0].Value;
    if(existingToken == null){

        switch(system){
            case "Marketing Cloud":var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);break;
            case "Beamery":var token = authBeamery2(config.beamery.baseURL);break;
            default:Output("something went wrong");
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
             CustomerKey: dataExtension,
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
        Output("<br>e: " + Stringify(e));
     }
}  

function scriptUtilRequest(url,method,headerName,headerValue,postData,contentType){
    var req = new Script.Util.HttpRequest(url);

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = contentType || 'application/json';
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
        Output(message);
        Output("\r\n");
        Output(e.description);
        //logFailed({ErrorMsg:message,ErrorDescription:e.description},"not_applicable");
    }
    
}  
</script>
