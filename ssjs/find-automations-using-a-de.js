%%[
SET @origin = HTTPRequestHeader("Referer")
SET @pattern = "^(https:\/\/(.*\.)?((mc.s10.exacttarget)\.com))($|\/)"
SET @match = RegExMatch(@origin,@pattern,1)
]%%

<script runat="server">
  Platform.Load("Core","1.1.1");
  try{
    if (Platform.Request.Method == "POST"){
      var post = Platform.Request.GetPostData();
      
      var dename = Request.GetFormField('deName');
      var querytext = Request.GetFormField('queryText');

      var config = {
          mc:{
              subdomain:'xxxxx',
              clientid:'xxxxx',
              clientsecret:'xxxxx',
              mid:0123456789,
              restURL:'https://xxxxxxx.rest.marketingcloudapis.com/'
          }
      };  
        var dataExtensions = {
            tokenstorage: "tokenstorage"
        }  
      

  try{
    var prox = new Script.Util.WSProxy();
    //prox.setClientId({"ID": Platform.Function.AuthenticatedMemberID(),"UserID": Platform.Function.AuthenticatedEmployeeID()}); 
    var accessToken = checkForStoredToken("Marketing Cloud",config,dataExtensions.tokenstorage);//ensure your DE exists before you use this and set name and Key to tokenstorage   
    
    if(dename == '' || dename == undefined || dename == null){
      var filter = {Property:"QueryText",SimpleOperator:"like",Value:querytext};
    }else{
      var filter = {Property:"DataExtensionTarget.Name",SimpleOperator:"equals",Value:dename};
    }

    var getquerys = prox.retrieve("QueryDefinition",["Name","ObjectID","DataExtensionTarget.Name"], filter);
    
    Write("Searching for Queries & Automations that alter ["+dename+"]<br><br>");
    
    
    for (q = 0; q < getquerys.Results.length; q++) {
      var Activity = prox.retrieve("Activity",["Name","Definition.ObjectID","ObjectID","Program.ObjectID"], {Property:"Name",SimpleOperator:"Equals",Value:getquerys.Results[q].Name});

      for (a = 0; a < Activity.Results.length; a++) {
        
  
        var content = Platform.Function.HTTPGet(config.mc.restURL+'automation/v1/automations/'+Activity.Results[a].Program.ObjectID,false,0,['Authorization'],['Bearer '+accessToken],status);
       

        var json = Platform.Function.ParseJSON(content);
        for (s = 0; s < json.steps.length; s++) {
          for (ac = 0; ac < json.steps[s].activities.length; ac++) {
            if (json.steps[s].activities[ac].activityObjectId == getquerys.Results[q].ObjectID) {
              if(json.status == 'Scheduled'){
                Write("SQL Query called <b>["+json.steps[s].activities[ac].name+"]</b> found on step "+json.steps[s].step+" in Automation <b>["+json.name+"]</b><br>");
              }              
            }
          }
        }
      }
    }
  }
  catch(error) {
    Write('Message: '+ error.description);
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

function Output(str) {
    Platform.Response.Write(str);
 }





    }else{

      var MATCH = Variable.GetValue("@match");
      var login = Request.GetQueryStringParameter('login');



      if ( !MATCH || login != 'cb3labcorp' ) { MATCH = null}
      HTTPHeader.SetValue("Access-Control-Allow-Methods","POST"); 
      HTTPHeader.SetValue("Access-Control-Allow-Origin",MATCH);  
      HTTPHeader.SetValue("Strict-Transport-Security","max-age=200");  
      HTTPHeader.SetValue("X-XSS-Protection","1; mode=block");  
      //HTTPHeader.SetValue("X-Frame-Options","Deny");  
      //HTTPHeader.SetValue("X-Content-Type-Options","nosniff");  
      //HTTPHeader.SetValue("Referrer-Policy","strict-origin-when-cross-origin"); 
    </script>
<form method="post" action="https://cloud.labcorpmessage.com/find-automations-using-de">
  <label for="deName">Data Extension name</label>
  <input type="text" name="deName" id="deName" />
<br>
  <label for="queryText">Query Text Like</label>
  <input type="text" name="queryText" id="queryText" />
  <input type="hidden" name="login" value="cb3labcorppost">
  <button type="submit">
    Submit
  </button>
  
</form>

<script runat="server">
    }
</script>

  
<script runat="server">
  //HTTPHeader.SetValue("Content-Security-Policy","default-src 'self'");   
  }catch(e){
    Write(Stringify(e));
    Write('Unauthorized');
  }
</script>

