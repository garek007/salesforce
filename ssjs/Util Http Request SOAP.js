    var req = new Script.Util.HttpRequest("https://"+subdomain+".soap.marketingcloudapis.com/Service.asmx");

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "text/xml;charset=UTF-8";
    req.setHeader("Authorization", 'Bearer ' + request.Token);
    req.setHeader("SOAPAction", 'Retrieve');
    //req.setHeader("Content-Type", 'text/xml;charset=UTF-8');
    req.method = "POST";
    req.postData = "<Envelope xmlns=\"http://schemas.xmlsoap.org/soap/envelope/\"\r\n    xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\">\r\n    <Header>\r\n        <fueloauth>"+request.Token+"</fueloauth>\r\n    </Header>\r\n    <Body>\r\n        <RetrieveRequestMsg xmlns=\"http://exacttarget.com/wsdl/partnerAPI\">\r\n            <RetrieveRequest>\r\n                <ObjectType>DataExtensionObject[ESWA_EPA_v1-cb_Testing_DE]</ObjectType>\r\n                <Properties>Test_Record_ID</Properties>\r\n                <Properties>_CustomObjectKey</Properties>\r\n\r\n\r\n                <Filter xsi:type=\"SimpleFilterPart\">\r\n                    <Property>Email_Address</Property>\r\n                    <SimpleOperator>equals</SimpleOperator>\r\n                    <Value>epa_v1-cb+global@salesforce.com</Value>\r\n                </Filter>\r\n            </RetrieveRequest>\r\n        </RetrieveRequestMsg>\r\n    </Body>\r\n</Envelope>";


    var resp = req.send(); 
    var soapXML = Stringify(resp.content);

    var nextIndex = soapXML.indexOf("Value",soapXML.indexOf("_CustomObjectKey"));
    var closingBracket = soapXML.indexOf("</Value>",nextIndex+6);
    var customObjKey = soapXML.substring(nextIndex+6,closingBracket);
    
Write("custom object key: "+customObjKey+"<br>");
//Write('<textarea>'+Stringify(resp.content)+'</textarea>')
Variable.SetValue("@xml",Stringify(resp.content));

</script>
%%[

         
Set @p = '<Properties>(.*?)<\/Properties>'
Set @o = RegExMatch(@xml,@p,1)

Output(Concat('<textarea>',@o,'</textarea>'))
Set @newxml = Concat('<Properties>',@o,'</Properties>')

Set @loaded = BuildRowSetFromXml(@newxml,'/Properties/Property',0);
Set @rows = RowCount(@loaded)




Output(Concat('<textarea>wwwwaaatffffffff ',@rows,'</textarea>'))

]%%






/**
 * 
 * More, but the ampscript above is good so I left it
 */

<script runat="server">
  Platform.Load("core","1");
  HTTPHeader.SetValue("Access-Control-Allow-Methods","POST,GET");
HTTPHeader.SetValue("Access-Control-Allow-Origin","*");
  HTTPHeader.SetValue("Access-Control-Allow-Headers","Content-Type");
if (Platform.Request.Method == "POST") {
    var config = {
        mc:{
            subdomain:"xxxx",
            clientid:"xxxx",
            clientsecret:"xxxx",
            mid:01234568
        }
    };
    var dataExtensions = {
        tokenstorage: "tokenstorage"
    }

    var post = Platform.Request.GetPostData();
    var postObj = Platform.Function.ParseJSON(post);



   
    var token = checkForStoredToken("Marketing Cloud");
  //Write(token);







    //var update = scriptUtilRequest(url,"POST","Authorization","Bearer "+token,Stringify(payload));


  var soapAction = 'Retrieve';//Create needs to be built, this will fail if you try create right now. 
  var soapEnv = '<Envelope xmlns="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><Header><fueloauth>'+token+'</fueloauth></Header><Body>';
  if(soapAction == "Retrieve"){
      soapEnv+= '<RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI"><RetrieveRequest>';
      soapEnv += postObj.soapEnv;
      //SAMPLE STRUCTURE --------- soapEnv+='<ObjectType>ImportDefinition</ObjectType><Properties>Name</Properties>';//the meat
      soapEnv+='</RetrieveRequest></RetrieveRequestMsg></Body></Envelope>';
  }else{
    //create
  }
  
     
 

    var req = new Script.Util.HttpRequest("https://"+config.mc.subdomain+".soap.marketingcloudapis.com/Service.asmx");

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "text/xml;charset=UTF-8";
    req.setHeader("Authorization", 'Bearer ' + request.Token);
    req.setHeader("SOAPAction", soapAction);
    //req.setHeader("Content-Type", 'text/xml;charset=UTF-8');
    req.method = "POST";
    req.postData = soapEnv;


    var resp = req.send(); 
    var soapXML = Stringify(resp.content);
  
  Write(soapXML);
  
  


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
     
        return token; 
    }else{
        return existingToken
    }

}
function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
</script>