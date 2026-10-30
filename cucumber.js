
module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: [
      'step-definitions/**/*.js',
      'support/**/*.js'
    ],
    format: ['progress'],
    publishQuiet: true
  }
};
