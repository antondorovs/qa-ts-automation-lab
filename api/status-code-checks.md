# API Status Code Checks

Basic REST API status code validation examples for QA practice.

## 200 OK

Expected when the request is successful.

Example checks:
- response status is 200
- response body is not empty
- required fields are present
- response time is acceptable

## 201 Created

Expected when a new resource is created.

Example checks:
- response status is 201
- response contains created entity ID
- entity can be found with GET request

## 400 Bad Request

Expected when request data is invalid.

Example checks:
- response status is 400
- error message is clear
- validation field is returned
- invalid request does not create data

## 401 Unauthorized

Expected when authorization token is missing or invalid.

Example checks:
- response status is 401
- protected data is not returned
- error message explains authorization issue

## 403 Forbidden

Expected when user is authenticated but has no permission.

Example checks:
- response status is 403
- restricted action is not performed

## 404 Not Found

Expected when requested resource does not exist.

Example checks:
- response status is 404
- response contains meaningful error message

## QA Notes

Status code validation should always be combined with:
- response body validation
- database validation
- authorization checks
- negative test cases