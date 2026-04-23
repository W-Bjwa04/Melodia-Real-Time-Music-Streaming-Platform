class ApiResponse {
  static success(res, message = "Success", data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  static created(res, message = "Created successfully", data = null) {
    return ApiResponse.success(res, message, data, 201);
  }

  static error(res, message = "Something went wrong", statusCode = 500, errors = []) {
    return res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    });
  }
}

export default ApiResponse;
