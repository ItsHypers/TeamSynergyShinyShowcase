async function initEncounterCounter() {
  let frameFiles = [];
  window.extractedFrames = [];

  const input = document.getElementById("zipFileInput");
  const minimisedInput = document.getElementById("minimisedFile");
  const generateBtn = document.getElementById("generateZip");
  const zipNameInput = document.getElementById("zipName");
  const zipStatus = document.getElementById("zipStatus");
  const widthInput = document.getElementById("gifWidth");
  const heightInput = document.getElementById("gifHeight");
  const durationInput = document.getElementById("frameDuration");
  const miniWidthInput = document.getElementById("miniWidth");
  const miniHeightInput = document.getElementById("miniHeight");

  let loadedGifFile = null;

  input.addEventListener("change", (e) => {
    loadedGifFile = e.target.files[0];
    zipStatus.textContent = "File loaded. Press Generate to process.";
    generateBtn.disabled = false;
  });

  async function resizeToBlob(fileOrBlob, width, height) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(fileOrBlob);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        }, "image/png");
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        throw new Error("Failed to load image for resizing.");
      };
      img.src = url;
    });
  }

  async function extractFrames(file, targetWidth, targetHeight) {
    if (file.type === "image/gif") {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const reader = new GifReader(bytes);
      const frames = [];

      const width = reader.width;
      const height = reader.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      const fullFrameBuffer = new Uint8ClampedArray(width * height * 4);

      for (let i = 0; i < reader.numFrames(); i++) {
        const dims = reader.frameInfo(i);
        reader.decodeAndBlitFrameRGBA(i, fullFrameBuffer);
        const imageData = new ImageData(fullFrameBuffer, width, height);
        ctx.putImageData(imageData, 0, 0);

        const resizedCanvas = document.createElement("canvas");
        resizedCanvas.width = targetWidth;
        resizedCanvas.height = targetHeight;
        const rctx = resizedCanvas.getContext("2d");
        rctx.imageSmoothingEnabled = true;
        rctx.imageSmoothingQuality = "high";
        rctx.drawImage(
          canvas,
          0,
          0,
          width,
          height,
          0,
          0,
          targetWidth,
          targetHeight,
        );

        const blob = await new Promise((res) =>
          resizedCanvas.toBlob(res, "image/png"),
        );

        const duration = (dims.delay || 10) * 10;

        frames.push({
          name: `frame-${String(i + 1).padStart(5, "0")}.png`,
          blob,
          duration,
        });
      }

      return frames;
    } else if (file.type.startsWith("image/")) {
      const blob = await resizeToBlob(file, targetWidth, targetHeight);
      return [
        {
          name: "frame-00001.png",
          blob,
          duration: 100,
        },
      ];
    } else {
      throw new Error("Unsupported file type. Please upload a GIF or PNG.");
    }
  }

  function generateCounterXML(frames, counterThemeBottom = "") {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<themes>\n\n`;

    frames.forEach((frame, index) => {
      const frameNumber = String(index + 1).padStart(5, "0");
      xml += `<images file="anim/${frame.name}" filter="nearest">\n`;
      xml += `    <area name="bg-${frameNumber}" xywh="*"/>\n`;
      xml += `</images>\n\n`;
    });

    xml += `    <images>\n        <animation name="encounter_counter_anim" timeSource="enabled">\n\n`;
    frames.forEach((frame, index) => {
      const frameNumber = String(index + 1).padStart(5, "0");
      xml += `<frame ref="bg-${frameNumber}" duration="${frame.duration}"/>\n`;
    });
    xml += `        </animation>\n    </images>\n\n`;
    xml += counterThemeBottom;
    return xml;
  }

  async function loadXMLTemplates() {
    const [counterThemeBottom, themeXMLContent, infoXML] = await Promise.all([
      fetch("/xml/counterThemeBottom.xml").then((r) => r.text()),
      fetch("/xml/themeContent.xml").then((r) => r.text()),
      fetch("/xml/info.xml").then((r) => r.text()),
    ]);
    return { counterThemeBottom, themeXMLContent, infoXML };
  }

  generateBtn.addEventListener("click", async () => {
    if (!loadedGifFile) {
      zipStatus.textContent = "Please upload a GIF or PNG first.";
      return;
    }

    const w = Number(widthInput.value) || 300;
    const h = Number(heightInput.value) || 250;

    zipStatus.textContent = "Processing frames…";

    try {
      const frames = await extractFrames(loadedGifFile, w, h);
      window.extractedFrames = frames;
      frameFiles = frames.map((f) => f.name);

      zipStatus.textContent = `Extracted ${frames.length} frames. Loading XML templates…`;

      const { counterThemeBottom, themeXMLContent, infoXML } =
        await loadXMLTemplates();

      const zip = new JSZip();
      const base = "data/themes/default";
      const animFolder = zip.folder(`${base}/anim`);

      frames.forEach((frame) => animFolder.file(frame.name, frame.blob));

      if (frames.length > 0) {
        zip.file("icon.png", frames[0].blob);
      }

      const minimisedFile = minimisedInput.files[0];
      const miniW = Number(miniWidthInput.value) || 100;
      const miniH = Number(miniHeightInput.value) || 100;

      let minimisedBlob = null;
      if (minimisedFile) {
        minimisedBlob = await resizeToBlob(minimisedFile, miniW, miniH);
      } else if (frames.length > 0) {
        minimisedBlob = await resizeToBlob(frames[0].blob, miniW, miniH);
      }

      if (minimisedBlob) {
        const unexpandedFolder = zip.folder(`${base}/unexpanded`);
        unexpandedFolder.file("minimised.png", minimisedBlob);
      }

      zip.file(
        `${base}/custom-counter.xml`,
        generateCounterXML(frames, counterThemeBottom),
      );

      zip.file(`${base}/theme.xml`, themeXMLContent);

      const zipNameValue = zipNameInput.value.trim() || "custom-counter";
      const themeName = zipNameValue.replace(/\.zip$/i, "");
      const infoXMLReplaced = infoXML.replace("${themeName}", themeName);
      zip.file("info.xml", infoXMLReplaced);

      const outputZipName = zipNameValue.endsWith(".zip")
        ? zipNameValue
        : zipNameValue + ".zip";
      const a = document.createElement("a");
      const content = await zip.generateAsync({ type: "blob" });
      a.href = URL.createObjectURL(content);
      a.download = outputZipName;
      a.click();

      zipStatus.textContent = "ZIP created successfully!";
    } catch (err) {
      console.error(err);
      zipStatus.textContent = "Error processing file: " + err.message;
    }
  });
}
