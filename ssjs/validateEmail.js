<script runat="server">

    Platform.Load("Core","1.1.1");
    var upsertRecord = true;

    var baseURL             = "https://frontier.beamery.com/v1/";
    var contentType         = "application/json";
    var headerNames         = ["Accept","Authorization"];  
    var mcIntegrationUser   = "7a53d58c17c8d7f03751"; //ID of Beamery MC API User
    var mid                 = Platform.Function.AuthenticatedMemberID();
    var allSubsListId       = 23561; // all subs list id, get from SOAP List object (not available in UI)
    var autoSupListKey      = 'PREFS_SNOOZE'; // auto-suppression list external key
    var res                 = { errors: [],success: [] ,msg: []};
    var log = [];
    var soapApi             = new Script.Util.WSProxy();  
    var lb = "<br><br>"; 
    var deObj               = DataExtension.Init("ENT.GNJ-Welcome_validateEmail");
    //var processedde         = DataExtension.Init("ENT.WTLFormSubmissionsBeameryProcessed");     
    var debug = true;

    if(debug){
        var email = Request.GetQueryStringParameter("email");
        Write("Debugging mode on: "+lb);
        var rows = deObj.Rows.Lookup(["validated"], [false]);
    }else{
        var rows = deObj.Rows.Lookup(["processed"], [false]);
    }
    try{

        
        if(rows.length == null){
            Write("No records found");
            log.push("No records found");
        }
        
        for(var rownum in rows){

            var data = {};
            for (var prop in rows[rownum]) {
                if (Object.prototype.hasOwnProperty.call(rows[rownum], prop)) {
                    if(rows[rownum][prop] != ""){
                        //remove unwanted/needed properties
                        switch(prop){
                            case "_CustomObjectKey":
                            case "_CreatedDate":break;
                            default:data[prop] = rows[rownum][prop];
                        }
                    }
                }
            }

            
            //Write(Stringify(data));
            var isValid = validateEmail(data.Email);

            if(isValid == true){
                Write("Email address is valid: "+data.Email+lb);
                deObj.Rows.Update({validated:1},["Email"],[data.Email]);
            }
         
  
            //output(log);
        }
        

    }catch(e){
        
        Write(Stringify(e));
    }

function validateEmail(emailaddr){
    var payload = {
        email: emailaddr,
        validators: [ 
        'SyntaxValidator',
        'MXValidator',
        'ListDetectiveValidator'
        ]
    }
    var restApi = new Script.Util.RestProxy('1btsih0ax64q0x13wcl777fl', 'UHLMA2rB699BqcOnv0pz9gMU');//clientid and secret of installed package
    var resp = restApi.Post('/address/v1/validateEmail', payload);

   

    if (resp.statusCode == 200) {
        if (resp.content.valid) {
        res.validEmail = true;
        return true;
        } else {
        res.validEmail = false;
        res.errors.push('email address failed ' + resp.content.failedValidation);
        return false;
        }
    } else {
        res.errors.push('email validation failed');
        return false;
    }

}

function output(array){
    var str = '';
    for(var msg in array){
        str += array[msg]+lb;
    }
    if(debug){
        Write(str);
    }
}
function logFailed(obj,email){
    var failed = DataExtension.Init("ENT.BeameryFail");
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
            SubscriberKey: "0037y00000K2av1AAB",
            EmailAddress: "salachniewicz@salesforce.com"
        }
    }
    try{
        var tsd = TriggeredSend.Init(71306);
        var status = tsd.Send(data.subscriber,data.attributes);
        if(status != "OK"){
            Write("Error at triggered email: "+Stringify(status));
        }
    } catch(e){
        Write("Error: "+Stringify(e));
    }
}

