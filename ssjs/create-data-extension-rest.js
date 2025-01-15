<script runat="server">
//Platform.Load("core","1");
//HTTPHeader.SetValue("Access-Control-Allow-Methods","POST");
//HTTPHeader.SetValue("Access-Control-Allow-Origin","*");
//Platform.Request.ClientIP
//HTTPHeader.GetValue('host') 
var method = Platform.Request.Method();
var refURL = Platform.Request.ReferrerURL();
var expectedReferer = "cloud.connected.depaul.edu";
//var post = Platform.Request.GetPostData();
//var postObj = Platform.Function.ParseJSON(post);
var deName = Platform.Request.GetQueryStringParameter("deName");
var uploaderID = Platform.Request.GetQueryStringParameter("uploaderID");
var mid = Platform.Request.GetQueryStringParameter("businessUnit");
var createDE = Platform.Request.GetQueryStringParameter("createDe");
var response = {};

switch(mid){
    case "531600": var categoryId = 3776; break;//Admin BU
    case "534128": var categoryId = 3797; break;//Advanced BU
    case "534127": var categoryId = 3748; break;//Standard BU
    case "539126": var categoryId = 3782; break;//Office of Sec BU
    default: var categoryId = 3195;
}

var config = {
        mc:{
            subdomain:"xxxxx",
            clientid:"xxxxx",
            clientsecret:"xxxxx",
            mid:mid
        }
    };


var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);

var endpoint = 'https://'+config.mc.subdomain+'.rest.marketingcloudapis.com/data/v1/customobjects';

var retentionProps = {};
    retentionProps.isDeleteAtEndOfRetentionPeriod = true;
    retentionProps.isRowBasedRetention = true;
    retentionProps.isResetRetentionPeriodOnImport = false;

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

try{   

    if( refURL.indexOf(expectedReferer) > 0 ){
        var request = scriptUtilRequest(endpoint,"POST","Authorization", "Bearer "+token,Stringify(de));
        var resp = Platform.Function.ParseJSON(request.content + "");
        if(resp.id){
            response.message = "Data extension was created";
            response.deNAME = deName;
            response.deID = resp.id;
            response.type = "Success";
            Write(Stringify(response))
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

//Sample errors
//The remote server returned an error: (409) Conflict. - from System //another DE with that name is already there




</script>


