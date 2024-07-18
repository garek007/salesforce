<script runat="server">


    var contentType         = "application/json";
    var headerNames         = ["Accept","Authorization"]; 

    var config = {
        mc:{
            subdomain:"xxxx",
            clientid:"xxxx",
            clientsecret:"xxxx",
            mid:0123456789
        },
        beamery:{
            baseURL:"https://frontier.beamery.com/v1/"
        }
    };
    var dataExtensions = {
        errorhandling: "Beamery_Retrieve_errorhandling",
        tokenstorage: "tokenstorage",
        beamerymain: "Beamery_withPK",
        beameryuserswithpools: "Beamery_Users_with_Pools"
    }
    var prox = new Script.Util.WSProxy();    
    var accessToken = checkForStoredToken("Beamery");
	 
    var moreData = true;
    var contactArr = [];
    var offset = 0;
    //var previousBatch = 0;
    var now =  getIsoTime();
    var lookback = getIsoTime("-35","MI");
    var totalRetrieved = 0;
    var totalCount = 0;
    var lb = "<br><br>";
function lb(){	
	Write("<br><br>");

}

    try{

        while(moreData == true){
            var retrieve = listContacts(lookback,offset,config.beamery.baseURL);
            //contactArr.push(retrieve.contacts)

            //Write("Retrieved: "+Stringify(retrieve.contacts));
            
            totalRetrieved += Number(retrieve.last_batch);
            totalCount = retrieve.total_count;
            offset = totalRetrieved;

            for(var i in retrieve.contacts){
                contactArr.push(retrieve.contacts[i]);
            }

            if(totalCount <= totalRetrieved){
                moreData = false;
            }
        }

        if(contactArr.length > 0){
            Write("total retrieved: "+totalRetrieved+lb);
            Platform.Function.InsertData(dataExtensions.errorhandling, ["number_retrieved"], [totalRetrieved])

            var cStr = stringifyContacts(contactArr);
            var json = deJSON(cStr[0]);
                
            var mctoken = checkForStoredToken("Marketing Cloud");
            var insert = upsertDERows(config.mc.subdomain,config.mc.mid,mctoken,deJSON(cStr[0]),dataExtensions.beamerymain);
            var poolsandstuff = upsertDERows(config.mc.subdomain,config.mc.mid,mctoken,deJSON(cStr[1]),dataExtensions.beameryuserswithpools);
                        
        }

    }catch(e){
        Write(Stringify(e));
    }

