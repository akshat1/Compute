var gulp        = require("gulp");
var rename      = require("gulp-rename");
var coffee      = require('gulp-coffee');
//var run         = require('gulp-run');
//var runSequence = require('run-sequence');
var del         = require('del');
var uglify      = require('gulp-uglify');
var mocha       = require('gulp-mocha');
var istanbul    = require('gulp-coffee-istanbul');
var coffeelint  = require('gulp-coffeelint');
var replace     = require('gulp-replace');
var path        = require('path');
var fs          = require('fs');
var jsdoc       = require('gulp-jsdoc');
require('coffee-script/register');

var MiniFileName  = 'compute-mini.js';
var DebugFileName = 'compute-debug.js';

var DirSource        = 'src';
var DirDist          = 'dist';
var DirTest          = 'test';
var DirCoverage      = 'coverage';
var DirDocumentation = 'documentation'
var Source    = path.join(DirSource, '**', '*.coffee');
var DestMini  = path.join(DirDist, MiniFileName);
var DestDebug = path.join(DirDist, DebugFileName);
var Documentation = DirDocumentation;
var Test      = path.join(DirTest, '**', '*.coffee');
var Coverage  = DirCoverage;

var webserver = require('gulp-webserver');


var COMPUTE_VERSION_PATTERN = '%%%COMPUTE_VERSION%%%';
function getVersion(){
  return JSON.parse(fs.readFileSync('package.json', {'encoding':'utf8'})).version;
}

/*
gulp.task('mkdir-setup', function(cb) {
  var dirs = [DirDist];
  run('mkdir -p ' + dirs.join(' ')).exec(cb);
});
*/

gulp.task('clean', function(){
  return del([DirDist, Coverage, Documentation]);
});


gulp.task('build-debug', function(){
  return gulp.src(Source)
    .pipe(replace(COMPUTE_VERSION_PATTERN, getVersion()))
    .pipe(coffee())
    .pipe(rename(DebugFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('build-mini', function(){
  return gulp.src(Source)
    .pipe(replace(COMPUTE_VERSION_PATTERN, getVersion()))
    .pipe(coffee())
    .pipe(uglify({
      compress: true
    }))
    .pipe(rename(MiniFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('test-inner', function(cb){
  gulp.src(Source)
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function(){
      gulp.src(Test)
      .pipe(mocha())
      .pipe(istanbul.writeReports({
        dir: Coverage
      }))
      .on('end', cb)
    });
});


gulp.task('lint', function () {
  return gulp.src(Source)
    .pipe(coffeelint())
    .pipe(coffeelint.reporter());
});

gulp.task('document', ['build-debug'], function(){
  var sourcePath = path.join(DirDist, '*debug.js');
  console.log(sourcePath, '-->', Documentation);
  return gulp.src(sourcePath)
    .pipe(jsdoc(Documentation));
});

gulp.task('test', ['lint', 'test-inner']);

//'lint', 'test', 'document'

gulp.task('webserver', function() {
  gulp.src('./')
    .pipe(webserver());
});

gulp.task('default', ['build-debug', 'build-mini']);
