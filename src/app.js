// ============================================================
// WEB PROJECT BUILDER
// ============================================================


// ------------------------------------------------------------
// STATE
// ------------------------------------------------------------

let selectedFiles = [];
let iconFile = null;


// ------------------------------------------------------------
// ELEMENTS
// ------------------------------------------------------------

const dropArea =
    document.getElementById("dropArea");

const selectFolder =
    document.getElementById("selectFolder");

const folderInput =
    document.getElementById("folderInput");

const folderName =
    document.getElementById("folderName");

const selectIcon =
    document.getElementById("selectIcon");

const iconName =
    document.getElementById("iconName");

const iconPreview =
    document.getElementById("iconPreview");

const generate =
    document.getElementById("generate");

const status =
    document.getElementById("status");


// ============================================================
// FOLDER SELECTION
// ============================================================

selectFolder.addEventListener(
    "click",
    () => {

        folderInput.click();

    }
);


// ============================================================
// FOLDER INPUT
// ============================================================

folderInput.addEventListener(
    "change",
    () => {

        const files =
            Array.from(folderInput.files);


        if (!files.length) {

            return;

        }


        setWebFiles(files);

    }
);


// ============================================================
// DRAG OVER
// ============================================================

dropArea.addEventListener(
    "dragover",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        dropArea.classList.add(
            "dragging"
        );

    }
);


// ============================================================
// DRAG LEAVE
// ============================================================

dropArea.addEventListener(
    "dragleave",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        dropArea.classList.remove(
            "dragging"
        );

    }
);


// ============================================================
// DROP
// ============================================================

dropArea.addEventListener(
    "drop",
    (event) => {

        event.preventDefault();

        event.stopPropagation();

        dropArea.classList.remove(
            "dragging"
        );


        const files =
            Array.from(
                event.dataTransfer.files
            );


        if (!files.length) {

            setStatus(
                "Nessun file trovato."
            );

            return;

        }


        setWebFiles(files);

    }
);


// ============================================================
// SET WEB FILES
// ============================================================

function setWebFiles(files) {

    selectedFiles = files;


    let rootName =
        "Web App";


    const firstFile =
        files[0];


    if (
        firstFile.webkitRelativePath
    ) {

        rootName =
            firstFile
                .webkitRelativePath
                .split("/")[0];

    }


    folderName.textContent =
        `📁 ${rootName} — ${files.length} file`;


    setStatus(
        "Web App caricata correttamente."
    );

}


// ============================================================
// ICON SELECTION
// ============================================================

selectIcon.addEventListener(
    "click",
    () => {

        const input =
            document.createElement(
                "input"
            );


        input.type = "file";

        input.accept =
            "image/png,image/jpeg,image/webp";


        input.addEventListener(
            "change",
            () => {

                if (
                    !input.files.length
                ) {

                    return;

                }


                iconFile =
                    input.files[0];


                iconName.textContent =
                    `🖼️ ${iconFile.name}`;


                const url =
                    URL.createObjectURL(
                        iconFile
                    );


                iconPreview.innerHTML =
                    "";


                const image =
                    document.createElement(
                        "img"
                    );


                image.src = url;

                image.alt = "Icona";


                iconPreview.appendChild(
                    image
                );


                setStatus(
                    "Icona selezionata."
                );

            }
        );


        input.click();

    }
);


// ============================================================
// GENERATE
// ============================================================

generate.addEventListener(
    "click",
    async () => {

        try {

            await generateProject();

        } catch (error) {

            console.error(error);

            setStatus(
                `❌ ${error.message}`
            );

        }

    }
);


// ============================================================
// GENERATE PROJECT
// ============================================================

