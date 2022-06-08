const fs = require('fs/promises');
const path = require('path');

const v8toIstanbul = require('v8-to-istanbul');
const covDir = './output/coverage';

const convertCoverage = async (fileName) => {
  if (fileName.match('istanbul')) return;

  const coverage = require(`${covDir}/${fileName}`);
  const basename = path.basename(fileName).replace('.coverage.json', '');
  const finalName = `${covDir}/${basename}_final.coverage.json`;

  for (const entry of coverage) {
    // Used to get file name
    const file = entry.url.match(/(?:http(s)*:\/\/.*\/)(?<file>.*)/);
    const converter = new v8toIstanbul(file.groups.file, 0, {
      source: entry.source,
    });

    await converter.load();
    converter.applyCoverage(entry.functions);

    // Store converted coverage file which can later be used to generate report
    await fs.writeFile(
      finalName,
      JSON.stringify(converter.toIstanbul(), null, 2),
    );
    console.log(`Processed ${basename}`);
  }

  await fs.unlink(`${covDir}/${fileName}`);
};

// read all the coverage file from output/coverage folder
fs.readdir(covDir).then(files => {
  files.forEach(convertCoverage);
});
