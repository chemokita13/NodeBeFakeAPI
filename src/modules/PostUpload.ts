import sharp from "sharp";
import BeFake from "../BeFake";
import axios from "axios";

export class PostUpload {
    // Base64 encoded images
    private primary: Uint8Array;
    private secondary: Uint8Array;
    // If resize is true, the image will be resized
    private resize?: boolean;
    constructor(primary: Uint8Array, secondary: Uint8Array, resize?: boolean) {
        this.primary = primary;
        this.secondary = secondary;
        this.resize = resize;
        this.changePhotos();
    }
    // Change photos to webp and resize if resize is true
    private async changePhotos(): Promise<void> {
        // Render imgs
        this.primary = await sharp(this.primary).toBuffer();
        this.secondary = await sharp(this.secondary).toBuffer();
        // Getting MIME types
        const primaryMime = (await sharp(this.primary).metadata()).format;
        const secondaryMime = (await sharp(this.secondary).metadata()).format;
        // if mime != webp => convert srgb
        if (primaryMime != "webp") {
            this.primary = await sharp(this.primary)
                .toFormat("webp")
                .toBuffer();
        }
        if (secondaryMime != "webp") {
            this.secondary = await sharp(this.secondary)
                .toFormat("webp")
                .toBuffer();
        }
        // Resize imgs if resize is true
        if (this.resize) {
            const newsize = [1500, 2000];
            this.primary = await sharp(this.primary)
                .resize(newsize[0], newsize[1])
                .toBuffer();
            this.secondary = await sharp(this.secondary)
                .resize(newsize[0], newsize[1])
                .toBuffer();
        }
    }

    public async upload(beFake: BeFake) {
        const response = await beFake._apiRequest(
            "get",
            "content/posts/upload-url",
            {},
            { mimeType: "image/webp" }
        );

        let headers1 = response.data[0].headers;
        headers1["Authorization"] = "Bearer " + beFake.token;
        headers1["user-agent"] = beFake.headers["user-agent"];
        const url1 = response.data[0].url;
        let headers2 = response.data[1].headers;
        headers2["Authorization"] = "Bearer " + beFake.token;
        headers2["user-agent"] = beFake.headers["user-agent"];
        console.log(response.data[1].path);
        const url2 = response.data[1].url;

        const primary_res = await axios.put(url1, this.primary, {
            headers: headers1,
        });
        const secondary_res = await axios.put(url2, this.secondary, {
            headers: headers2,
        });
        console.log(primary_res, secondary_res);
    }
}