async function generateProject() {

    // --------------------------------------------------------
    // CHECK JSZIP
    // --------------------------------------------------------

    if (
        typeof JSZip === "undefined"
    ) {

        throw new Error(
            "JSZip non è stato caricato."
        );

    }


    // --------------------------------------------------------
    // READ FORM
    // --------------------------------------------------------

    const name =
        document
            .getElementById("name")
            .value
            .trim();


    const version =
        document
            .getElementById("appVersion")
            .value
            .trim();


    const developer =
        document
            .getElementById("developer")
            .value
            .trim();


    const installer =
        document
            .getElementById("installer")
            .checked;


    const portable =
        document
            .getElementById("portable")
            .checked;


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (!name) {

        throw new Error(
            "Inserisci il nome dell'app."
        );

    }


    if (!version) {

        throw new Error(
            "Inserisci la versione."
        );

    }


    if (!developer) {

        throw new Error(
            "Inserisci il nome dello sviluppatore."
        );

    }


    if (!selectedFiles.length) {

        throw new Error(
            "Seleziona o trascina una Web App."
        );

    }


    if (
        !installer &&
        !portable
    ) {

        throw new Error(
            "Seleziona Installer o Portable."
        );

    }


    // --------------------------------------------------------
    // START
    // --------------------------------------------------------

    generate.disabled = true;


    try {

        setStatus(
            "⏳ Analizzo i file..."
        );


        // ----------------------------------------------------
        // PROJECT NAME
        // ----------------------------------------------------

        const projectName =
            sanitizeProjectName(
                name
            );


        // ----------------------------------------------------
        // CREATE ZIP
        // ----------------------------------------------------

        const zip =
            new JSZip();


        // ----------------------------------------------------
        // WEB APP
        // ----------------------------------------------------

        for (
            const file of selectedFiles
        ) {

            const relativePath =
                getRelativePath(
                    file
                );


            if (!relativePath) {

                continue;

            }


            const data =
                await file.arrayBuffer();


            zip.file(
                `${projectName}/src/${relativePath}`,
                data
            );

        }


        // ----------------------------------------------------
        // PACKAGE.JSON
        // ----------------------------------------------------

        zip.file(
            `${projectName}/package.json`,
            createPackageJson(
                name,
                version
            )
        );


        // ----------------------------------------------------
        // TAURI CONFIG
        // ----------------------------------------------------

        zip.file(
            `${projectName}/src-tauri/tauri.conf.json`,
            createTauriConfig(
                name,
                version,
                developer,
                installer,
                iconFile !== null
            )
        );


        // ----------------------------------------------------
        // CARGO
        // ----------------------------------------------------

        zip.file(
            `${projectName}/src-tauri/Cargo.toml`,
            createCargoToml(
                name,
                version
            )
        );


        // ----------------------------------------------------
        // RUST
        // ----------------------------------------------------

        zip.file(
            `${projectName}/src-tauri/src/lib.rs`,
            createLibRs()
        );


        zip.file(
            `${projectName}/src-tauri/src/main.rs`,
            createMainRs()
        );


        // ----------------------------------------------------
        // BUILD RS
        // ----------------------------------------------------

        zip.file(
            `${projectName}/src-tauri/build.rs`,
            createBuildRs()
        );


        // ----------------------------------------------------
        // GITIGNORE
        // ----------------------------------------------------

        zip.file(
            `${projectName}/.gitignore`,
            createGitignore()
        );


        // ----------------------------------------------------
        // GITHUB ACTION
        // ----------------------------------------------------

        zip.file(
            `${projectName}/.github/workflows/build.yml`,
            createGitHubWorkflow(
                installer,
                portable
            )
        );


        // ----------------------------------------------------
        // README
        // ----------------------------------------------------

        zip.file(
            `${projectName}/README.md`,
            createReadme(
                name,
                version,
                developer,
                installer,
                portable
            )
        );


        // ----------------------------------------------------
        // ICON
        // ----------------------------------------------------

        if (iconFile) {

            setStatus(
                "🎨 Genero le icone..."
            );


            await addIcons(
                zip,
                projectName,
                iconFile
            );

        }


        // ----------------------------------------------------
        // ZIP
        // ----------------------------------------------------

        setStatus(
            "📦 Creo il progetto..."
        );


        const blob =
            await zip.generateAsync(
                {
                    type: "blob",

                    compression:
                        "DEFLATE",

                    compressionOptions: {
                        level: 6
                    }
                }
            );


        // ----------------------------------------------------
        // DOWNLOAD
        // ----------------------------------------------------

        downloadBlob(
            blob,
            `${projectName}.zip`
        );


        setStatus(
            "✅ Progetto generato!"
        );


    } finally {

        generate.disabled = false;

    }

}


