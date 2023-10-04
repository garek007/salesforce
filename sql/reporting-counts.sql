/* 
Assumes you've set up your Send Log and an Enhanced Send Log to track EmailName_ 
https://mateuszdabrowski.pl/docs/config/sfmc-enhanced-send-log/
*/
SELECT
    esl.JobId
,   EmailName_ as EmailName
,   (SELECT count(s.JobID) FROM _Sent s WHERE s.JobID = esl.JobID) as Sent
,   (SELECT count(o.JobID) FROM _Open o WHERE o.JobID = esl.JobID) as TotalOpens
,   (SELECT count(o.JobID) FROM _Open o WHERE o.JobID = esl.JobID AND o.IsUnique = 1) as UniqueOpens
,   (SELECT count(c.JobID) FROM _Click c WHERE c.JobID = esl.JobID) as TotalClicks
,   (SELECT count(c.JobID) FROM _Click c WHERE c.JobID = esl.JobID AND c.IsUnique = 1) as UniqueClicks
,   (SELECT count(b.JobID) FROM _Bounce b WHERE b.JobID = esl.JobID) as Bounces
FROM [Enhanced Send Log] esl
GROUP BY JobID,EmailName_
