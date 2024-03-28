
<script runat="server">
Platform.Load("Core","1.1.1");
HTTPHeader.SetValue("Access-Control-Allow-Methods","POST");
HTTPHeader.SetValue("Access-Control-Allow-Origin","*");

var debug = false;
var leadFields = Request.GetFormField('leadFields');
var cmFields = Request.GetFormField('cmFields');
//Write("lead field string "+leadFields);
var emailAddr = Request.GetFormField('email');
var linkedinurl = Request.GetFormField('linkedinurl');
var cid = Request.GetFormField('cid');
var delimiter = Request.GetFormField('delimiter');
var response = new Object();
//var subscriberKey = checkForMatch('Email',emailAddr);
//var subscriberKey = checkForMatchLocally('ENT.Lead_Salesforce','Email',emailAddr);//dumb dumb du du dumb





var subObj = findOrCreateSubscriber(emailAddr,linkedinurl,leadFields);

var object = (subObj.Id.indexOf('00Q')!== -1) ? 'Lead':'Contact';

var subscriberKey = subObj.Id;

try{
//if subscriber key STILL not found, it must not exist, so create it
if(subObj.type != 'New Lead'){
  var update = UpdateSingleSalesforceObject(object,leadFields,subscriberKey);
  if(update == 1){
    response.type = 'Update';
    response.message = object+" found and updated. ";
  }else{
    response.message = update.description;
    response.type = subObj.type;
    //response.leadid = subscriberKey;
    //respond(response);
    //return;
  }

}else{
  response.message = "Lead created. ";
}
response.leadid = subscriberKey;
response.leadFields = leadFields+delimiter+cmFields;

//cmFields+= ',LeadId,'+subscriberKey;
//before we try to create, try to retrieve using subscriberKey
//var cm = RetrieveSalesforceObjects('CampaignMember','Id','LeadOrContactId,=,'+subscriberKey);
//var deObj = DataExtension.Init('ENT.CampaignMember_Salesforce');
var idField = (subscriberKey.indexOf('00Q')!== -1) ? 'LeadId':'ContactId';
//var cRows = deObj.Rows.Lookup([idField,"CampaignId"], [subscriberKey,cid]);


var cRows = deLookup('ENT.CampaignMember_Salesforce',[idField,"CampaignId"],[subscriberKey,cid])

if(cRows.length > 0){
  var cmid = cRows[0].Id;
  //Write(cmid);
  response.status = "success";
  response.message += "Lead was already in campaign. Nothing done.";
  response.cmid = cmid;
  respond(response);
}else{
    
    cmFields += delimiter+idField+delimiter+subscriberKey;//add lead or contact id to field string
    var cm = CreateSalesforceObject('CampaignMember',cmFields);

    if(cm.indexOf('00v')!== -1){
      response.status = "success";
      response.message += " Successfully added campaign member.";
      response.cmid = cm;
      respond(response);
    }else{
      response.message += update.description;
      respond(response);
      
    }

}           

} catch (e1) {
    //Write(Stringify(e1));//Write('{"message":"User ID is empty.","type":"error"}');
    return Stringify(e1);
}  
function deLookup(deName,headers,values){
  var deObj = DataExtension.Init(deName);
  var filteredRows = deObj.Rows.Lookup(headers,values);
  return filteredRows;
}

function respond(response){
  Write(Stringify(response));
}
function findOrCreateSubscriber(emailAddr,linkedinurl,leadFields){
  var resp = new Object();
  var subscriberKey = 'none';
  var rows = deLookup('ENT.Lead_Salesforce',["Email","IsConverted"], [emailAddr,"false"]);

  if(rows.length > 0){
    resp.type = 'Existing Lead';
    resp.Id = rows[0].Id;
    return resp;
  }
  //if subscriber key not found on email, try LinkedIn URL
  var rows = deLookup('ENT.Lead_Salesforce',["Linked_In_URL__c","IsConverted"], [linkedinurl,"false"]);
  if(rows.length > 0){
    resp.type = 'Existing Lead';
    resp.Id = rows[0].Id;
    return resp;
  }  
  var rows = deLookup('ENT.Contact_Salesforce',["Email"], [emailAddr]);
  if(rows.length > 0){
    resp.type = 'Existing Contact';
    resp.Id = rows[0].Id;
    return resp;
  }  

  var leadFields = checkforCompanyLeads(leadFields);
  var subscriberKey = CreateSalesforceObject('Lead',leadFields);
    resp.type = 'New Lead';
    resp.Id = subscriberKey;
    return resp;
}
//every object has specific required fields. Data should be prepared before these functions are called.
function CreateSalesforceObject(object,fields){
  var fieldArr = fields.split(delimiter);
  try{
  var numFields = fieldArr.length/2;
  var amp = '\%\%[ ';
      //amp+= "set @c = CreateSalesforceObject('"+object+"','"+numFields+"','"+fieldArr.join("','")+"') ";
      amp+= 'set @c = CreateSalesforceObject("'+object+'","'+numFields+'","'+fieldArr.join('","')+'") ';
      amp+= 'output(v(@c)) ';
      amp+= ']\%\%';
      return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        //Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        return Stringify(e2);
    }      
}
function removeInvalidContactFields(str) {//Contact and Lead have different fields eyeroll
  // Split the string into an array of words
  var words = str.split(delimiter);

  // Iterate over the words array
  for (var i = 0; i < words.length; i++) {
    if (words[i] === 'Company') {
      // Remove the "Company" word and the word right after it
      words.splice(i, 2);
      //break; // Exit the loop after removing the desired words
    }  
  }
  // Join the remaining words back into a string
  return words.join(delimiter);
}
function checkforCompanyLeads(str){
  if(str.indexOf('Company') === -1){
    //Company not found in sring, add it
    str += delimiter+'Company'+delimiter+'Not Provided'
  }
  return str;
}
function fixContactFields(){

}

