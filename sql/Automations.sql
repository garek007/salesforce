




SELECT 
    automationcustomerkey
,   AutomationName
,   AutomationType
,   AutomationStepCount
,   AutomationInstanceScheduledTime_UTC
,   AutomationInstanceStartTime_UTC
,   AutomationInstanceEndTime_UTC
FROM [_automationinstance]


SELECT 
    AutomationName
,   AutomationCustomerKey
,   CASE 
        WHEN ActivityType = 43 THEN 'Data Copy or Import'
        WHEN ActivityType = 33 THEN 'SMS Activity'
        WHEN ActivityType = 42 THEN 'Send Email'
        WHEN ActivityType = 45 THEN 'Refresh Group'
        WHEN ActivityType = 53 THEN 'File Transfer'
        WHEN ActivityType = 73 THEN 'Data Extract'
        WHEN ActivityType = 84 THEN 'Report Definition'
        WHEN ActivityType = 300 THEN 'SQL Query'
        WHEN ActivityType = 303 THEN 'Filter'
        WHEN ActivityType = 423 THEN 'Script'
        WHEN ActivityType = 425 THEN 'Data Factory Utility Activity'
        WHEN ActivityType = 426 THEN 'Refresh Segment Template'
        WHEN ActivityType = 427 THEN 'Publish Audience'
        WHEN ActivityType = 467 THEN 'Wait'
        WHEN ActivityType = 615 THEN 'Verify Audience Count'
        WHEN ActivityType = 724 THEN 'Refresh Mobile Filtered List'
        WHEN ActivityType = 725 THEN 'Send SMS'
        WHEN ActivityType = 733 THEN 'Import Mobile Contacts'
        WHEN ActivityType = 736 THEN 'Send Push'
        WHEN ActivityType = 749 THEN 'Fire Event'
        WHEN ActivityType = 771 THEN 'Salesforce Email Send'
        WHEN ActivityType = 772 THEN 'Mobile Connect Send Salesforce Sync Subscriber'
        WHEN ActivityType = 783 THEN 'Send GroupConnect'
        WHEN ActivityType = 952 THEN 'Journey Builder Event Activity'
        WHEN ActivityType = 1000 THEN 'Verification'
        WHEN ActivityType = 1010 THEN 'Interaction Studio Data'
        WHEN ActivityType = 1101 THEN 'Interactions'
        WHEN ActivityType = 1701 THEN 'Batch Personalization'
        WHEN ActivityType = 3700 THEN 'Contact to Business Unit Mapping'
        ELSE ActivityType 
        END as ActivityType
        
,   ActivityName
,   ActivityDescription
,   ActivityCustomerKey
,   ActivityInstanceStep
,   ActivityInstanceID
,   ActivityInstanceStartTime_UTC
,   ActivityInstanceEndTime_UTC
,   ActivityInstanceStatus
,   ActivityInstanceStatusDetails
FROM [_automationactivityinstance]