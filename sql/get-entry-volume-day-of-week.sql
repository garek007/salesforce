SELECT TOP 500
    j.journeyname
,   ja.activityname  AS EmailName
,   CONVERT(DATE, s.eventdate ) AS datesent
,   COUNT(s.subscriberid) as entries
,   JobID
,   FORMAT(CONVERT(DATE, s.eventdate ), 'ddd') as Day_of_Week
FROM   [_sent] AS s
   INNER JOIN [_journeyactivity] AS ja
           ON s.triggerersenddefinitionobjectid = ja.journeyactivityobjectid
   INNER JOIN [_journey] AS j
           ON ja.versionid = j.versionid

WHERE  s.eventdate >= CAST('2025-09-01T00:00:00' AS DATETIME)
AND s.eventdate < CAST('2025-10-19T00:00:00' AS DATETIME)
AND j.journeyname = 'My_Journey_Name'
GROUP BY j.journeyname, j.versionnumber,ja.activityname,CONVERT(DATE, s.eventdate ),s.jobid
ORDER BY CONVERT(DATE, s.eventdate )
