import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

const convertMimeTypes:any = {
    "application/vnd.google-apps.document": {
        type:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ext: ".docx",
    },
    "application/vnd.google-apps.spreadsheet": {
        type:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ext: ".xlsx",
    },
    "application/vnd.google-apps.presentation": {
        type:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ext: ".pptx",
    },
};

export class GoogleDriveAPI {

    private oAuth2Client;
    drive: any;
    driveFolder = path.join(__dirname, '../downloads/drive/');
    fileId: string;

    constructor(fileId: string) {
        this.oAuth2Client = new google.auth.OAuth2(
            process.env.DRIVE_CLIENT_ID,
            process.env.DRIVE_CLIENT_SECRET,
            process.env.DRIVE_REDIRECT_URI
        );
        this.oAuth2Client.setCredentials({ refresh_token: process.env.DRIVE_REFRESH_TOKEN });

        this.drive = google.drive({
            version: 'v3',
            auth: this.oAuth2Client
        });

        this.fileId = fileId;
    }

    async downloadFile() {
        const promise = new Promise((resolve, reject) => {
            this.drive.files.get({ fileId: this.fileId, fields: "*" }, async (err: any, obj: any) => {
                const data = obj.data;

                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                    // throw new Error('something terrible happened' + err);
                }
                let fileName = data.name;
                const mimeType = data.mimeType;
                let res;
                if (mimeType.includes("application/vnd.google-apps")) {
                    fileName += convertMimeTypes[mimeType].ext;
                    res = await this.drive.files.export(
                        {
                            fileId: this.fileId,
                            mimeType: convertMimeTypes[mimeType].type
                        },
                        { responseType: "stream" }
                    );
                } else {
                    res = await this.drive.files.get(
                        {
                            fileId: this.fileId,
                            alt: "media",
                        },
                        { responseType: "stream" }
                    );
                }
                const dest = fs.createWriteStream(this.driveFolder + fileName);
                res.data
                    .on("end", () => {
                        resolve({
                            fileName: data.name,
                            fileFolder: this.driveFolder,
                            fileExt: convertMimeTypes[mimeType].ext,
                            filePath: this.driveFolder + fileName 
                        });
                    })
                    .on("error", (err: any) => {
                        console.log(err);
                        // throw new Error('something terrible happened' + err);
                        reject(err);
                        return process.exit();
                    })
                    .pipe(dest);
            });
        });
        return promise;
    }

    async updateFile(filePath: string, fileName: string) {
        try {
            const response = await this.drive.files.update({
                fileId: this.fileId,
                resource: {
                    name: fileName
                },
                media: {
                    mimeType: 'application/vnd.google-apps.spreadsheet',
                    body: fs.createReadStream(filePath)
                }
            });
            return response.data;
        }
        catch (err) {
            throw new Error(JSON.stringify(err));
        }
    }

}