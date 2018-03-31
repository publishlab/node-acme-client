/*
 * Gruntfile
 */

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jsdoc2md: {
            separateOutputFiles: {
                files: [
                    { src: 'src/client.js', dest: 'docs/client.md' },
                    { src: 'src/openssl.js', dest: 'docs/openssl.md' }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');

    grunt.registerTask('default', [
        'jsdoc2md'
    ]);
};
