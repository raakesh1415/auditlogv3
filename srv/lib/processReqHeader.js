module.exports = processReqHeader;

async function processReqHeader(req) {
    console.log(`---Begin of Header Processing---`);
    var isJob = false;
    const date = new Date();
    
    console.log('Request Headers:', req.headers);
    
    // Check if request is from job scheduler
    if ('headers' in req && typeof req.headers === 'object' && 'x-sap-job-id' in req.headers) {
        console.log('Scheduled function triggered at: ', date);
        isJob = true;
        if (req._.req.res) {
            var res = req._.req.res;
            // res.setHeader('Content-Type', 'text/plain;charset=utf-8');
            res.setHeader('Content-Type', 'application/json');
            await res.status(202).send('Accepted async job, but long-running operation still running.');
        }
    } else {
        // Else log function execution time
        console.log(`Start function execution at ${date}`);
    }
    console.log(`Function is triggered from job? ${isJob}`);
    console.log(`---End of Header Processing---`);
    return isJob;
}