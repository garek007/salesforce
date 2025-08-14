/*Use the other query first to set up a DE. This references that DE*/
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

WHERE j.journeyname NOT IN (
    SELECT journeyname
    FROM ENT.Journey_Activity_Past_90_Days
)
GROUP BY j.journeyname, j.versionnumber,ja.activityname,CONVERT(DATE, s.eventdate ),s.jobid
