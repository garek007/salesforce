This is button code from Litmus' bulletproof buttons tutorial. Set it up with AmpScript to make it easier to use. Here's an example.
```
%%[ 
Set @width = '200px' 
Set @fontSize = '16px'
Set @lineHeight = '20px'
Set @msoLineHeight = '32px'
Set @label = 'Reactivate Access' 
Set @link = CloudPagesURL(1234,'emailAddr',emailaddr,'_subscriberkey',_subscriberkey,'subscriberid',subscriberid,'jobid',jobid,'MemberID',MemberID,'listid',listid,'_JobSubscriberBatchID',_JobSubscriberBatchID,'joburlid',joburlid,'FirstName',FirstName,'language',Language) 
Output(ContentBlockById(@blueCTA))
]%%
```