
SELECT
    ActivityName,
    avgduration,
    totalruns
FROM
    (
        SELECT
            ActivityName,
            Avg(
                Datediff(
                    MINUTE,
                    activityinstancestarttime_utc,
                    activityinstanceendtime_utc
                )
            ) AS AvgDuration
            , COUNT(ActivityName) as totalruns
            
        FROM
            [_automationactivityinstance] activity
        WHERE
            activity.activitytype = 300
        GROUP BY
            ActivityName
    ) durations
WHERE avgduration > 20



