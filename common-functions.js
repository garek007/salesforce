function compare( a, b ) {
  if ( a.name.toLowerCase() < b.name.toLowerCase() ){
    return -1;
  }
  if ( a.name.toLowerCase() > b.name.toLowerCase() ){
    return 1;
  }
  return 0;
}
//usage
//jsonArray.sort(compare);

function compareDates( a, b ) {
  return new Date(a.dateForSorting) - new Date(b.dateForSorting);
}

function timer(startTime){
    // Update the count down every 1 second
    var x = setInterval(function() {
    var now = new Date().getTime();
    // Find the distance between now and the count down date
    var elapsed = now - startTime;
    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    var hours = Math.floor((elapsed % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((elapsed % (1000 * 60)) / 1000);
    var elapsedTime = hours + "h " + minutes + "m " + seconds + "s ";
    $(".progress-bar").text(elapsedTime);
      // Display the result in the element with id="demo"
      //document.getElementById("demo").innerHTML = days + "d " + hours + "h "+ minutes + "m " + seconds + "s ";
      // If the count down is finished, write some text
      if (window.complete == true) {
        clearInterval(x);
        $(".progress-bar").removeClass("progress-bar-animated progress-bar-striped").text("Upload complete - Time Elapsed: "+elapsedTime);
      }
    }, 1000);
  }  
  // Method that checks that the browser supports the HTML5 File API
  function browserSupportFileUpload() {
      var isCompatible = false;
      if (window.File && window.FileReader && window.FileList && window.Blob) {
      isCompatible = true;
      }
      return isCompatible;
  }
  function prepCSVRow(arr, columnCount, initial,delimeter) {
    var row = ''; // this will hold data
   // data slice separator, in excel it's `;`, in usual CSv it's `,`
    var newLine = '\r\n'; // newline separator for CSV row

    /*
     * Convert [1,2,3,4] into [[1,2], [3,4]] while count is 2
     * @param _arr {Array} - the actual array to split
     * @param _count {Number} - the amount to split
     * return {Array} - splitted array
     */

    function splitArray(_arr, _count) {
      var splitted = [];
      var result = [];
      _arr.forEach(function(item, idx) {
        if ((idx + 1) % _count === 0) {
          splitted.push(item);
          result.push(splitted);
          splitted = [];
        } else {
          splitted.push(item);
        }
      });
      return result;
    }
    var plainArr = splitArray(arr, columnCount);
    
    // don't know how to explain this
    // you just have to like follow the code
    // and you understand, it's pretty simple
    // it converts `['a', 'b', 'c']` to `a,b,c` string
    plainArr.forEach(function(arrItem) {
      arrItem.forEach(function(item, idx) {
        //row += '"'+item + '"' + ((idx + 1) === arrItem.length ? '' : delimeter);
        item = item.replace(/\r?\n|\r/g," ");
        row += item + ((idx + 1) === arrItem.length ? '' : delimeter);
      });
      row += newLine;
    });
    return initial + row;
  }
  function keyValuePairs(wordStr,headerStr){
    var headerArr = headerStr.split(",");    
    var words = wordStr.split(",");
    var lineArr = '';
    for(x=0;x < headerArr.length;x++){
      console.log("header is :" + headerArr[x] );

      if(headerArr[x] == "Email"){
        var value = words[x].replace(/"/g,'');
        value = value.trim();
      }else{
        var value = words[x];
      }

      console.log("value issss "+ value );
      lineArr += headerArr[x] + "," + value;

      if(x != headerArr.length-1){
        lineArr += ",";
      }
    }     
    return lineArr; 
  }
function removeEmptyRows(array){

    var lastRow = array.length-1;
    var cleanedArray = array;

    console.log( "array before cleaning" );
    console.log( cleanedArray );

    while(array[lastRow].indexOf(",") == 0){
      cleanedArray.splice(lastRow,1);
      //console.log( lastRow );
      lastRow--;

    }
    return cleanedArray; 
  }
  function downloadTemplate(){
    var CSVString = "Email,FirstName,LastName";
    // * Make CSV downloadable
    var downloadLink = document.createElement("a");
    var blob = new Blob(["\ufeff", CSVString]);
    var url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = "UploadForm_Template.csv";
    // * Actually download CSV
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);    
  }
  function zeroFill( number, width )
  {
    width -= number.toString().length;
    if ( width > 0 )
    {
      return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
    }
    return number + ""; // always return a string
  }
  function validateFirstRow(row){
    if(row.indexOf("EMAIL_ADDRESS") !== -1 && row.indexOf("NETID") !== -1){
      alert(errorMsg("netidandemail"));
      return false;
    }

    if(row.indexOf("EMAIL_ADDRESS") == -1 && row.indexOf("NETID") == -1){
      alert(errorMsg("nomatchingcolumn"));
      return false;
    }
    if(row.indexOf("EMAIL_ADDRESS") !== -1){
      if(row.indexOf("LAST_NAME") == -1 || row.indexOf("FIRST_NAME") == -1){
        alert(errorMsg("noname"));
        return false;
      }   
    }    

 

    return true;


  }
  function errorMsg(type){

    var msg = {
      netidandemail:"You cannot use both NETID and EMAIL_ADDRESS in the same file.",
      nomatchingcolumn:"It looks like you don't have NETID or EMAIL_ADDRESS in your headers. You need at least one of these to upload a file.",
      noname:"You are missing one or more of the name columns in your file. Please make sure you have both FIRST_NAME and LAST_NAME in your column headers."
    };

    return msg[type];

  }
