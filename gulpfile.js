/**
 * Created by sandeepdas on 6/8/2016.
 * Updated by albuquerquej on 7/15/2016.
 */
const gulp = require('gulp');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');

gulp.task('copyDbProp', function() {
  console.log("Environment is : " + process.env.npm_package_config_environment);
  gulp.src('src/config/' + process.env.npm_package_config_environment + '/*')
    .pipe(gulp.dest('dist/config'));
});


gulp.task('copy-oidc', function() {
  console.log("Copy OIDC Files");
  gulp.src('src/openid-connect/**/*')
    .pipe(gulp.dest('dist/src/openid-connect'));
});

gulp.task('copy-swagger', function() {
  console.log("Copy swagger Files");
  gulp.src(['src/swagger/**/*.json','src/swagger/**/*.yaml'])
    .pipe(gulp.dest('dist/src/swagger'));
});

gulp.task('copy-log4js', function() {
  console.log("Copy log4js File");
  gulp.src(['src/config/log4js.json'])
    .pipe(gulp.dest('dist/src/config'));
});

gulp.task('copy-static', function() {
  console.log("Copy Static Files");
  gulp.src(['src/public/**/*'])
    .pipe(gulp.dest('dist/src/public'));
});

gulp.task('copy-js', function() {
  console.log("Copy JS Files");
  gulp.src(['src/*.js'])
    .pipe(gulp.dest('dist/src'));
});

gulp.task('copy-ejs', function() {
  console.log("Copy JS Files");
  gulp.src(['src/*.ejs'])
    .pipe(gulp.dest('dist/src'));
});

gulp.task('copy-img', function() {
  console.log("Copy JS Files");
  gulp.src(['src/*.png'])
    .pipe(gulp.dest('dist/src'));
});


gulp.task('archive', function() {
  console.log("Creating tarball for " + process.env.npm_package_config_environment);
  gulp.src([
      'dist/**/*',
      'node_modules/**/*',
      'package.json'
    ],{
     base:'.'}
    )
    .pipe(tar(process.env.npm_package_name + '.' + process.env.npm_package_version + '.tar'))
    .pipe(gzip())
    .pipe(gulp.dest('.'))
});