function authBeamery2(){
    
    try{
        var creds = getCredentials();
        var url = baseURL+"oauth/token";
        var headerValues = ["application/json"];
        

        var headerNames2         = ["Accept"];  
        var returnCode = HTTP.Post(url,"application/json",creds,headerNames2,headerValues);
        var resp = Platform.Function.ParseJSON(returnCode.Response[0]);   
        
        var accessToken = resp.token;
        return resp.access_token;
    }catch(e){
        //res.errors.push({ErrorMsg:e.message,ErrorDescription:e.description,IP_Address:Platform.Request.ClientIP});
        var message = "Failed at Authentication: "+e.message;
        logFailed({ErrorMsg:message,ErrorDescription:e.description},"not_applicable");
    }
}
function findContactByEmail(email){
    var headerValues2 = ["application/json",accessToken];
    var url = baseURL+"contacts?email="+email;
    
    try{
        var returnCode = HTTP.Get(url,headerNames,headerValues2);
        var resp = Platform.Function.ParseJSON(returnCode.Content);
        //Write(resp.contacts[0].id);Write("\n\r");Write("\n\r");Write("\n\r");

        
        return resp.contacts[0];    

    }catch(e){
        var message = "Failed at Find Contact by Email: "+e.message;
        logFailed({ErrorMsg:e.message,ErrorDescription:e.description},email);
        return e;
    }
}
function insertBeamery(data){
   
   var obj = setupBeameryObject(data);//pass posted data and create object
   var retObj = {};
   //var testObj = {id:"6f66e2c4-598d-477a-8ad7-9ed84e72efa8",customFields:[{id:"cd5a3ea2-b295-4de5-807a-3f2f465f8ab8",value:"9e980302-42ce-49d0-a74d-e2adfafd2055"}]};
   
   try{

       if(upsertRecord){
            var accessToken = authBeamery2();  
            var beamery = findContactByEmail(obj.primaryEmail);
            var beamery_id = beamery.id;
            //Write("Processing email: "+data.email+lb);
            


           //should we also check for them in MC? I think so.
            if(beamery_id == undefined){
                log.push("Contact not found in Beamery, creating... "+data.email);
                obj.emails = [data.email];
                var c = createContact(obj);
                retObj.type = 'Create';
                var sk = Platform.Function.ParseJSON(c.Response[0]);
                //Write(sk.id);
                //</br></br>Write(Stringify(c.Response[0]))
                if (!sk.id) {
                    res.errors.push('failed to create Beamery record') 
                } else { // create Subscriber now in case they decide to unsub before an email is sent
                    //createSubscriber(sk.id,data.email);
                    //addToPool(data.poolid,sk.id);
                }
               
            }else{
                    log.push("Contact found in Beamery, processing "+data.email);
                    if(beamery.location.city == obj.location.city){
                    //submitted city is the same as Beamery city
                    //We'll now check length because if Beamery city is longer, it may have full
                    //address and we don't want to overwrite
                    log.push("City in data extension is the same as Beamery city, testing for length");
                    if(beamery.location.address.length > obj.location.address.length){
                        log.push("Beamery address is longer, DO NOT overwrite it "+beamery.location.city + " | " + obj.location.city);
                        delete obj.location;
                    }
                }
                obj.id = beamery_id;
                var resp = updateContact(obj);
                //addToPool(data.poolid,beamery_id);
                
                retObj.type = 'Update';
                var sk = Platform.Function.ParseJSON(String(resp.content));//ridiculous: https://salesforce.stackexchange.com/questions/359246/save-api-call-response
                if(sk.id == null){
                    log.push(Stringify(sk));
                    log.push("Failed to update contact: "+beamery_id);
                    //Write data to a DE
                    //pending Beamery support ticket response, we might just create a new contact
                    //here, but that's lame
                }
               
               
                if (!data.createNew && data.snooze) {//I probably don't need the createNew here
                    prefSnooze(data.email,data.snooze,sk.id);
                }
                   
               //Write(Stringify(response));
               //Write('{success:"yes",upsert:"'+upsertRecord+'"}');
           
               //Write(sk.content);
           } 

       }

        res.id = sk.id ? sk.id : null;
        
        retObj.id = res.id;
            
       return retObj;
   }catch(e){
       Write('{"Insert Beamery Error Message":"'+e.message+'","Description":"'+e.description+'"}');
   }       

} 

