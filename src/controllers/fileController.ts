import { Request, Response } from '@men-mvc/essentials/lib/express';
import { FileSystemDriver } from '@men-mvc/config';
import * as fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { config } from '../config';

export class FileController {
  public viewPublicFile = (req: Request, res: Response) => {
    // if (config.fileSystem.storageDriver !== FileSystemDriver.s3) {
    //   throw new Error(
    //     `FileController should only be used for viewing the file in the S3 bucket.`
    //   );
    // }
    const filename = 'logo.png';
    const defaultMimeType = `text/plain`;
    const mimeType = mime.lookup(filename);
    res.contentType(mimeType ? mimeType : defaultMimeType);
    // res.setHeader('Content-disposition', 'attachment; filename=logo.png'); // this will download the file. TODO: create getDownloadUrl function too.
    return fs.createReadStream(path.join(__dirname, 'logo.png')).pipe(res);
  };
}
