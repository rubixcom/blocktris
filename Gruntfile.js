module.exports = function(grunt) {

    // configure the tasks
    grunt.initConfig({

        copy: {
            build: {
                cwd: 'source',
                src: [ 'index.html', '**/*.js', '**/*.png', '**/*.jpg', '**/*.ogg', '**/*.txt'    ],
                dest: 'build',
                expand: true
            },
        },

        cssmin: {
            build: {
                files: {
                    'build/application.css': [ 'build/**/*.css' ]
                }
            }
        },

        clean: {
            build: {
                src: [ 'build' ]
            },
        },

        uglify: {
            build: {
                options: {
                    mangle: true,
                    compress: false,
                    banner: "/* (C) Copyright 2015 - RubiXcom (Alfred Glickman) all rights reserved. */"
                },
                files: {
                    'build/js/game.min.js': [ 'build/**/game.js'  ],
                    'build/js/ai.min.js': [ 'build/**/ai.js'  ]
                }
            }
        },
        htmlmin: {                                     // Task
            indexfile: {                                       // Another target
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true
                },
                files: {
                    'build/index.html': 'build/index.html'
                }
            }
        },

        replace: {
            game: {
                src: ['build/js/game.js'],             // source files array (supports minimatch)
                dest: 'build/js/game.js',             // destination directory or file
                replacements: [{
                    from: 'ai.js',                   // string replacement
                    to: 'ai.min.js'
                }]
            },
            index: {
                src: ['build/index.html'],             // source files array (supports minimatch)
                dest: 'build/index.html',             // destination directory or file
                replacements: [{
                    from: 'game.js',                   // string replacement
                    to: 'game.min.js'
                }

                ]
            }
        },
        'ftp-deploy': {
            build: {
                auth: {
                    host: 'users.tpg.com.au',
                    port: 21,
                    authKey: 'rubixcom'
                },
                src: 'build',
                dest: '/',
                exclusions: ['build/game.js', 'build/ai.js'],
                forceVerbose: true
            }
        }
    });

    // load the tasks
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-ftp-deploy');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');

    grunt.registerTask(
        'stylesheets',
        'Compiles the stylesheets.',
        [ 'stylus', 'autoprefixer', 'cssmin' ]
    );
    grunt.registerTask(
        'scripts',
        'Compiles the JavaScript files.',
        [ 'uglify' ]
    );
    grunt.registerTask(
        'build',
        'Compiles all of the assets and copies the files to the build directory.',
        [ 'clean', 'copy', 'replace', 'uglify', 'htmlmin' ]
    );
    grunt.registerTask(
        'default',
        'Watches the project for changes, automatically builds them and runs a server.',
        [ 'build', 'ftp-deploy', 'clean' ]
    );
    // define the tasks
};