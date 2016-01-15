var gulp        = require("gulp");
var rename      = require("gulp-rename");
var del         = require('del');
var uglify      = require('gulp-uglify');
var mocha       = require('gulp-mocha');
var istanbul    = require('gulp-istanbul');
var replace     = require('gulp-replace');
var path        = require('path');
var fs          = require('fs');
var eslint      = require('gulp-eslint');
var jsdoc       = require('gulp-jsdoc');


var MiniFileName  = 'compute-mini.js';
var DebugFileName = 'compute-debug.js';

var DirSource        = 'src';
var DirDist          = 'dist';
var DirTest          = 'test';
var DirCoverage      = 'coverage';
var DirDocumentation = 'documentation'
var Source    = path.join(DirSource, '**', '*.js');
var Test      = path.join(DirTest, '**', '*.js');
var DestMini  = path.join(DirDist, MiniFileName);
var DestDebug = path.join(DirDist, DebugFileName);
var Documentation = DirDocumentation;
var Coverage  = DirCoverage;

var webserver = require('gulp-webserver');


var COMPUTE_VERSION_PATTERN = '%%%COMPUTE_VERSION%%%';
function getVersion(){
  return JSON.parse(fs.readFileSync('package.json', {'encoding':'utf8'})).version;
}


gulp.task('clean-documentation', function() {
  return del([Documentation]);
});


gulp.task('clean-dist', function() {
  return del([DirDist]);
});


gulp.task('clean-coverage', function() {
  return del([Coverage]);
});

gulp.task('clean', ['clean-documentation', 'clean-dist', 'clean-coverage']);


gulp.task('build-debug', ['lint', 'clean-dist'], function(){
  return gulp.src(Source)
    .pipe(replace(COMPUTE_VERSION_PATTERN, getVersion()))
    .pipe(rename(DebugFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('build-mini', ['lint', 'clean-dist'], function(){
  return gulp.src(Source)
    .pipe(replace(COMPUTE_VERSION_PATTERN, getVersion()))
    .pipe(uglify({
      compress: true
    }))
    .pipe(rename(MiniFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('lint', function() {
  gulp.src(Source)
    .pipe(eslint({
      extends: 'eslint:recommended',
      globals: {
        define  : false,
        require : false,
        exports : false,
        window  : false
      },
      rules: {
        'no-inner-declarations': 0
      }
    }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});


gulp.task('document', ['clean-documentation'],function() {
  gulp.src(Source)
    .pipe(jsdoc(Documentation));
});


gulp.task('test-node-with-knockout', ['clean-coverage'], function() {
  return gulp.src(Source)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire({
      includeUntested: true
    }))
    .on('finish', function() {
      gulp.src(Test)
      .pipe(mocha({
        reporter: 'nyan'
      }))
      .pipe(istanbul.writeReports({
        dir: './coverage',
        reporters: [ 'lcov', 'text'],
        reportOpts: { dir: './coverage' }
      }))
    });
});


gulp.task('test', ['test-node-with-knockout']);


gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver());
});

gulp.task('default', ['build-debug', 'build-mini']);
