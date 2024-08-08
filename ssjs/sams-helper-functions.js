Created by Sam Parsons, last modified by Sam Whitmore on Nov 15, 2022
SSJS Best Practices
Avoid loading the Platform functions.  They are unnecessary and bloated.
i.e. don't do this:
Platform.Load("Core","1");
Helper Functions
Write()
function Write(str) {
   Platform.Response.Write(str);
}
Stringify()
function Stringify(obj) {
   return Platform.Function.Stringify(obj);
}
getParam()
function getParam(param) {
   return Platform.Request.GetQueryStringParameter(param) ||
      Platform.Request.GetFormField(param) ||
      ''
}//getParam()
Server Side JavaScript in Marketing Cloud
SSJS is based on ECMAscript 3.0.  Modern JS is ECMA6 or higher.  Since it's such an old standard, you don't have a lot of the useful features of modern javascript like arrow (=>) functions, spread operators, or the magic of array prototypes!

Manually Implement Prototypes
Since many prototypes typically available to modern javascript are missing in SSJS, you have to implement them yourself.  Here are some of the basics as well as some other custom prototypes that have been useful in the past.  Mileage may vary.

indexOf
Documentation

Array.prototype.indexOf = function(val) {
   for (var i = 0; i < this.length; i++) {
      if (val === this[i])
         return i;
   }
   return -1;
};
each
This seems to be some kind of bastardization of foreach, though, I think this version actually modifies the array that calls .each(). each() requires a function.

Array.prototype.each = function(cb) {
   for (var i = 0; i < this.length; i++) {
      cb(this[i]);
   }
};
map
Documentation

Array.prototype.map = function(cb) {
   var a = [];
   for (var i = 0; i < this.length; i++) {
      a.push(cb(this[i]));
   }
   return a;
};
filter
Documentation

Array.prototype.filter = function(cb) {
   var a = [];
   for (var i = 0; i < this.length; i++) {
      if (cb(this[i], i)) a.push(this[i]);
   }
   return a;
};
reduce
Documentation

Array.prototype.reduce = function(cb, init) {
   var val = init;
   for (var i = 0; i < this.length; i++) {
      val = cb(val, this[i], i, this);
   }
   return val;
};
uniq
Custom array prototype that returns an array of unique values from an array.  Requires the indexOf prototype.

Array.prototype.uniq = function() {
   var ret = [];
   for (var i = 0; i < this.length; i++) {
      if (ret.indexOf(this[i]) === -1) {
         ret.push(this[i]);
      }
   }
   return ret;
};
contains
Custom array prototype loosely based on includes without the ability to specify the starting index.  Returns boolean value based on whether or not the given value exists in the array.

Array.prototype.contains = String.prototype.contains = function(val) {
   return this.indexOf(val) > -1;
};
trim
Custom string prototype to strip spaces, the hidden BOM character (), and the nonbreaking space character (\xA0) from every element of the 

String.prototype.trim = function () {
   return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
};





//eliot's 


function CheckCampaignMember(id) {
   var amp = '%' + '%[set @rows = RetrieveSalesforceObjects('; 
   amp += '\'CampaignMember\',';
   amp += '\'Id\',';
   amp += '\'CampaignId\',';
   amp += '\'=\',';
   amp += '\'' + cid + '\',';
   amp += '\'LeadOrContactId\',';
   amp += '\'=\',';
   amp += '\'' + id + '\')';
   amp += 'set @cmId = iif(RowCount(@rows)==0, null, Field(Row(@rows, 1), \'Id\'))';
   amp += 'Output(Concat(@cmId))';
   amp += ']%' + '%';
   
   var val = Platform.Function.TreatAsContent(amp);
   return val; // returns campaign member id, or null if no record found
 }
 
 function CreateSalesforceObject(obj, arr) {
   var amp = '%' + '%=CreateSalesforceObject('; 
   amp += '\'' + obj + '\',';
   amp += '\'' + arr.length + '\',';
 
   for (var i = 0; i < arr.length; i++) {
     amp += '\'' + arr[i].name + '\',';
     amp += '\'' + arr[i].value + '\'';
     if (i !== arr.length-1) {
       amp += ',';
     }
   }
   amp += ')' + '=%' + '%';
   var val = Platform.Function.TreatAsContent(amp);
   return val;
 }
 
 function UpdateSingleSalesforceObject(obj, id, arr) {
   var amp = '%' + '%=UpdateSingleSalesforceObject('; 
   amp += '\'' + obj + '\',';
   amp += '\'' + id + '\',';
 
   for (var i = 0; i < arr.length; i++) {
     amp += '\'' + arr[i].name + '\',';
     amp += '\'' + arr[i].value + '\'';
     if (i !== arr.length-1) {
       amp += ',';
     }
   }
   amp += ')' + '=%' + '%';
   var val = Platform.Function.TreatAsContent(amp);
   return val;
 }
 
 function currentIsoDateTime() {
   var amp = '%' + '%=FormatDate(Now(),\'iso\''; 
   amp += ')' + '=%' + '%';
   
   var val = Platform.Function.TreatAsContent(amp);
   return val;
 }
 
 // polyfill
 function includes(val,arr) {
   var res = false;
   for(var i=0; i < arr.length; i++) {
     if (!res) {
       res = (val == arr[i]) ? true : false;
     }
   }
   return res;
 }