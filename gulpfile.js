const babel             = require("gulp-babel");
const compass           = require("gulp-compass");
const concat            = require("gulp-concat");
const gulpif            = require('gulp-if');
const gulp              = require("gulp");
const minifyCss         = require("gulp-minify-css");
const uglify            = require('gulp-uglify');
const util              = require('gulp-util');
const stripJsonComments = require('gulp-strip-json-comments');

const _                 = require('lodash');
const exec              = require('child_process').exec;
const execSync          = require('child_process').execSync;
const fs                = require('fs');
const glob              = require("glob");
const path              = require('path');
const md5File           = require('md5-file');
const mkdirp            = require('mkdirp');

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
    'select2.full',

    // TODO: Separate place for highcharts & d3
    'd3',
    'd3.layout.cloud',
    'highcharts/highcharts',
    'highcharts/highcharts-more'
    //'highcharts/themes/gray'
  ].map(function(prefix) {
    prefix = 'src/js/vendor/' + prefix;
    return isProduction ? prefix + '.min.js' : prefix + '.js';
  });
  console.log('Using vendor scripts: ' + vendorScripts.join(' '));

  const vendorCss = [
    'bootstrap',
    'select2'
  ].map(name => `src/css/vendor/${name}.css`);

  const siteJs = [
    //'highcharts.screenshot-theme',
    'highcharts.theme',
    'main',
    'util',
    'twitter-user-graph'
  ].map(file => `src/js/${file}.js`);

  return {
    siteJs,
    resources: 'src/resources/**/*',
    customJs: 'src/js/custom/**/*',
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

gulp.task('processContent', () => {
  const isImage = name => /\.(gif|jpg|png)$/.test(name);
  const containsWhitespace = str => /.*\s.*/.test(str);
  const startTime = Date.now();
  const sizeConversions = [
    ['thumb',   `convert -resize "200x200^" -gravity Center -crop 200x200+0+0 +repage`],
    ['crop',    `convert -resize "300x180^" -gravity Center -crop 300x180+0+0 +repage`],
    ['aside',   `convert -resize "700x500>"`],
    ['listing', `convert -resize "800x600>" -modulate 120,80`],
    ['large',   `convert -resize "1400x1000>"`]
  ];
  return glob("./content/**/*", {nodir: true}, (error, files) => {
    const images = _.filter(files, isImage);
    let resizeCount = 0;
    _.forEach(images, img => {
      const target = img.replace(/\/content\//, '/data/');
      const targetDir = path.parse(target).dir;
      const filename = path.basename(target);
      const ext = path.extname(filename); // e.g. `.jpg`
      const basename = path.basename(filename, ext);
      const resizeTargets = _.map(sizeConversions, ([size, convert]) => {
        const targetFile = `${targetDir}/${basename}.${size}${ext}`;
        return {
          targetFile,
          resizeCommand: `${convert} ${img} ${targetFile}`
        };
      });

      const allTargetsExist = (() => {
        const targetFiles =_.map(resizeTargets, 'targetFile').concat([target]);
        if (_.some(targetFiles, containsWhitespace)) {
          console.error(`Cannot process file: ${img}`);
          process.exit(1);
        }
        return _.every(targetFiles, f => {
            try {
              fs.statSync(f);
              return true;
            } catch (err) {
              return false;
            }
          }
        );
      })();

      if (allTargetsExist && md5File.sync(img) === md5File.sync(target)) {
        // Do nothing
      } else {
        mkdirp.sync(targetDir);
        const commands = [`cp ${img} ${target}`].concat(_.map(resizeTargets, 'resizeCommand'));
        _.forEach(commands, cmd => {
          execSync(cmd, function (err, stdout, stderr) {
            console.log(err);
            console.log(stdout);
            console.log(stderr);
            if (err) {
              process.exit(1);
            }
          });
        });
        util.log(`Resized ${img}`);
        resizeCount += 1;
      }
    });
    util.log(`Resized ${resizeCount} / ${_.size(images)} content images in ${Date.now() - startTime} ms`);
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

gulp.task('vendorCss', () => (
  gulp.src(paths.vendorCss).
    pipe(minifyCss({compatibility: ''})).
    pipe(concat('vendor.css')).
    pipe(gulp.dest(distCss))
));

gulp.task('vendorCssAssets', () => (
  gulp.src('./src/css/vendor/fancybox/**/*').
    pipe(gulp.dest(`${distCss}/fancybox`))
));

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

gulp.task('resources', () => (
  gulp.
    src(paths.resources).
    pipe(
      gulpif(
        f => path.extname(f.path) === '.json',
        stripJsonComments({whitespace: false})
      )
    ).
    pipe(gulp.dest('dist/resources'))
));

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
  gulp.watch(paths.resources, ['resources']);
  gulp.watch(paths.customJs, ['customJs']);
  gulp.watch(paths.siteSass, ['compass']);
});

gulp.task('pipeline', ['siteJs', 'resources', 'customJs', 'vendorJs', 'vendorCss', 'vendorCssAssets', 'compass']);
gulp.task('default', ['pipeline']);
gulp.task('watch', ['pipeline', 'fileWatch']);
