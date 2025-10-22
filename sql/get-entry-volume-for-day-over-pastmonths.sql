SELECT TOP 500
    j.journeyname
,   ja.activityname  AS EmailName

,   COUNT(s.SubscriberKey) as Entries
,   DATEPART(hour, s.eventdate) as hour_block
,   FORMAT(s.eventdate, 'hh tt') as formattedtime
FROM   [_sent] AS s
   INNER JOIN [_journeyactivity] AS ja
           ON s.triggerersenddefinitionobjectid = ja.journeyactivityobjectid
   INNER JOIN [_journey] AS j
           ON ja.versionid = j.versionid

WHERE  s.eventdate >= CAST('2025-05-20T00:00:00' AS DATETIME)
AND s.eventdate < CAST('2025-10-22T00:00:00' AS DATETIME)
AND j.journeyname = 'Ecomm_Order_Creation_Journey'
AND FORMAT(CONVERT(DATE, s.eventdate ), 'ddd') = 'Sat'
GROUP BY journeyname,ja.activityname,DATEPART(hour, s.eventdate),FORMAT(s.eventdate, 'hh tt')
ORDER BY DATEPART(hour, s.eventdate)

/*
Here's another with dates broken out
SELECT TOP 500
    j.journeyname
,   ja.activityname  AS EmailName
,   CONVERT(DATE, s.eventdate) AS datesent
,   COUNT(s.SubscriberKey) as Entries
,   DATEPART(hour, s.eventdate) as hour_block
,   FORMAT(s.eventdate, 'hh tt') as formattedtime
,   FORMAT(CONVERT(DATE, s.eventdate ), 'ddd') as Day_of_Week
FROM   [_sent] AS s
   INNER JOIN [_journeyactivity] AS ja
           ON s.triggerersenddefinitionobjectid = ja.journeyactivityobjectid
   INNER JOIN [_journey] AS j
           ON ja.versionid = j.versionid

WHERE  s.eventdate >= CAST('2025-07-20T00:00:00' AS DATETIME)
AND s.eventdate < CAST('2025-10-22T00:00:00' AS DATETIME)
AND j.journeyname = 'Ecomm_Order_Creation_Journey'
AND FORMAT(CONVERT(DATE, s.eventdate ), 'ddd') = 'Sat'
GROUP BY journeyname,ja.activityname,DATEPART(hour, s.eventdate),CONVERT(DATE, s.eventdate),FORMAT(s.eventdate, 'hh tt')
ORDER BY DATEPART(hour, s.eventdate)


*/
