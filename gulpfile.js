const babel     = require("gulp-babel");
const compass   = require("gulp-compass");
const concat    = require("gulp-concat");
const gulpif    = require('gulp-if');
const gulp      = require("gulp");
const minifyCss = require("gulp-minify-css");
const uglify    = require('gulp-uglify');
const util      = require('gulp-util');

const _         = require('lodash');
const exec      = require('child_process').exec;
const fs        = require('fs');
const glob      = require("glob");
const path      = require('path');
const md5File   = require('md5-file');
const mkdirp    = require('mkdirp');

const distJs = 'dist/js';
const distCss = 'dist/css';
const env = util.env.env || 'development';
const isProduction = env === 'production';
console.log('Using environment: ' + env);

mkdirp.sync(distJs);
mkdirp.sync(`${distCss}/fancybox`);

const paths = (() => {
  const vendorScripts = [
    'jquery',
    'lodash',
    'tether',
    'bootstrap',
    'moment',
    'moment-fi',
    'fancybox/jquery.fancybox',

    // TODO: Separate place for highcharts & d3
    'd3',
    'highcharts/highcharts',
    'highcharts/highcharts-more'
  ].map(function(prefix) {
    prefix = 'src/js/vendor/' + prefix;
    return isProduction ? prefix + '.min.js' : prefix + '.js';
  });
  console.log('Using vendor scripts: ' + vendorScripts.join(' '));

  const vendorCss = [
    'bootstrap'
  ].map(function(name) {
    return 'src/css/vendor/' + name + '.css';
  });

  return {
    siteJs: 'src/js/*',
    customJs: 'src/js/custom/*',
    vendorJs: vendorScripts,
    vendorCss : vendorCss,
    siteSass: 'src/sass/**/*.scss'
  };
})();

gulp.task('clean', () => {
  return glob("./dist/*", {}, (er, items) => {
    items.forEach(file => {
      exec('rm -r ' + file, function (err, stdout, stderr ) {
        if (!err) console.log(`Removed ${file}`)
      });
    })
  });
});

gulp.task('compass', () => {
  return gulp.src(paths.siteSass).
    pipe(compass({
      // config_file: 'public/config.rb'
      environment : 'production',
      style       : isProduction ? 'compact' : 'expanded',
      images_dir  : 'img',
      image       : 'img',
      css         : 'dist/css',
      javascript  : 'src/js',
      sass        : 'src/sass',
      relative    : false
    })).
    pipe(gulp.dest(distCss));
});

gulp.task('vendorCss', () => {
  return gulp.src(paths.vendorCss).
    pipe(minifyCss({compatibility: ''})).
    pipe(concat('vendor.css')).
    pipe(gulp.dest(distCss));
});

gulp.task('vendorCssAssets', () => {
  return gulp.src('./src/css/vendor/fancybox/**/*').
    pipe(gulp.dest(`${distCss}/fancybox`));
});

gulp.task('siteJs', () => {
  return gulp.src(paths.siteJs).
    pipe(babel()).
    pipe(gulpif(isProduction, uglify({
      mangle: true,
      compress: { drop_console: true }
    }))).
    pipe(concat('site.js')).
    pipe(gulp.dest(distJs));
});

gulp.task('customJs', () => {
  return gulp.src(paths.customJs).
    pipe(babel()).
    pipe(gulpif(isProduction, uglify({
      mangle: true,
      compress: { drop_console: true }
    }))).
    pipe(gulp.dest(`${distJs}/custom/`));
});

gulp.task('vendorJs', () => {
  return gulp.src(paths.vendorJs).
    pipe(concat('vendor.js')).
    pipe(gulp.dest(distJs));
});

gulp.task('fileWatch', () => {
  gulp.watch(paths.siteJs, ['siteJs']);
  gulp.watch(paths.customJs, ['customJs']);
  gulp.watch(paths.siteSass, ['compass']);
});

gulp.task('pipeline', ['siteJs', 'customJs', 'vendorJs', 'vendorCss', 'vendorCssAssets', 'compass']);
gulp.task('default', ['pipeline']);
gulp.task('watch', ['default', 'fileWatch']);
