// Include gulp
var gulp = require('gulp');

var runSequence = require('run-sequence');
var del = require('del');
var rjs = require('gulp-requirejs'); // https://www.npmjs.org/package/gulp-requirejs

var sass = require('gulp-sass');

// Define some paths.
var paths = {
	'sass': ['./src/scss/**/*'],
	'top-level-sass': ['./src/scss/all.scss'],
	'images': ['./src/images/**/*'],
	'audio': ['./src/audio/**/*']
};


// Clears the distribution folder before running the other tasks
gulp.task('build-clean', function(done) {
	del(['./dist'], done);
});

gulp.task('move-index', function() {
	return gulp.src(['./src/index.html'])
		.pipe(gulp.dest('./dist'));
});

// Move the images into dist
gulp.task('move-images', function() {
	return gulp.src(paths.images)
		.pipe(gulp.dest('./dist/images'));
});

// Move the images into dist
gulp.task('move-audio', function() {
	return gulp.src(paths.audio)
		.pipe(gulp.dest('./dist/audio'));
});

gulp.task('move-scripts', function() {
	return gulp.src(['./src/js/lib/require.js'])
		.pipe(gulp.dest('./dist/js/lib'));
});

gulp.task('build-scripts', function() {
	rjs(require('./src/js/require.conf'))
	/*
	return gulp.src('./src/js/page.js')
		.pipe(rjs(require('./src/js/require.conf')))
		*/
		/*
		.pipe(traceur({
			modules: 'commonjs' // amd or commonjs
		}))
		*/
		.pipe(gulp.dest('./dist/js'));
});

// Compile Our Sass
gulp.task('sass', function() {
	return gulp.src(paths['top-level-sass'])
		.pipe(sass({
			outputStyle: 'compressed'
		}))
		// Save out our compiled sass for the site
		.pipe(gulp.dest('./dist/css'));
});

// Rerun tasks when a file changes
gulp.task('watch', function() {
	gulp.watch(paths.sass, ['sass']);
});

// Default Task
gulp.task('default', function(callback) {
	runSequence('build-clean',
		['move-index', 'move-images', 'move-audio', 'sass', 'move-scripts', 'build-scripts', 'watch'],
		callback
	);
});