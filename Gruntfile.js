'use strict';

/* globals module */

module.exports = function(grunt) {
  // configure project
  grunt.initConfig({
    // make node configurations available
    pkg: grunt.file.readJSON('package.json'),
    eslint: {
      options: {
        configFile: '.eslintrc'
      },
      target: ['src/**/*.js', 'main.js']
    },
    githooks: {
      all: {
        'pre-commit': 'eslint'
      }
    }
  });
  // enable plugins
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-githooks');

  // set default tasks to run when grunt is called without parameters
  grunt.registerTask('default', ['eslint']);
};
