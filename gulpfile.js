var fs = require("fs");
var gulp = require("gulp");
var jshint = require("gulp-jshint");
var stylish = require("jshint-stylish");
var del = require("del");
var connect = require('gulp-connect');

gulp.task("clean", function() {
    return del(["build"]);
});

gulp.task("jshint", function() {
    return gulp.src(["js/**/*.js"])
        .pipe(jshint())
        .pipe(jshint.reporter(stylish));
});

gulp.task("prep", ["clean", "jshint"]);

gulp.task("static", ["prep"], function() {
    return gulp.src(["css/**/*.css", "fonts/*", "images/**/*.???", "index.html", "template/**/*.html"], {
            base: "."
        })
        .pipe(gulp.dest("build"));
});

gulp.task('connect', function() {
  connect.server();
});

gulp.task("default", ["connect"]);