function setupBeameryObject(data){

//should move this outside of function later
//and update this function to use this object instead
var beameryFields = {//production values
    eventsUpdates:"bec87e34-c874-4b09-8942-4e6b016dda76",
    equalityUpdates:"8142d7c9-890f-4e55-a5d5-65c1b3d62a72",
    jobUpdates:"94038183-63c1-45a8-9790-9f3cce59d31a",
    complianceMarketingConsent:"db97ca22-9d97-414a-b8f8-f0cce0a64b5f",
    complianceSourcingConsent:"39bf28cc-a35f-4bb3-b78b-3d4853d4b50b",
    areaOfInterest1:"d4edd195-ae5c-42c5-8825-6ae812add8ab",
    areaOfInterest2:"eabba171-f9d9-4bf5-b5c5-eaae9c110d4b",
    preferredLanguage:"4e07b731-583f-4134-88c5-2c85caca8850",
    countryOfResidence:"3f66b861-2330-4540-b826-1b5fda7b7d35",
    yearsExperience:"133446ee-175b-4563-9522-7e379bbc0cd8",
    recruitingConsentDate:"740cca13-6299-4a15-b4d2-f8d806ab127e",
    marketingConsentDate:"3bc8671b-081e-493e-9a2d-1ddd0a6534fd"
  }
//structure should maybe be
//marketingConsentDate:{id:"3bc8671b-081e-493e-9a2d-1ddd0a6534fd"}

    //declare custom fields as objects with the id of the field
    //we'll set the value later
    var eventUpdates = {id:"bec87e34-c874-4b09-8942-4e6b016dda76",yes:"cfba1754-9d37-491e-9b58-00efe502a054",no:"702a6c98-9b51-4e1f-8e87-de12ec38209c"};
    var equalityUpdates = {id:"8142d7c9-890f-4e55-a5d5-65c1b3d62a72",yes:"fd8ea578-0a07-4fc2-8073-0d56b40799e2",no:"86fdcf7e-8791-46bb-90cf-00de1d575f83"};
    var jobUpdates = {id:"94038183-63c1-45a8-9790-9f3cce59d31a",yes:"b069636a-36c2-4c31-b0cd-536570e9d37b",no:"555578a8-2eec-46fd-a727-90714cc3cab2"};
    var marketingConsent = {id:"db97ca22-9d97-414a-b8f8-f0cce0a64b5f",yes:"a40f445f-2241-42b4-945c-b8725991a96b",no:"09676b3a-fe32-422d-b081-849e4856f339"};
    var recruitingConsent = {id:"39bf28cc-a35f-4bb3-b78b-3d4853d4b50b",yes:"d830df3b-b81d-4159-b848-def1ab9a2172",no:"08a6dd54-e693-430e-9193-22abe79c38c5"};//aka sourcing consent
    var primaryAreaOfInterest = {id:"d4edd195-ae5c-42c5-8825-6ae812add8ab"};
    var secondaryAreaOfInterest = {id:"eabba171-f9d9-4bf5-b5c5-eaae9c110d4b"};
    var language = {id:"4e07b731-583f-4134-88c5-2c85caca8850"};
    var country = {id:"3f66b861-2330-4540-b826-1b5fda7b7d35"};    
    var yearsExperience = {id:"133446ee-175b-4563-9522-7e379bbc0cd8"};
    var recruitingConsentDate = {id:"740cca13-6299-4a15-b4d2-f8d806ab127e"};//aka soucing consent date
    var marketingConsentDate = {id:"3bc8671b-081e-493e-9a2d-1ddd0a6534fd"};    
    
    
    var experience = {};//need to wrap in an array later
    var primaryExperience = {};//need to wrap in an array later
    //write talent community tag
    var globalTags = [
        {
            id:"547935565e3a89cef37204b01493229e",//why is this the same as sandbox? Or is it? Verify it works.
            value:"Shared - Talent Community"
        }
    ];

    //initialize the object to store the data we'll write to Beamery
    var customFields = [];//an array of objects
    
    var obj = new Object();
        //obj.assignedTo = mcIntegrationUser;//MC Integration User
        obj.globalTags = globalTags;
        obj.firstName = data.firstname;
        obj.lastName = data.lastname;
        obj.primaryEmail = data.email;   
    if(data.phone){
        obj.phoneNumbers = [data.phone];//does not overwrite existing, but what if it's blank...
    }
    if(data.Company){
        experience.organisationName = data.Company;
    }
    if(data.Title){
        experience.role = data.Title;
    }
    if(data.Company || data.Title){
        experience.current = true;
        obj.experience = [experience];
        //obj.primaryExperience = experience;//this is not working
    }
    if(data.Linked_In_URL__c){
        obj.links = [data.Linked_In_URL__c];
    }             
    //custom fields
    if(data.country){
        country.value = data.country;
        customFields.push(country);
    }
    if(data.location){
        //write to oob location field
        var addy = {};
            addy.address = data.location;
        obj.location = addy;
        obj.location.city = data.city;
    }
    if(data.university && data.major){
        var ed = {};
            ed.organisationName = data.university;
            ed.program = data.major;
        obj.education = [ed];
    }            
    if(data.language){
        language.value = data.language;
        customFields.push(language);
    }
    if(data.careerPath){
        primaryAreaOfInterest.value = data.careerPath;
        customFields.push(primaryAreaOfInterest);
    }
    if(data.careerPath2){
        secondaryAreaOfInterest.value = data.careerPath2;
        customFields.push(secondaryAreaOfInterest);
    }         

    if(typeof data.yearsExperience !== 'undefined'){
        //coming from MS WTL, values are in numbers, so we need to convert
        var exp = {
            studentnewgrad:"fb081143-8bd3-4e36-bcf3-49fa0dc1038d",
            oneyear:"b3522d8e-b07f-4248-b44e-866ce94d5ae3",
            twotofiveyears:"449381c0-2596-4e47-9387-e33f4d4df2a3",
            sixto10years:"d55591d9-0ca4-4a92-879a-249872c0da33",
            morethan10years:"d0906201-2743-4f31-af7d-170e4bbbc066"
        };
        switch(data.yearsExperience){
            case 0: yearsExperience.value = exp.studentnewgrad;break;
            case "1": yearsExperience.value = exp.oneyear;break;
            case "2": yearsExperience.value = exp.twotofiveyears;break;
            case "3": yearsExperience.value = exp.sixto10years;break;
            case "4": yearsExperience.value = exp.morethan10years;break;
            default:yearsExperience.value = data.yearsExperience;//works if Beamery ID was passed directly as value
        }
        customFields.push(yearsExperience);
    }            

    if(data.recruitmentOptin == "true" || data.recruitmentOptin == true){
            recruitingConsent.value = recruitingConsent.yes;//yes
            customFields.push(recruitingConsent);

            var date= Now();
            var d = new Date(date);
            recruitingConsentDate.value = d;
            customFields.push(recruitingConsentDate);

    }else{
            recruitingConsent.value = recruitingConsent.no;//no
            customFields.push(recruitingConsent);
    }
    if(data.newsletterOptin == "true" || data.newsletterOptin == true){
        marketingConsent.value = marketingConsent.yes;
        customFields.push(marketingConsent);
        var date= Now();
        var d = new Date(date);      
        marketingConsentDate.value = d;
        customFields.push(marketingConsentDate);          
    }else{
        marketingConsent.value = marketingConsent.no;
        customFields.push(marketingConsent);
    }

    if(data.updates.length > 0){
        if(selected("events",data.updates)){
                eventUpdates.value = eventUpdates.yes
                customFields.push(eventUpdates);
        }
        if(selected("equality",data.updates)){
                equalityUpdates.value = equalityUpdates.yes;
                //do we need no?
                customFields.push(equalityUpdates);
        }     
        if(selected("hotjobs",data.updates)){
                jobUpdates.value = jobUpdates.yes;
                customFields.push(jobUpdates);
        }  
    }            

    //make sure we have data or don't set this, it will blank existing values out!!!
    if(customFields.length > 0){
        obj.customFields = customFields;
    }        
    return obj;    
}      
function createContact(obj){
    try{
        //obj.sourcedBy = mcIntegrationUser;//MC Integration User
        var headerValues2 = ["application/json",accessToken];
        var resp = HTTP.Post(baseURL+"contact","application/json",Stringify(obj),headerNames,headerValues2);
        return resp;
    }catch(e){
        var message = "Failed at Create: "+e.message;
        logFailed({ErrorMsg:message,ErrorDescription:e.description},obj.primaryEmail);
        return e;
    }    
}  
function updateContact(obj){

    try{
        var req = new Script.Util.HttpRequest(baseURL+"contact/"+obj.id);
        req.emptyContentHandling = 0;
        req.retries = 2;
        req.continueOnError = true;
        req.contentType = "application/json"
        req.setHeader("Authorization", accessToken);
        req.method = "PATCH"; /*** You can change the method here ***/
        req.postData = Stringify(obj);
        var resp = req.send();

        var respObj = Platform.Function.ParseJSON(String(resp.content));//ridiculous: https://salesforce.stackexchange.com/questions/359246/save-api-call-response
        Write("response code: "+respObj.code);
        if(respObj.code == 400){//json error
            var message = "JSON Parse Error: "+respObj.message;
            logFailed({ErrorMsg:message},obj.primaryEmail);
        }else{
            return resp;//Write(resp.content);
        }
        
    }catch(e){
        var message = "Failed at Update Contact: "+e.message;
        logFailed({ErrorMsg:message,ErrorDescription:e.description},obj.primaryEmail);
        return e;
    } 
}

