SELECT 
    j.journeyname
,   ja.activityname  AS EmailName
,   CONVERT(DATE, s.eventdate ) AS datesent
,   COUNT(s.subscriberid) as entries
,   JobID

FROM   [_sent] AS s
   INNER JOIN [_journeyactivity] AS ja
           ON s.triggerersenddefinitionobjectid = ja.journeyactivityobjectid
   INNER JOIN [_journey] AS j
           ON ja.versionid = j.versionid

WHERE  s.eventdate > Dateadd(day, -90, Getdate())   
GROUP BY j.journeyname, j.versionnumber,ja.activityname,CONVERT(DATE, s.eventdate ),s.jobid
