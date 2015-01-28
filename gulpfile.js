var gulp        = require("gulp");
var rename      = require("gulp-rename");
var coffee      = require('gulp-coffee');
var run         = require('gulp-run');
var runSequence = require('run-sequence');
var clean       = require('gulp-clean');
var uglify      = require('gulp-uglify');
var mocha       = require('gulp-mocha');
var istanbul    = require('gulp-coffee-istanbul');
var coffeelint  = require('gulp-coffeelint');
var path        = require('path');
var docco       = require("gulp-docco");
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
var Documentation = path.join(DirDist, DirDocumentation);
var Test      = path.join(DirTest, '**', '*.coffee');
var Coverage  = path.join(DirDist, DirCoverage);

gulp.task('mkdir-setup', function(cb) {
  var dirs = [DirDist];
  run('mkdir -p ' + dirs.join(' ')).exec(cb);
});


gulp.task('clean', function(){
  return gulp.src([DirDist, Coverage])
    .pipe(clean());
});


gulp.task('build-debug', function(){
  return gulp.src(Source)
    .pipe(coffee())
    .pipe(rename(DebugFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('build-mini', function(){
  return gulp.src(Source)
    .pipe(coffee())
    .pipe(uglify({
      compress: true
    }))
    .pipe(rename(MiniFileName))
    .pipe(gulp.dest(DirDist));
});


gulp.task('test', function(cb){
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

gulp.task('document', function(){
  return gulp.src(Source)
    .pipe(docco({}))
    .pipe(gulp.dest(Documentation));
});


gulp.task('default', function(){
  runSequence('lint', 'test', 'document', ['build-debug', 'build-mini']);
});
