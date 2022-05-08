class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationMessage';
    this.statusCode = 400;
  }
}

module.exports = ValidationError;
