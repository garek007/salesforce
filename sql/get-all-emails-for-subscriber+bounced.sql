SELECT TOP 500
    s.SubscriberKey
,   EmailName
,   s.EventDate
,   CASE 
        WHEN b.SubscriberKey IS NOT NULL THEN 1 
        ELSE 0 
    END AS Bounced
FROM _Sent s
JOIN _Job j 
    ON s.JobID = j.JobID
LEFT JOIN _Bounce b
    ON s.SubscriberKey = b.SubscriberKey AND s.BatchID = b.BatchID
WHERE s.SubscriberKey = '0033t00003PSeKyAAL'
ORDER BY EventDate DESC