//https://ampscript.xyz/how-tos/how-to-use-wsproxy-to-work-with-data-extensions-in-ssjs/
//https://www.linkedin.com/pulse/introducing-wsproxy-salesforce-marketing-cloud-eliot-harper/
function getIsoTime(offset,units){

    try{
    var amp = '\%\%[ ';

        if(offset){
            amp += 'set @date = DateAdd(Now(),"'+offset+'","'+units+'") '
        }else{
            amp += 'set @date = Now() '
        }
        
        amp += 'set @d = FormatDate(@date,"iso") '
        amp += 'output(v(@d)) ';
        amp += ']\%\%';
        return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        //Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        return Stringify(e2);
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

	var data = prox.retrieve("DataExtensionObject["+dataExtensions.tokenstorage+"]",cols,complexFilter);
	var existingToken = data.Results[0].Properties[0].Value;
	if(existingToken == null){

		switch(system){
			case "Marketing Cloud":var token = authMC(config.mc.subdomain,config.mc.mid,config.mc.clientid,config.mc.clientsecret);break;
			case "Beamery":var token = authBeamery2(config.beamery.baseURL);break;
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

		var result = prox.createItem('DataExtensionObject', {
			CustomerKey: dataExtensions.tokenstorage,
			Properties: props
		});	
		return token;	
	}else{
		return existingToken
	}

}
function authBeamery2(url){
    
    try{

            var creds = getCredentials();
            var url = url+"oauth/token";

            var request = scriptUtilRequest(url,"POST","Accept", "application/json",creds);
            var resp = Platform.Function.ParseJSON(request.content + "");

            var token = resp.access_token;

            return token;
   
   

    }catch(e){
        //res.errors.push({ErrorMsg:e.message,ErrorDescription:e.description,IP_Address:Platform.Request.ClientIP});
        var message = "Failed at Authentication: "+e.message;
        Write(message)
        //logFailed({ErrorMsg:message,ErrorDescription:e.description},"not_applicable");
    }
}
function getCredentials(){

  try{
    var amp = '\%\%[ ';
        amp += 'var @creds '
        amp += 'set @creds = \'GLkjK9vUqvIrKbSJ2qRuHWnYGeGFIs3bmyJPqLxddIL7JWXhQPFWZxDZ4716hQY8wx7ID1iQ1rv5sTeiqGXUCReRyfeh0JTFdKJgfIbHzxpsAQzv/ksMTubEn6EcY8DRLFxaOa\' '
        amp += 'set @creds = DecryptSymmetric(@creds,"AES","BEAM_PWD",@null,"BEAM_SALT",@null,"BEAM_IV",@null) '
        amp += 'output(v(@creds)) ';
        amp += ']\%\%';
        return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
		//Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
		return Stringify(e2);
    }      
}
function stringifyContacts(contacts){
        //var contacts = resp.contacts;//contacts array
        var items = '';
		var userswithpools = '';

        //Polyfill for trim
        String.prototype.trim = function () {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };

        //Write(resp.contacts.length);

        /*
        for(var i=0;i<contacts.length;i++){
            var contactEmails = contacts[i].emails;
            for(var e=0;e<contactEmails.length;e++){
                items += '{"Email":"'+contactEmails[e]+'"}';
            }
            if(i<contacts.length-1){
                items += ',';
            }
        }*/
        for(var i=0;i<contacts.length;i++){
            var itemObj = new Object();
            var lists = contacts[i].lists;
            var globalTags = contacts[i].globalTags;
            var skills = contacts[i].skills;
            var customFields = contacts[i].customFields;
            var languages = contacts[i].languages;
            //Write(Stringify(skills));
            var pools = '';
            var poolids = '';
            var tags = '';
            var skillStr = '';
            var language = 'Unspecified';          
            function ebmLead(status){
				switch(status){
					case "Lead":
					case "Outreach Made":
					case "Passive":
					case "Engaged":
						return true;
						break;
					default: return false;
				}
            }

            if(contacts[i].primaryEmail && ebmLead(contacts[i].status.value)){
                       
                    var first = (contacts[i].firstName != null) ? contacts[i].firstName.trim() : "Unspecified";
                    var last = (contacts[i].lastName != null) ? contacts[i].lastName.trim() : "Unspecified";

                    for(var p=0; p < lists; p++){
						
                        pools+=lists[p].name+";";
                        poolids+=lists[p].id+";";

						var poolObj = new Object();
						poolObj.beamery_id = contacts[i].id;
						poolObj.poolid = lists[p].id;

						userswithpools += Stringify(poolObj);
						userswithpools += ',';


                    }

                    //try to determine contact language and areas of interest by looping through custom fields
                    for(var c=0; c < customFields.length; c++){
                        if(customFields[c].displayName == "Preferred Language"){
                            language = customFields[c].displayValue;
                        }
                        
                        if(customFields[c].displayName == "Primary Area of Interest"){
                          Write(customFields[c].displayValue);
                          itemObj.Segment1 = customFields[c].displayValue;
                        }
                        if(customFields[c].displayName == "Secondary Area of Interest"){
                          Write(customFields[c].displayValue);
                          itemObj.Segment2 = customFields[c].displayValue;
                        }                        

                    }    
                    if(language == 'Unspecified'){
                      if(languages != null){
                        language = languages[0].value;
                      }
                    }
                    //end determine contact language

                    for(var p=0; p < globalTags.length; p++){
                        tags+=globalTags[p].value+";";
                    }        
                    for(var skill=0;skill < skills.length; skill++){
                        skillStr += skills[skill]+";";
                    }                         
          
                    if(contacts[i].createdTime == contacts[i].updatedTime){
                        Write("Dates match: "+contacts[i].id+"<br>")
                    }
                    itemObj.Email = contacts[i].primaryEmail;
                    itemObj.Pools = pools;
                    itemObj.poolids = poolids;
                    itemObj.Tags = tags;
                    itemObj.FirstName = first;
                    itemObj.LastName = last;
                    itemObj.beamery_id = contacts[i].id;
                    itemObj.Date = contacts[i].createdTime;
                    itemObj.created_at = contacts[i].createdTime;
                    itemObj.updated_at = contacts[i].updatedTime;
                    itemObj.DateText = contacts[i].createdTime;
                    itemObj.skills = skillStr;
                    itemObj.Country = contacts[i].location.country;
                    itemObj.Language = language;
                    itemObj.Status = contacts[i].status.value;
        
                    //items += '{"Email":"'+contacts[i].primaryEmail+'","Pools":"'+pools+'","LastName":"'+last+'","FirstName":"'+first+'","Tags":"'+tags+'"}';
                    items += Stringify(itemObj);
                    items += ',';
                    
            }
          
        }    

        return [items.slice(0,-1),userswithpools.slice(0,-1)];
}
function listContacts(created_at,offset,url){
    var headerValues2 = ["application/json",accessToken];

    //var url = url+"contacts?created_at=2024-05-29T15:42:10.6979099-06:00&created_at_op=gte&sort_field=createdAt&sort_order=asc";
    //var url = url+"contacts?created_at="+created_at+"&created_at_op=gte&sort_field=createdAt&sort_order=asc";
    var url = url+"contacts?updated_at="+created_at+"&updated_at_op=gte&sort_field=createdAt&sort_order=asc";
    //var url = url+"contacts?email=umezawa244@gmail.com";
    if(offset){
        url += "&offset="+offset
    }

    try{
    
        var request = scriptUtilRequest(url,"GET","Authorization", "Bearer "+accessToken);
        var resp = Platform.Function.ParseJSON(request.content + "");

        return resp; 

    }catch(e){
        var message = "Failed at Find Contact by Email: "+e.message;
        //logFailed({ErrorMsg:e.message,ErrorDescription:e.description},email);
        return e;
    }
}



function deJSON(json){
    var items = '{"items":['+json+']}';
    return items;
}

function containsSpecialChars(str) {
    //var specialChars = /[!àอุ@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
    //var specialChars = /[!àอุ@#$%^&*()_+\-=\[\]{};':"\\|,<>\/?~]/;
    //var specialChars = /[!àอุ@#$%^&*()_+=\[\]{};':"\\|,<>\/?~]/;
    var validChars = /[^-.\w\s]/;;
    return validChars.test(str);
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
function upsertDERows(subdomain,mid,token,payload,deName){

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

function upsertDE (options) {
// Uses the API to update records in a DE
// Requires options object which contains clientID and the update "object" {CustomerKey/Properties}

/*
   <soap:Body>
      <UpdateResponse xmlns="http://exacttarget.com/wsdl/partnerAPI">
         <Results xsi:type="DataExtensionUpdateResult">
            <StatusCode>OK</StatusCode>
            <StatusMessage>Updated DataExtensionObject</StatusMessage>
            <OrdinalID>0</OrdinalID>
            <Object xsi:type="DataExtensionObject">
               <Client>
                  <ID>7000714</ID>
               </Client>
               <PartnerKey xsi:nil="true"/>
               <ObjectID xsi:nil="true"/>
               <CustomerKey>GPUK_EU_Promo_Smartsheet_Data</CustomerKey>
               <Properties>
                  <Property>
                     <Name>rowID</Name>
                     <Value>fakeID</Value>
                  </Property>
                  <Property>
                     <Name>sheetID</Name>
                     <Value>fakeID</Value>
                  </Property>
                  <Property>
                     <Name>marketingMessage</Name>
                     <Value>Upsert Test Just Happened.</Value>
                  </Property>
               </Properties>
            </Object>
         </Results>
         <RequestID>0fae343e-5508-4581-9c61-2596fd76df60</RequestID>
         <OverallStatus>OK</OverallStatus>
      </UpdateResponse>
   </soap:Body>
*/

	var api = new Script.Util.WSProxy();
	    api.setClientId({ "ID": options.clientID}); // top-level MID
	var objectType = 'DataExtensionObject';

	options['options'] = {SaveOptions: [{'PropertyName': '*', SaveAction: 'UpdateAdd'}]};

//	Write(Stringify(options)+"\n"); //DEBUG
	var data = api.updateItem(objectType, options['object'], options['options']);
//	Write(Stringify(data)+"\n"); //DEBUG

	return(data);

}//upsertDE
function logFailed(obj,email){
    var failed = DataExtension.Init("ENT.LoggerDE");
    obj.IP_Address = Platform.Request.ClientIP;
    obj.FailedEmail = email;
    failed.Rows.Add(obj);        
    sendEmail(email);
}
function sendEmail(failedEmail){
    var data = {
        attributes: {
            FirstName:"Stan",
            FailedEmail:failedEmail
        },
        subscriber: {
            SubscriberKey: "0037y00000xxxB",
            EmailAddress: "test@test.com"
        }
    }
    try{
        var tsd = TriggeredSend.Init(0123456);
        var status = tsd.Send(data.subscriber,data.attributes);
        if(status != "OK"){
            Write("Error at triggered email: "+Stringify(status));
        }
    } catch(e){
        Write("Error: "+Stringify(e));
    }
}
</script>