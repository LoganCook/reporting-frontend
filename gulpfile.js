var gulp = require("gulp");
var eslint = require('gulp-eslint');
var connect = require('gulp-connect');

gulp.task('lint', function() {
  return gulp.src("js/**/*.js")
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('run', function() {
  connect.server();
});

gulp.task("default", ["run"]);
