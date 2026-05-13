function isSuccessStatus(statusCode) {
    return statusCode >= 200 && statusCode < 300;
}

function isClientError(statusCode) {
    return statusCode >= 400 && statusCode < 500;
}

function isServerError(statusCode) {
    return statusCode >= 500 && statusCode < 600;
}

module.exports = {
    isSuccessStatus,
    isClientError,
    isServerError,
};