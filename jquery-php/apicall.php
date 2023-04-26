<?php
session_start();
header("Access-Control-Allow-Origin: *");
require('../vendor/autoload.php');
use GuzzleHttp\Client;

include '../creds.php';

$headers = [
    'Content-Type' => "application/x-www-form-urlencoded",        
    'Accept'        => "*/*",
];
  
try{
  $api = new Client([
    'verify' => false
  ]);
  
  $result = $api->request('POST', 'https://login.salesforce.com/services/oauth2/token' , ['headers'=> $headers,'form_params' => $body]);

  $tokenInfo = json_decode($result->getBody()->getContents(), true);

}catch(Exception $e){
  echo "Error: ".$e->getResponse()->getBody()->getContents();
}


$url = 'https://na123.salesforce.com/services/data/v53.0/query?q=SELECT+Id,Name+FROM+Account+LIMIT+10000';
$method = 'GET';

$headers = [
    'Content-Type' => 'application/json; charset=UTF-8',
    'Accept' => "application/json",        
    'Authorization' => "OAuth ".$tokenInfo['access_token']
  ];      



  try{
  $result = $api->request($method, $url , ['headers'=> $headers,'json' => $body]);

    $data = json_decode($result->getBody()->getContents());
    echo json_encode($data);
  }catch(Exception $e){
    //echo "Unknown error.";
    //var_dump($e->getResponse()->getBody()->getContents());

    echo json_encode($e->getResponse()->getBody()->getContents());
  } 







?>

