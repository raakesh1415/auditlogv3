import { executeHttpRequest, HttpResponse, HttpRequestConfig } from "@sap-cloud-sdk/http-client";
import {
    Service,
    ServiceBindingTransformFunction,
    Destination,
    getClientCredentialsToken,
    decodeJwt
} from "@sap-cloud-sdk/connectivity";

export async function executeHttpRequest_customDestination<T extends HttpRequestConfig>(
    destinationName: string,
    requestConfig: T
): Promise<HttpResponse> {
    try {
        const resp = await executeHttpRequest({
            destinationName: destinationName,
            serviceBindingTransformFn: _serviceBindingTransformFn
        },
            requestConfig
        )
        return resp;
    }
    catch (error) {
        throw error;
    }
}

/**
 * Generate token using Cloud SDK methods
 * Return destination object according to SDK standards as well
 * Note:In the example of job scheduler, credentials is stored differently and is unable to use SDK method directly
 * Massaging has to be done before calling getClientCredentialsToken method
 */
const _serviceBindingTransformFn: ServiceBindingTransformFunction = async (
    service: Service
): Promise<Destination> => {
    var serviceUrl = service.credentials.url;
    //Temp service used to generate token
    const tempService: Service = service;
    tempService.credentials = tempService.credentials.uaa

    const token = (await getClientCredentialsToken(tempService))
    return _buildClientCredentialsDestination(
        token.access_token,
        serviceUrl,
        service.name
    );
};

function _buildClientCredentialsDestination(
    token: string,
    url: string,
    name: string
): Destination {
    const expiresIn = Math.floor(
        (decodeJwt(token).exp! * 1000 - Date.now()) / 1000
    ).toString(10);
    return {
        url,
        name,
        authentication: 'OAuth2ClientCredentials',
        authTokens: [
            {
                value: token,
                type: 'bearer',
                expiresIn,
                http_header: { key: 'Authorization', value: `Bearer ${token}` },
                error: null
            }
        ]
    };
}