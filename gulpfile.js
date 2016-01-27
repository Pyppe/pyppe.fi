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
    'fancybox/jquery.fancybox'
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
    pipe(gulp.dest(distJs));
});

gulp.task('jsIncludes', ['pipeline'], () => {
  function hashedScript(filename) {
    const file = path.join.apply(this, [__dirname, "dist", "js"].concat([filename]));
    const hash = md5File(file);
    return `<script type="text/javascript" src="/dist/js/${filename}?h=${hash}"></script>`;
  }

  const content = [
    '<!-- Start auto-generated scripts -->',
    hashedScript('vendor.js'),
    hashedScript('main.js'),
    '<!-- End auto-generated scripts -->'
  ].join('\n');

  fs.writeFileSync('./_includes/javascripts.html', content);
});

gulp.task('cssIncludes', ['pipeline'], () => {
  function hashedStylesheet(filename) {
    const file = path.join.apply(this, [__dirname, "dist", "css"].concat([filename]));
    const hash = md5File(file);
    return `<link rel="stylesheet" href="/dist/css/${filename}?h=${hash}" />`
  }
  const content = [
    '<!-- Start auto-generated styles -->',
    hashedStylesheet('vendor.css'),
    hashedStylesheet('fancybox/jquery.fancybox.css'),
    hashedStylesheet('main.css'),
    hashedStylesheet('syntax.css'),
    '<!-- End auto-generated styles -->'
  ].join('\n');

  fs.writeFileSync('./_includes/stylesheets.html', content);
});

gulp.task('vendorJs', () => {
  return gulp.src(paths.vendorJs).
    pipe(concat('vendor.js')).
    pipe(gulp.dest(distJs));
});

gulp.task('fileWatch', () => {
  gulp.watch(paths.siteJs, ['siteJs']);
  gulp.watch(paths.siteSass, ['compass']);
});

gulp.task('pipeline', ['siteJs', 'vendorJs', 'vendorCss', 'vendorCssAssets', 'compass']);
gulp.task('default', ['pipeline', 'jsIncludes', 'cssIncludes']);
gulp.task('watch', ['default', 'fileWatch']);
