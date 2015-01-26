var gulp        = require("gulp");
var rename      = require("gulp-rename");
var coffee      = require('gulp-coffee');
var run         = require('gulp-run');
var runSequence = require('run-sequence');
var clean       = require('gulp-clean');
var uglify      = require('gulp-uglify');
var mocha       = require('gulp-mocha');
var istanbul    = require('gulp-istanbul');
var coffeelint  = require('gulp-coffeelint');

var _src  = 'src';
var _dest = 'dist';
var _test = 'test/**/*.js';

gulp.task('mkdir-setup', function(cb) {
  var dirs = [_dest];
  return run('mkdir -p ' + dirs.join(' ')).exec(cb);
});

gulp.task('clean', function(){
  return gulp.src(_dest)
    .pipe(clean());
});

gulp.task('build-debug', function(){
  return gulp.src(_src + '/**/*.coffee')
    .pipe(coffee())
    .pipe(rename('compute-debug.js'))
    .pipe(gulp.dest(_dest));
});

gulp.task('build-mini', function(){
  return gulp.src(_src + '/**/*.coffee')
    .pipe(coffee())
    .pipe(uglify({
      compress: true
    }))
    .pipe(rename('compute-mini.js'))
    .pipe(gulp.dest(_dest));
});

gulp.task('test', function(cb){
  gulp.src(_dest + '/**/*.js')
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function(){
      gulp.src('test/*.js')
      .pipe(mocha())
      .pipe(istanbul.writeReports())
      .on('end', cb);
    });
});

gulp.task('lint', function () {
  gulp.src('./src/*.coffee')
    .pipe(coffeelint())
    .pipe(coffeelint.reporter());
});

gulp.task('default', function(){
  runSequence(['build-debug', 'build-mini'], ['lint', 'test']);
});
