var gulp = require('gulp'),
    compass = require('gulp-compass'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    watch = require('gulp-watch'),
    sass = require('gulp-sass'),
    jshint = require('gulp-jshint');

gulp.task('compass', function() {
    gulp.src('./sass/*.scss')
        .pipe(compass({
            config_file: './config.rb',
            css: 'css',
            sass: 'sass'
        }))
        .pipe(gulp.dest('css'));
});

gulp.task('watch', function () {
    gulp.watch('sass/*.scss', ['compass']);
    gulp.watch('js/*.js');
    gulp.watch('popup.html');
});

gulp.task('jshint', function() {
    gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('default', ['jshint', 'compass', 'watch']);
