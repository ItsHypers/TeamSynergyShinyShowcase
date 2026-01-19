function initEncounterCounter() {
  let frameFiles = [];

const input = document.getElementById('zipFileInput');
const minimisedInput = document.getElementById('minimisedFile');
const fileList = document.getElementById('fileList');
const generateBtn = document.getElementById('generateZip');
const zipNameInput = document.getElementById('zipName');
const zipStatus = document.getElementById('zipStatus');
const durationInput = document.getElementById('frameDuration');


input.addEventListener('change', async (event) => {
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
      zipStatus.textContent = 'Zip file read, but it contains no files.';
      generateBtn.disabled = true;
    }

  } catch (err) {
    console.error('Error reading zip file:', err);
    zipStatus.textContent = 'Error reading zip file. Please try again.';
    generateBtn.disabled = true;
  }
});


const counterThemeBottom = `
  <theme name="encounter-counter" ref="resizableframe">
    <param name="titleAreaTop"><int>8</int></param>
    <param name="titleAreaLeft"><int>11</int></param>
    <param name="titleAreaRight"><int>-1</int></param>
    <param name="titleAreaBottom"><int>20</int></param>
    <param name="border"><border>20,0,0,0</border></param>
    <param name="background"><image>encounter_counter_anim</image></param>
    <param name="minWidth"><int>200</int></param>
    <theme name="content" ref="-defaults">
      <theme name="label" ref="label">
        <param name="minWidth"><int>50</int></param>
        <param name="font"><font>alphabeta-border</font></param>
        <param name="border"><border>7,7</border></param>
        <param name="textAlignment"><enum type="alignment">CENTER</enum></param>
      </theme>
      <theme name="label-left" ref="label">
        <param name="textAlignment"><enum type="alignment">LEFT</enum></param>
      </theme>
      <theme name="icon" ref="label">
        <param name="border"><border>7,7</border></param>
      </theme>
      <theme name="cell" ref="label">
        <param name="background"><image>ui-inputbox.background</image></param>
        <param name="textAlignment"><enum type="alignment">LEFT</enum></param>
        <param name="border"><border>5</border></param>
      </theme>
    </theme>
  </theme>

  <theme name="encounter-counter-expanded" ref="encounter-counter">
      <param name="background"><image>encounter_counter_anim</image></param>
  </theme>

</themes>
`;

function generateCounterXML(files, minimisedFileName = null, frameDuration = 100) {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<themes>\n\n`;

  if (minimisedFileName) {
    xml += `<images file="unexpanded/${minimisedFileName}">\n`;
    xml += `    <area name="encounter_counter" xywh="*"/>\n`;
    xml += `</images>\n\n`;
  }

  files.forEach((file, index) => {
    const frameNumber = String(index + 1).padStart(5, '0');
    xml += `<images file="anim/${file}" filter="nearest">\n`;
    xml += `    <area name="bg-${frameNumber}" xywh="*"/>\n`;
    xml += `</images>\n\n`;
  });

  let bottom = counterThemeBottom || '';
  if (minimisedFileName) {
    bottom = bottom.replace(
      /<param name="background">\s*<image>encounter_counter_anim<\/image>\s*<\/param>/,
      `<param name="background"><image>encounter_counter</image></param>`
    );
  }

  xml += `    <images>\n        <animation name="encounter_counter_anim" timeSource="enabled">\n\n`;
  files.forEach((_, index) => {
    const frameNumber = String(index + 1).padStart(5, '0');
    xml += `<frame ref="bg-${frameNumber}" duration="${frameDuration}"/>\n`;
  });
  xml += `        </animation>\n    </images>\n\n`;

  xml += bottom;
  return xml;
}

const themeXMLContent = `<themes>
<constantDef name="main-theme-color"><color>#6a889b</color></constantDef>
<constantDef name="main-color"><color>#5db1ff</color></constantDef>
<constantDef name="sub-color"><color>#5db1ff</color></constantDef>
<constantDef name="tooltip-tint"><color>#FF565D63</color></constantDef>
<include filename="fonts.xml"/>
<fontGen/>
<include filename="cursors.xml"/>
<include filename="gfx.xml"/>
<include filename="gfx_ui.xml"/>
<include filename="init.xml"/>
<include filename="ui/main.xml"/>
<include filename="ui/battle.xml"/>
<include filename="ui/contest.xml"/>
<include filename="ui/party.xml"/>
<include filename="ui/inventory.xml"/>
<include filename="ui/chat.xml"/>
<include filename="ui/monster-dex.xml"/>
<include filename="ui/monster-frame.xml"/>
<include filename="ui/customization.xml"/>
<include filename="ui/settings.xml"/>
<include filename="ui/guild.xml"/>
<include filename="ui/matchmaking.xml"/>
<include filename="ui/social.xml"/>
<include filename="ui/instance.xml"/>
<include filename="ui/trade.xml"/>
<include filename="ui/shop.xml"/>
<include filename="ui/link.xml"/>
<include filename="ui/misc.xml"/>
<include filename="ui/advanced-search.xml"/>
<include filename="ui/broker.xml"/>
<include filename="ui/pc.xml"/>
<include filename="ui/incubator.xml"/>
<include filename="ui/staff.xml"/>
<include filename="main-widgets.xml"/>
<include filename="custom-counter.xml"/>
</themes>`;


function generateinfoXML(themeName) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<resource name="${themeName}" version="1.0" description="Animated Custom encounter counter" author="Hyper" weblink="https://forums.pokemmo.com/index.php?/topic/190960-hypers-custom-encounter-counters/">
  <overlays>
    <overlay path="data/themes/" name="Encounter Theme"/>
  </overlays>
</resource>`;
}

generateBtn.addEventListener('click', async () => {
  if (!frameFiles.length) return;

  const frameDuration = parseInt(durationInput.value, 10) || 100;
  const outputZipName = zipNameInput.value.trim() || "custom-counter.zip";
  const themeName = zipNameInput.value.replace(/\.zip$/i, '') || "custom-counter";

  const zip = new JSZip();
  const defaultFolder = `data/themes/default`;


  const minimisedFile = minimisedInput.files[0];
  const minimisedFileName = minimisedFile ? minimisedFile.name : null;


  const counterXML = generateCounterXML(frameFiles, minimisedFileName, frameDuration);
  zip.file(`${defaultFolder}/custom-counter.xml`, counterXML);


  zip.file(`${defaultFolder}/theme.xml`, themeXMLContent);


  const animFolder = zip.folder(`${defaultFolder}/anim`);
  const uploadedZip = await JSZip.loadAsync(input.files[0]);
  const animPromises = [];
  let firstFileAdded = false;

  uploadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir) {
      const p = zipEntry.async("blob").then(content => {
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


  zip.file(`info.xml`, generateinfoXML(themeName));

  await Promise.all(animPromises);

  zip.generateAsync({ type: "blob" }).then(content => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = outputZipName;
    a.click();
  });
});
}