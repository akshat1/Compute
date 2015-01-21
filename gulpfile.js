var gulp        = require("gulp");
var rename      = require("gulp-rename");
var coffee      = require('gulp-coffee');
var run         = require('gulp-run');
var runSequence = require('run-sequence');
var clean       = require('gulp-clean');
var uglify      = require('gulp-uglify');

var _src  = 'src';
var _dest = 'dist';

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

gulp.task('default', function(){
  runSequence('build-debug', 'build-mini');
});
