
module.exports = {
  default: {
    require: [
      'step-definitions/**/*.js',
      'support/**/*.js'
    ],
    format: ['progress'],
    publishQuiet: true
  }
};
