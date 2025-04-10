SELECT 
    CONCAT(Contact__dll.Id__c , "_Primary") as EmailId__c
,   Contact__dll.Id__c  as Id__c
,   Contact__dll.Email__c as Email__c
,   "Primary" as EmailType__c
,   Contact__dll.AccountId__c as AccountId__c
,   Contact__dll.Birthdate__c as Birthdate__c
,   Contact__dll.FirstName__c as FirstName__c
,   Contact__dll.LastName__c as LastName__c
,   Contact__dll.Title__c as Title__c
FROM Contact__dll
WHERE ISNOTNULL(Contact__dll.Email__c) AND Contact__dll.Email__c <> ""
UNION
SELECT 
    CONCAT(Contact__dll.Id__c , "_Secondary") as EmailId__c
,   Contact__dll.Id__c  as Id__c
,   Contact__dll.Secondary_Email_c__c as Email__c
,   "Secondary" as EmailType__c
,   Contact__dll.AccountId__c as AccountId__c
,   Contact__dll.Birthdate__c as Birthdate__c
,   Contact__dll.FirstName__c as FirstName__c
,   Contact__dll.LastName__c as LastName__c
,   Contact__dll.Title__c as Title__c
FROM Contact__dll
WHERE ISNOTNULL(Contact__dll.Secondary_Email_c__c ) AND Contact__dll.Secondary_Email_c__c  <> ""