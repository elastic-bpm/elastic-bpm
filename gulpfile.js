const gulp = require('gulp');
const ts = require('gulp-typescript');
const nodemon = require('nodemon');
const JSON_FILES = ['src/*.json', 'src/**/*.json'];

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('scripts', () => {
  const tsResult = tsProject.src().pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('watch', ['scripts'], () => {
  gulp.watch('src/**/*.ts', ['scripts']);
});

gulp.task('assets', function () {
  return gulp.src(JSON_FILES).pipe(gulp.dest('dist'));
});

gulp.task('default', ['watch', 'assets'], () => {
  // configure nodemon
  nodemon({
    // the script to run the app
    script: 'dist/index.js',
    // this listens to changes in any of these files/routes and restarts the application
    watch: ['dist/*', 'dist/*/**'],
    ext: 'js'
    // Below i'm using es6 arrow functions but you can remove the arrow and have it a normal .on('restart', function() { // then place your stuff in here }
  })
});