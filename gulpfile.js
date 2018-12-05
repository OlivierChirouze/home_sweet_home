const gulp = require('gulp');
const ts = require('gulp-typescript');

gulp.task('default', () =>
    gulp.src(['model.ts', 'leboncoin/greasemonkey-leboncoin.ts'])
        .pipe(ts({
            // noImplicitAny: true,
            outFile: 'output.js'
        }))
        .pipe(gulp.dest('build')));