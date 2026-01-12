function initEncounterCounter() {
  const page = document.getElementById("encounter-counter-page");
  if (!page) return;

  console.log("Initializing Encounter Counter page...");

  const input = page.querySelector("#zipFileInput");
  const minimisedInput = page.querySelector("#minimisedFile");
  const generateBtn = page.querySelector("#generateZip");
  const zipNameInput = page.querySelector("#zipName");
  const durationInput = page.querySelector("#frameDuration");
  const zipStatus = page.querySelector("#zipStatus");

  let frameFiles = [];

  generateBtn.disabled = true;

  const counterThemeBottom = `
  <theme name="encounter-counter-expanded" ref="encounter-counter">
      <param name="background"><image>encounter_counter_anim</image></param>
  </theme>
  </themes>
  `;

  function generateCounterXML(
    files,
    minimisedFileName = null,
    frameDuration = 100,
  ) {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<themes>\n\n`;

    if (minimisedFileName) {
      xml += `<images file="unexpanded/${minimisedFileName}">\n`;
      xml += `    <area name="encounter_counter" xywh="*"/>\n`;
      xml += `</images>\n\n`;
    }

    files.forEach((file, index) => {
      const frameNumber = String(index + 1).padStart(5, "0");
      xml += `<images file="anim/${file}" filter="nearest">\n`;
      xml += `    <area name="bg-${frameNumber}" xywh="*"/>\n`;
      xml += `</images>\n\n`;
    });

    xml += `    <images>\n        <animation name="encounter_counter_anim" timeSource="enabled">\n\n`;
    files.forEach((_, index) => {
      const frameNumber = String(index + 1).padStart(5, "0");
      xml += `<frame ref="bg-${frameNumber}" duration="${frameDuration}"/>\n`;
    });
    xml += `        </animation>\n    </images>\n\n`;

    xml += counterThemeBottom;
    return xml;
  }

  const themeXMLContent = `<themes>
<constantDef name="main-theme-color"><color>#6a889b</color></constantDef>
<constantDef name="main-color"><color>#5db1ff</color></constantDef>
<include filename="custom-counter.xml"/>
</themes>`;

  function generateInfoXML(themeName) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<resource name="${themeName}" version="1.0" description="Animated Custom encounter counter" author="Hyper" weblink="https://forums.pokemmo.com/index.php?/topic/190960-hypers-custom-encounter-counters/">
  <overlays>
    <overlay path="data/themes/" name="Encounter Theme"/>
  </overlays>
</resource>`;
  }

  input.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const zip = await JSZip.loadAsync(file);
      frameFiles = [];

      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) frameFiles.push(relativePath);
      });

      frameFiles.sort();

      if (frameFiles.length > 0) {
        zipStatus.textContent = `Zip file read successfully! ${frameFiles.length} files detected.`;
        generateBtn.disabled = false;
      } else {
        zipStatus.textContent = "Zip file read, but it contains no files.";
        generateBtn.disabled = true;
      }
    } catch (err) {
      console.error("Error reading zip file:", err);
      zipStatus.textContent = "Error reading zip file. Please try again.";
      generateBtn.disabled = true;
    }
  });

  generateBtn.addEventListener("click", async () => {
    if (!frameFiles.length) return;

    const frameDuration = parseInt(durationInput.value, 10) || 100;
    const outputZipName = zipNameInput.value.trim() || "custom-counter.zip";
    const themeName =
      zipNameInput.value.replace(/\.zip$/i, "") || "custom-counter";

    const zip = new JSZip();
    const defaultFolder = `data/themes/default`;

    const minimisedFile = minimisedInput.files[0];
    const minimisedFileName = minimisedFile ? minimisedFile.name : null;

    const counterXML = generateCounterXML(
      frameFiles,
      minimisedFileName,
      frameDuration,
    );
    zip.file(`${defaultFolder}/custom-counter.xml`, counterXML);
    zip.file(`${defaultFolder}/theme.xml`, themeXMLContent);

    const animFolder = zip.folder(`${defaultFolder}/anim`);
    const uploadedZip = await JSZip.loadAsync(input.files[0]);
    const animPromises = [];
    let firstFileAdded = false;

    uploadedZip.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        const p = zipEntry.async("blob").then((content) => {
          animFolder.file(relativePath, content);
          if (!firstFileAdded) {
            zip.file(`icon.png`, content);
            firstFileAdded = true;
          }
        });
        animPromises.push(p);
      }
    });

    if (minimisedFile) {
      const unexpandedFolder = zip.folder(`${defaultFolder}/unexpanded`);
      unexpandedFolder.file(minimisedFile.name, minimisedFile);
    }

    zip.file(`info.xml`, generateInfoXML(themeName));

    await Promise.all(animPromises);

    zip.generateAsync({ type: "blob" }).then((content) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = outputZipName;
      a.click();
    });
  });

  console.log("Encounter Counter JS initialized for this page.");
}

initEncounterCounter();
