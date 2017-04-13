'use strict';
const gulp = require('gulp');
const publishList = [
            './bin/*/**',
            './bin/**',

            './lib/*/**',
            './lib/**',

            './test/*/**',
            './test/**',

            './README.md',
            './package.json',

            '.gitignore',
            '.jshintrc',
            'gulpfile.js'
        ];

const distributionFolder = 'dist';

gulp.task('move', () => {
    return gulp.src(publishList, {base: '.'})
            .pipe(gulp.dest(distributionFolder));
});

gulp.task('default', ['move'], () => {
    console.log('------------------------------------------------------------');
    console.log('------Remeber when you delete files or dir in "dev"---------');
    console.log('------You need to manually delete those in "dist" too-------');
    console.log('------------------------------------------------------------');
});

gulp.task('watch', ['move'], () => {
    console.log('-------------------------------------------------------------------------');
    console.log('------Remeber when you delete files or dir in "dev"----------------------');
    console.log('------You need to manually delete those in "dist" too--------------------');
    console.log('-------------------------------------------------------------------------');
    console.log('------Also add new file during "watch" isn\'t supported by gulp currently-');
    console.log('-------------------------------------------------------------------------');

    return gulp.watch(publishList, ['move']);
});