// ============================================================
// RELATIVE PATH
// ============================================================

function getRelativePath(file) {

    if (
        file.webkitRelativePath
    ) {

        const parts =
            file.webkitRelativePath
                .split("/");


        // Remove root directory

        if (
            parts.length > 1
        ) {

            parts.shift();

        }


        return parts.join("/");

    }


    return file.name;

}


// ============================================================
// PACKAGE.JSON
// ============================================================

function createPackageJson(
    name,
    version
) {

    return JSON.stringify(
        {
            name:
                toNpmName(name),

            version,

            private: true,

            scripts: {
                tauri:
                    "tauri"
            },

            devDependencies: {
                "@tauri-apps/cli":
                    "^2"
            }
        },

        null,

        2
    );

}


// ============================================================
// TAURI CONFIG
// ============================================================

function createTauriConfig(
    name,
    version,
    developer,
    installer,
    hasIcon
) {

    const icons =
        hasIcon
            ? [
                "icons/32x32.png",
                "icons/128x128.png",
                "icons/128x128@2x.png"
            ]
            : [];


    const targets =
        installer
            ? ["nsis"]
            : [];


    return JSON.stringify(
        {
            "$schema":
                "https://schema.tauri.app/config/2",

            productName:
                name,

            version,

            identifier:
                createIdentifier(
                    name
                ),

            build: {

                frontendDist:
                    "../src"

            },

            app: {

                windows: [

                    {
                        title:
                            name,

                        width:
                            1100,

                        height:
                            750,

                        minWidth:
                            700,

                        minHeight:
                            500,

                        resizable:
                            true
                    }

                ],

                security: {
                    csp: null
                }

            },

            bundle: {

                active:
                    true,

                targets,

                publisher:
                    developer,

                icon:
                    icons,

                windows: {

                    nsis: {

                        installMode:
                            "currentUser"

                    }

                }

            }

        },

        null,

        2
    );

}


// ============================================================
// CARGO TOML
// ============================================================

function createCargoToml(
    name,
    version
) {

    const rustName =
        toRustName(name);


    return `[package]
name = "${rustName}"
version = "${version}"
description = "${escapeToml(name)}"
authors = ["${escapeToml(name)}"]
edition = "2021"

[lib]
name = "${rustName}_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = ["custom-protocol"] }

[features]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
`;

}


// ============================================================
// LIB.RS
// ============================================================

function createLibRs() {

    return `#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {

    tauri::Builder::default()
        .run(
            tauri::generate_context!()
        )
        .expect(
            "error while running tauri application"
        );
}
`;

}


// ============================================================
// MAIN.RS
// ============================================================

function createMainRs() {

    return `#![cfg_attr(
    not(debug_assertions),
    windows_subsystem = "windows"
)]

fn main() {

    web_project_builder_lib::run();

}
`;

}


// ============================================================
// BUILD.RS
// ============================================================

function createBuildRs() {

    return `fn main() {

    tauri_build::build();

}
`;

}


// ============================================================
// GITIGNORE
// ============================================================

function createGitignore() {

    return `node_modules/
target/
dist/
.DS_Store
*.log
`;

}


// ============================================================
// GITHUB ACTIONS
// ============================================================

function createGitHubWorkflow(
    installer,
    portable
) {

    let artifacts = "";


    if (installer) {

        artifacts += `
      - name: Upload Windows installer
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: src-tauri/target/release/bundle/nsis/*.exe
`;

    }


    if (portable) {

        artifacts += `
      - name: Upload Windows executable
        uses: actions/upload-artifact@v4
        with:
          name: windows-portable
          path: src-tauri/target/release/*.exe
`;

    }


    return `name: Build Windows

on:

  workflow_dispatch:

jobs:

  build:

    runs-on: windows-latest

    permissions:

      contents: read

    steps:

      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm install

      - name: Build Tauri
        uses: tauri-apps/tauri-action@v1
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: .

${artifacts}
`;

}


