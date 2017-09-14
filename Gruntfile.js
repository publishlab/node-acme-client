/*
 * Gruntfile
 */

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        eslint: {
            src: [
                '**/*.js',
                '!node_modules/**'
            ]
        },

        mochaTest: {
            options: {
                timeout: 30000,
                bail: true
            },
            src: ['test/*.js', 'test/**/*.js']
        },

        jsdoc2md: {
            separateOutputFiles: {
                files: [
                    { src: 'lib/client.js', dest: 'docs/client.md' },
                    { src: 'lib/openssl.js', dest: 'docs/openssl.md' }
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-jsdoc-to-markdown');
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.registerTask('default', [
        'eslint',
        'mochaTest',
        'jsdoc2md'
    ]);

    grunt.registerTask('lint', [
        'eslint'
    ]);

    grunt.registerTask('test', [
        'mochaTest'
    ]);

    grunt.registerTask('doc', [
        'jsdoc2md'
    ]);
};