function UpdateSingleSalesforceObject(object,fields,id){
  if(object == 'Contact'){//remove Company as it isn't on the Contact object
    fields = removeInvalidContactFields(fields);
  }
  var fieldArr = fields.split(delimiter);
 
  for(var i = 0;i < fieldArr.length;i++){
    if(fieldArr[i] ==  'Country'){
      fieldArr[i] = (object == 'Lead') ? 'Mailing_Country_Global__c' : 'Mailing_Country__c';
    }
    if(fieldArr[i] ==  'Linked_In_URL__c'){
      fieldArr[i] = (object == 'Lead') ? 'Linked_In_URL__c' : 'LinkedIn_Profile_URL__c';
    }
    if(fieldArr[i] ==  'Mailing_City__c'){
      fieldArr[i] = (object == 'Lead') ? 'Mailing_City__c' : 'MailingCity';
    }

    

  }
  try{
  var amp = '\%\%[ ';
      amp+= 'set @c = UpdateSingleSalesforceObject("'+object+'","'+id+'","'+fieldArr.join('","')+'") ';
      amp+= 'output(v(@c)) ';
      amp+= ']\%\%';
      return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        return e2;
    }        
}
  /*
function RetrieveSalesforceObjects(object,retrieveFields,fields){//this is going to take some work before it's usable for more than just the id field...
  var filters = fields.split(delimiter);
  try{
  var amp = "\%\%[ ";
      amp+= "set @c = RetrieveSalesforceObjects('"+object+"','"+retrieveFields+"','"+filters.join("','")+"') ";
      amp += "If RowCount(@c) > 0 Then "
      amp += "Set @response = Field(Row(@c,1),'Id') "
      amp += "else "
      amp += "Set @response = 'none' "
      amp += "endif "
      amp+= "output(v(@response)) ";
      amp+= "]\%\%";
      return Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
    }        

}
//function checkForMatch(email,object,converted){

function checkForMatchLocally(de,field,fieldValue){//need to update this to take any field to match on
    var object = 'Lead';
    var converted = 'false';
    var retrieveFields = "Id";

    var amp = "\%\%[ ";
    amp += "set @RetrieveResults = LookupRows('"+de+"','"+field+"','"+fieldValue+"'";    
    amp += ")";
    amp += "If RowCount(@RetrieveResults) > 0 Then "
    amp += "Set @response = Field(Row(@RetrieveResults,1),'Id') "
    amp += "else "
    amp += "Set @response = 'none' "
    amp += "endif "
    amp += "output(v(@response)) ";
    amp += "]\%\%"; 

    try {
      results = Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        if (debug) {
            Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        }
    }
    return results;   
}

function findCampaignMember(de,field,fieldValue){//need to update this to take any field to match on
    var object = 'Lead';
    var converted = 'false';
    var retrieveFields = "Id";

    var amp = "\%\%[ ";
    amp += "set @RetrieveResults = LookupRows('"+de+"','"+field+"','"+fieldValue+"'";    
    amp += ")";
    amp += "If RowCount(@RetrieveResults) > 0 Then "
    amp += "Set @response = Field(Row(@RetrieveResults,1),'Id') "
    amp += "else "
    amp += "Set @response = 'none' "
    amp += "endif "
    amp += "output(v(@response)) ";
    amp += "]\%\%"; 

    try {
      results = Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        if (debug) {
            Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        }
    }
    return results;   
}

function checkForMatch(field,fieldValue){//need to update this to take any field to match on
    var object = 'Lead';
    var converted = 'false';
    var retrieveFields = "Id";
    var amp = "\%\%[ ";
    amp += "set @SFRetrieveResults = RetrieveSalesforceObjects('"+object+"',";
    if(object == 'Lead'){
      amp += "'" + retrieveFields + "','"+field+"','=','"+fieldValue+"','IsConverted','=','"+converted+"'";  
    }else{
      amp += "'" + retrieveFields + "','"+field+"','=','"+fieldValue+"'";
    }
    
    amp += ")";
    amp += "If RowCount(@SFRetrieveResults) > 0 Then "
    amp += "Set @response = Field(Row(@SFRetrieveResults,1),'Id') "
    amp += "else "
    amp += "Set @response = 'none' "
    amp += "endif "
    amp += "output(v(@response)) ";
    amp += "]\%\%"; 

    try {
      results = Platform.Function.TreatAsContent(amp);
    } catch (e2) {
        if (debug) {
            Write(Stringify(e2));//Write('{"message":"User ID is empty.","type":"error"}');
        }
    }

    return results;        
}//end checkForMatch function
*/  
</script>
