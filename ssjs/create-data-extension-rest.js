<script runat="server">
//Platform.Load("core","1");
//HTTPHeader.SetValue("Access-Control-Allow-Methods","POST");
//HTTPHeader.SetValue("Access-Control-Allow-Origin","*");
//Platform.Request.ClientIP
//HTTPHeader.GetValue('host') 
var method = Platform.Request.Method();
var refURL = Platform.Request.ReferrerURL();
var expectedReferer = "somewebsite.com";
//var post = Platform.Request.GetPostData();
//var postObj = Platform.Function.ParseJSON(post);
var deName = Platform.Request.GetQueryStringParameter("deName");
var uploaderID = Platform.Request.GetQueryStringParameter("uploaderID");
var mid = Platform.Request.GetQueryStringParameter("businessUnit");
var createDE = Platform.Request.GetQueryStringParameter("createDe");
//Get standard fields sent from page. This is an integer, a count of standard headers from main landing
//We multiply by 1 to make sure it's a number. It was coming over as a string sometimes causing the if statement on line 76 to fail
var standardFields = Platform.Request.GetQueryStringParameter("standardFields")*1;

var headers = Platform.Request.GetQueryStringParameter("headers");//The actual full list of headers found in the CSV file
var response = {};
    var dataExtensions = {
        tokenstorage: "tokenstorage_donot_delete"
    }
switch(mid){
    case "123": var categoryId = 123; break;//Admin BU
    case "123": var categoryId = 123; break;//Advanced BU
    case "123": var categoryId = 123; break;//Standard BU
    case "123": var categoryId = 123; break;//Office of Sec BU
    default: var categoryId = 123;
}

var config = {
        mc:{
            subdomain:"xxxxxx",
            clientid:"xxxxx",
            clientsecret:"xxxxxx",
            mid:mid
        }
    };


//var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);
var token = checkForStoredToken("Marketing Cloud",mid);

var endpoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/data/v1/customobjects';

var retentionProps = {};
    retentionProps.isDeleteAtEndOfRetentionPeriod = true;
    retentionProps.isRowBasedRetention = false;
    retentionProps.isResetRetentionPeriodOnImport = false;
    retentionProps.dataRetentionPeriodLength = 120;
    retentionProps.dataRetentionPeriodUnitOfMeasure = 3;

var de = {};
    de.name = deName;
    de.key = deName;
    de.isSendable = true;
    de.isTestable = true;
    de.sendableCustomObjectField = "ID";
    de.sendableSubscriberField = "_SubscriberKey";
    de.categoryId = categoryId;
    de.clientId = clientId;
    de.isObjectDeletable = true;
    de.dataRetentionProperties = retentionProps;

    de.fields = [ 
        fieldObj("ID","Text",18,1,true,false),
        fieldObj("EmplID","Text",50,2,false,true),
        fieldObj("email","EmailAddress",254,3,false,true),
        fieldObj("FirstName","Text",100,4,false,true),
        fieldObj("LastName","Text",100,5,false,true)
        ];
    
var headerSet = headers.split('|');
if(headerSet.length > standardFields){
    for(var h = standardFields; h < headerSet.length; h++){
        loopCounter++;
        var ordinal = h*1+2;//when we created the fields above, we left off at 5, h will be 4 at start of loop, so we add 2 to get 6 
        de.fields.push(fieldObj(headerSet[h],"Text",255,ordinal,false,true));
    }
}


try{   

    if( refURL.indexOf(expectedReferer) > 0 ){
        var request = scriptUtilRequest(endpoint,"POST","Authorization", "Bearer "+token,Stringify(de));
        var resp = Platform.Function.ParseJSON(request.content + "");
        if(resp.id){
            response.message = "Data extension was created.";
            response.headerSetLength = headerSet.length;
            response.deNAME = deName;
            response.standardFields = standardFields;
            response.deID = resp.id;
            response.type = "Success";
            Write(Stringify(response));
        }    
    }



} catch(e){
    Write(Stringify(e))
}

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
function Write(str) {
   Platform.Response.Write(str);
}
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
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
        var message = "Script Util Request Failed: "+e.message + " " + e.description;
        Write(message)
    }
    
}
function checkForStoredToken(system,account_id){
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
    //adding this so we can also lookup by mid
    var tripleFilter = {
        LeftOperand: complexFilter,
        LogicalOperator:"AND",
        RightOperand: {
          Property: "mid",
          SimpleOperator: "equals",
          Value: account_id
        }
    }    

    var data = prox.retrieve("DataExtensionObject["+dataExtensions.tokenstorage+"]",cols,tripleFilter);
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
            },
            {
                "Name": "mid",
                "Value": account_id
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

//Sample errors
//The remote server returned an error: (409) Conflict. - from System //another DE with that name is already there




</script>


