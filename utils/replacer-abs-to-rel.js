import copy from 'recursive-copy';
import fs from "fs";
import globby from "globby";

copy('./src', './out', { overwrite: true }).then(() => {

    globby("./out/**/*.ts")
        .then(paths => {
            paths.forEach(update);
        })
        .catch(e => console.log(e));

    console.log('done')
})


function update(path) {

    console.log(path);

    let js = fs.readFileSync(path, "utf8");

    let currentDeep = (path.match(/\//g) || []).length;



    let anyReplacements = false;
    js = js.replace(/\} from \'src.+'\;/g, function (matched) {
        anyReplacements = true;

        console.log({ currentDeep, matched });

        const testMod = path.replace('./out/', '').split('/');

        let rep = matched;
        if (matched.startsWith("} from 'src/" + testMod[0])) {

            rep = matched.replace('src/' + testMod[0] + '/', './' + (currentDeep - 3 > 0 ? '../'.repeat(currentDeep - 3) : ''));

        } else {
            const numberX = currentDeep - 2;
            if (numberX == 0) {
                rep = matched.replace('src/', './');
            } else {
                rep = matched.replace('src/', '../'.repeat(numberX));
            }
            console.log({ matched, rep });
        }

        return rep;
    })

    if (anyReplacements) {
        fs.writeFileSync(path, js);
    }
}
