import gulp from 'gulp';
import fs from 'fs';
import child_process from 'child_process';

let name = JSON.parse(fs.readFileSync("./package.json").toString()).name;

gulp.task('build', function () {
    try {
        let meta = JSON.parse(fs.readFileSync(`./src/${name}/package.json`).toString());
        meta.date = new Date().toUTCString();
        meta.commit = child_process.execSync("git rev-parse --short HEAD").toString().replace("\n", "");
        meta.version = meta.version.split("-")[0];
        meta.version = meta.version + `-nightly@${meta.commit}`;
        fs.writeFileSync(`./src/${name}/package.json`, JSON.stringify(meta, null, 2));
        child_process.execSync('npx tsc');
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('generate_update_file', function(){
    try {
        let meta = JSON.parse(fs.readFileSync(`./src/${name}/package.json`).toString());
        fs.writeFileSync("./dist/update.json", JSON.stringify({
            version: meta.version,
            url: `https://repo.modloader64.com/mods/WWO/update/${name}.pak`,
            devUrl: `https://repo.modloader64.com/mods/WWO/dev/${name}.pak`
        }, null, 2));
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('remove_nightly_flag', function(){
    try {
        let meta = JSON.parse(fs.readFileSync(`./src/${name}/package.json`).toString());
        meta.date = "";
        meta.commit = "";
        meta.version = meta.version.split("-")[0];
        fs.writeFileSync(`./src/${name}/package.json`, JSON.stringify(meta, null, 2));
    } catch (err: any) {
        console.log(err.stack);
    }
    return gulp.src('./src/**/*.ts')
});

gulp.task('postinstall', function(){
    let og = process.cwd();

    process.chdir(`./src/${name}`);
    child_process.execSync("yarn", {stdio: 'inherit'});
    child_process.execSync("npx patch-package", {stdio: 'inherit'});

    process.chdir(og);
    return gulp.src('./src/**/*.ts')
});

gulp.task('default', gulp.series(['build']));
