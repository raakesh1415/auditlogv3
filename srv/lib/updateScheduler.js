module.exports = updateScheduler;
const { executeHttpRequest_customDestination } = require('./customDestinationFunction');

async function updateScheduler(result, headers) {
    console.log(`---Begin of Scheduler Update---`)
    var jobUpdateMessage = 'Long running operation completed'
    const vcap_services = JSON.parse(process.env.VCAP_SERVICES)
    const instanceName = vcap_services.jobscheduler[0].instance_name
    const jobID = headers['x-sap-job-id']
    const scheduleID = headers['x-sap-job-schedule-id']
    const runID = headers['x-sap-job-run-id']

    const url = `/scheduler/jobs/${jobID}/schedules/${scheduleID}/runs/${runID}`;
    console.log("Updating job at: ", url)

    if (result.length > 0) {
        const resultString = JSON.stringify(result);
        jobUpdateMessage += ` with Result : ${resultString}`
    }

    const jobUpdateData = JSON.stringify({
        "success": true,
        "message": jobUpdateMessage
    })

    const httpconfig = {
        method: "PUT",
        url: url,
        data: jobUpdateData,
        headers: {
            "Content-Type": "application/json"
        }
    }

    try {
        const result = await executeHttpRequest_customDestination(
            instanceName,
            httpconfig,
        )
        console.log(result.data)
        console.log("Scheduler run status updated successfully")
    }
    catch (error) {
        if (error.response) {
            console.log("Encountered error :" + JSON.stringify(error.response.data, null, 2));
        } else if
            (error.message) {
            console.log("Encountered error:" + error.message);
        } else if
            (error.data) {
            console.log("Encountered error:" + error.data);
        } else
            console.log("Encountered error");
    }

}