<script runat="server">

    Platform.Load("Core","1");
    var token = "[ACCESSTOKEN]";
    var subdomain = 'YOURSUBDOMAIN';
    var span = 1;//29 is the max
    var startDate = new Date("01/01/2021");
        startDate.setHours(0);
        startDate.setMinutes(0);
        startDate.setSeconds(0);

    var startDateSt = getStartDate("01/01/2021");

    var endDate = getEndDate(startDate);

    var params = {
        StartDate:startDateSt,
        EndDate:endDate,
        ExtractBounces:true
    }

    Write(Stringify(params))
    Write(startDate);
    Write("-----------")
    Write(endDate);






    //startDate.setDate(endDate.getDate()+1);
        //startDate.setHours(0);
    
    Write("  new start date ");
    Write(startDate);
    Write(" new end date ")
    Write(getEndDate(startDate));



     
     try {

    var req = new Script.Util.HttpRequest("https://"+subdomain+".soap.marketingcloudapis.com/Service.asmx");

    req.emptyContentHandling = 0;
    req.retries = 2;
    req.continueOnError = false;
    req.contentType = "text/xml";
    //req.setHeader("Authorization", 'Bearer ' + token);
    //req.setHeader("SOAPAction", soapAction);
    //req.setHeader("Content-Type", 'text/xml;charset=UTF-8');
    req.method = "POST";
    req.postData = soapStart;


    //var resp = req.send(); 
    var soapXML = Stringify(resp.content);
 // Write("test");
  Write(soapXML);
  
  


    } catch(error) {
        Write(Stringify(err));
    }




function parameter(name,value){
    return '<Parameter><Name>'+name+'</Name><Value>'+value+'</Value></Parameter>'
}

function getStartDate(d){
    var s = new Date(d);
        s.setHours(0);
        s.setMinutes(0);
        s.setSeconds(0);
    return s.getMonth()+1+'/'+s.getDate()+'/'+s.getFullYear()+' 12:00:00 AM';
}

function getEndDate(d){
    var e = new Date(d);
        e.setDate(e.getDate()+29);
        e.setHours(23);
        e.setMinutes(59);
        e.setSeconds(59);    
    return e.getMonth()+1+'/'+e.getDate()+'/'+e.getFullYear()+' 11:59:59 PM';
}



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

//NEW CODE DOWN HERE AND INSTEAD OF A LOOP, IT GETS DATES FROM THE PREVIOUS MONTH, EVEN IF IT'S A 31 DAY MONTH
============================
    ==============================
    ===========================





    
  
  var today = new Date();
  
  // Step 1: get the previous month
  // Setting day=0 gives us the "last day of the previous month"
  var lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
  
  var prevMonthDays = lastDayPrevMonth.getDate();
  var prevMonth = lastDayPrevMonth.getMonth() + 1; // 1-based month
  var prevYear = lastDayPrevMonth.getFullYear();



  if (prevMonthDays === 30) {
    // Normal call
    Output("Running single call for days 1–30...");
    dataExtract(1, 30, prevYear, prevMonth);
  } else if (prevMonthDays === 31) {
    // Split into two calls
    Output("Splitting into two calls: days 1–30 and day 31...");
    dataExtract(1, 30, prevYear, prevMonth);
    dataExtract(31, 31, prevYear, prevMonth);
  } else if (prevMonthDays === 28 || prevMonthDays === 29) {
    // February case (for completeness)
  
    dataExtract(1, prevMonthDays, prevYear, prevMonth);
  }  

var token = 'whatevs';
  
function dataExtract(startDay, endDay, year, month) {

    var startDateTime = month+'/'+startDay+'/'+year+' 12:00:00 AM';
    var endDateTime = month+'/'+endDay+'/'+year+' 11:59:59 PM';
    var soapAction = 'Retrieve';
    var soapEnv = '<s:Envelope xmlns:s="http://www.w3.org/2003/05/soap-envelope" xmlns:a="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">';
        soapEnv+= '<s:Header><a:Action s:mustUnderstand="1">'+soapAction+'</a:Action><a:To s:mustUnderstand="1">https://'+subdomain+'.soap.marketingcloudapis.com/Service.asmx</a:To>';
        soapEnv+= '<fueloauth>'+token+'</fueloauth></s:Header><s:Body xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">';
        soapEnv+= '<ExtractRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI"><Requests><ID>c7219016-a7f0-4c72-8657-1ec12c28a0db</ID><Parameters>';
        soapEnv+= parameter("OutputFileName",'testdates333.zip');
        soapEnv+= parameter("StartDate",startDateTime);
        soapEnv+= parameter("EndDate",endDateTime);
        soapEnv+= parameter("Format","csv");
        //soapEnv+= parameter("QuoteText","false");
        soapEnv+= parameter("ColumnDelimiter",",");
        //soapEnv+= parameter("UnicodeOutput","false");
        soapEnv+= parameter("NotificationEmail","stan.alachniewicz@labcorp.com");
        //soapEnv+= parameter("Timezone","79");
        //soapEnv+= parameter("UseLocalTZinQuerypublic","false");
        //soapEnv+= parameter("IncludeMilliseconds","false");
        //soapEnv+= parameter("ExtractSubscribers","false");
        //soapEnv+= parameter("IncludeAllSubscribers","false");
        //soapEnv+= parameter("ExtractAttributes","false");
        //soapEnv+= parameter("extractStatusChanges","false");
        //soapEnv+= parameter("IncludeGEO","false");
        //soapEnv+= parameter("IncludeUserAgentInformation","false");
        
        //soapEnv+= parameter("ExtractSent","true");
        //soapEnv+= parameter("ExtractNotSent","true");
        //soapEnv+= parameter("ExtractSendData","true");
        //soapEnv+= parameter("ExtractSendImpressions","true");
        //soapEnv+= parameter("IncludeTestSends","true");
        soapEnv+= parameter("ExtractSendJobs","true");
        //soapEnv+= parameter("ExtractOpens","true");
        //soapEnv+= parameter("IncludeUniqueOpens","true");
        //soapEnv+= parameter("IncludeInferredOpens","true");
        soapEnv+= parameter("ExtractClicks","true");
        //soapEnv+= parameter("ExtractClickImpressions","true");
        //soapEnv+= parameter("IncludeUniqueClicks","true");
        //soapEnv+= parameter("IncludeUniqueForURLClicks","true");
        soapEnv+= parameter("ExtractBounces","true");
        soapEnv+= parameter("ExtractUnsubs","true");
        soapEnv+= parameter("IncludeUnsubReason","true");

        //soapEnv+= parameter("ExtractSpamComplaints","true");
        //soapEnv+= parameter("extractListMembershipChanges","true");
        //soapEnv+= parameter("extractLists","true");
        //soapEnv+= parameter("IncludeAllListMembers","true");
        //soapEnv+= parameter("ExtractMultipleDataExtensionListData","true");
        //soapEnv+= parameter("ExtractConversions","true");
        //soapEnv+= parameter("ExtractSurveyResponses","true");
        //soapEnv+= parameter("IncludeCampaignID","true");
        soapEnv+= parameter("CharacterEncoding","UTF-8");
        soapEnv+='</Requests>';
        soapEnv+='</ExtractRequestMsg>';
        soapEnv+='</s:Body>';
        soapEnv+='</s:Envelope>';

  return soapEnv;


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



  
function Output(str,linebreaks) {
    Platform.Response.Write(str);
    linebreaks = linebreaks || 1;
    for(var line in linebreaks){
        Platform.Response.Write("\r\n");
    }
 }
function Stringify(obj) {
    return Platform.Function.Stringify(obj);
}  






</script>