// ============================================================
// README
// ============================================================

function createReadme(
    name,
    version,
    developer,
    installer,
    portable
) {

    const outputs = [];


    if (installer) {

        outputs.push(
            "- Windows Installer (.exe)"
        );

    }


    if (portable) {

        outputs.push(
            "- Windows Portable (.exe)"
        );

    }


    return `# ${name}

Version: ${version}

Developer: ${developer}

Generated with Web Project Builder.

## GitHub build

1. Create a new GitHub repository.

2. Upload all files from this project.

3. Open the **Actions** tab.

4. Select **Build Windows**.

5. Click **Run workflow**.

6. Wait for the build to finish.

7. Open the completed workflow.

8. Download the artifacts.

## Output

${outputs.join("\n")}

## Local development

Install dependencies:

\`\`\`bash
npm install
\`\`\`

Run:

\`\`\`bash
npm run tauri dev
\`\`\`

Build:

\`\`\`bash
npm run tauri build
\`\`\`
`;

}


// ============================================================
// ICONS
// ============================================================

async function addIcons(
    zip,
    projectName,
    file
) {

    const sizes = [

        {
            name:
                "32x32.png",

            size:
                32
        },

        {
            name:
                "128x128.png",

            size:
                128
        },

        {
            name:
                "128x128@2x.png",

            size:
                256
        }

    ];


    for (
        const icon of sizes
    ) {

        const blob =
            await resizeImage(
                file,
                icon.size
            );


        zip.file(
            `${projectName}/src-tauri/icons/${icon.name}`,
            blob
        );

    }

}


// ============================================================
// RESIZE IMAGE
// ============================================================

async function resizeImage(
    file,
    size
) {

    const bitmap =
        await createImageBitmap(
            file
        );


    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        size;

    canvas.height =
        size;


    const context =
        canvas.getContext(
            "2d"
        );


    context.clearRect(
        0,
        0,
        size,
        size
    );


    const scale =
        Math.min(
            size / bitmap.width,
            size / bitmap.height
        );


    const width =
        bitmap.width * scale;


    const height =
        bitmap.height * scale;


    const x =
        (size - width) / 2;


    const y =
        (size - height) / 2;


    context.drawImage(
        bitmap,
        x,
        y,
        width,
        height
    );


    return new Promise(
        (resolve) => {

            canvas.toBlob(
                resolve,
                "image/png"
            );

        }
    );

}


// ============================================================
// DOWNLOAD
// ============================================================

function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },

        1000
    );

}


// ============================================================
// NAME HELPERS
// ============================================================

function sanitizeProjectName(
    value
) {

    return value

        .replace(
            /[<>:"/\\|?*]/g,
            ""
        )

        .replace(
            /\s+/g,
            "-"
        )

        .replace(
            /-+/g,
            "-"
        )

        .replace(
            /^-|-$/g,
            ""
        )

        || "MyApp";

}


function toNpmName(
    value
) {

    return sanitizeProjectName(
        value
    )
    .toLowerCase();

}


function toRustName(
    value
) {

    let result =
        value

            .toLowerCase()

            .replace(
                /[^a-z0-9_]+/g,
                "_"
            )

            .replace(
                /^_+|_+$/g,
                ""
            );


    if (!result) {

        result =
            "my_app";

    }


    if (
        /^[0-9]/.test(result)
    ) {

        result =
            `app_${result}`;

    }


    return result;

}


function createIdentifier(
    value
) {

    const clean =
        value

            .toLowerCase()

            .replace(
                /[^a-z0-9]+/g,
                ""
            );


    return `com.webprojectbuilder.${clean || "app"}`;

}


function escapeToml(
    value
) {

    return value

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /"/g,
            '\\"'
        );

}


// ============================================================
// STATUS
// ============================================================

function setStatus(
    message
) {

    status.textContent =
        message;

}