function addToPool(poolid,contactid){

    if(poolid){
        try{
            var poolobj = {};
            poolobj.id = poolid;
            var req = new Script.Util.HttpRequest(baseURL+"pool/"+poolid+"/contacts");
            req.emptyContentHandling = 0;
            req.retries = 2;
            req.continueOnError = true;
            req.contentType = "application/json"
            req.setHeader("Authorization", accessToken);
            req.method = "PUT"; /*** You can change the method here ***/
            req.postData = Stringify(poolobj);
            var resp = req.send();
        
            var respObj = Platform.Function.ParseJSON(String(resp.content));//ridiculous: https://salesforce.stackexchange.com/questions/359246/save-api-call-response
            Write("response code: "+respObj.code);
            if(respObj.code == 400){//json error
                var message = "JSON Parse Error: "+respObj.message;
                logFailed({ErrorMsg:message},obj.primaryEmail);
            }else{
                return resp;//Write(resp.content);
            }
            
        }catch(e){
            var message = "Failed at Update Contact: "+e.message;
            logFailed({ErrorMsg:message,ErrorDescription:e.description},obj.primaryEmail);
            return e;
        } 
    }
}

function getCredentials(){

    try{
    var amp = '\%\%[ ';
        amp += 'var @creds '
        amp += 'set @creds = \'GLkjK9vUqvIrKbSJ2qRuHWnYGeGFIs3bmyJPqLoDaEhSW6BLY7b49kr1Ytlq51nA9z1NlPwSkKQa717Q5qouSQHsAyOiRA2UXddIL7JWXhQPFWZxDZ4716hQY8wx7ID1iQ1rv5sTeiqGXUCReRyfeh0JTFdKJgfIbHzxpsAQzv/ksMTubEn6EcY8DRLFxaOa\' '
        amp += 'set @creds = DecryptSymmetric(@creds,"AES","BEAM_PWD",@null,"BEAM_SALT",@null,"BEAM_IV",@null) '
        amp += 'output(v(@creds)) ';
        amp += ']\%\%';
        return Platform.Function.TreatAsContent(amp);
      } catch (e2) {
          //Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
          return Stringify(e2);
      }      
}
</script>
