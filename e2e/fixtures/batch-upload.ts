import AdmZip from "adm-zip";

const MINIMAL_PNG_BASE64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

export function createTestZip(options: {
    rowCount?: number;
    includeImages?: boolean;
    csvContent?: string;
} = {}): Buffer {
    const zip = new AdmZip();
    const { rowCount = 2, includeImages = true } = options;

    if (options.csvContent) {
        zip.addFile("products.csv", Buffer.from(options.csvContent));
    } else {
        const csv = [
            `model,brand,price_current,price_currency,category,traction,name,gender,color,price_original,price_discount_percent,price_member_price,description_subtitle,description_tagline,description_intro,description_collection,description_key_benefits,technical_range,technical_sole_type,technical_upper_material,technical_adjustment,main_image,thumbnail,image_gallery,sizes`,
            `Football Boots/FG/Adidas Predator,Adidas,149.99,EUR,Football Boots,FG,Predator Elite FG,Unisex,Black,199.99,25,99.99,Elite,Pro control,Designed for elite players.,Pro Collection,["Lightweight","Precision"],Elite,FG,K-Leather,Lace-Up,predator-elite.jpg,predator-elite-thumb.jpg,["predator-elite-1.jpg","predator-elite-2.jpg"],[{"size":"UK 7","stock":10,"available":true}]`,
            `Football Boots/FG/Nike Mercurial,Nike,179.99,EUR,Football Boots,FG,Mercurial Vapor 16,Unisex,White,229.99,22,129.99,Speed,Race past defenders.,Built for speed.,Speed Collection,["Speed","Agile"],Elite,FG,Flyknit,Lace-Up,mercurial-vapor.jpg,mercurial-vapor-thumb.jpg,["mercurial-vapor-1.jpg"],[{"size":"UK 8","stock":5,"available":true}]`,
        ].slice(0, 1 + rowCount);
        zip.addFile("products.csv", Buffer.from(csv.join("\n")));
    }

    if (includeImages) {
        const imgBuffer = Buffer.from(MINIMAL_PNG_BASE64, "base64");
        if (!options.csvContent) {
            zip.addFile("predator-elite.jpg", imgBuffer);
            zip.addFile("predator-elite-thumb.jpg", imgBuffer);
            zip.addFile("predator-elite-1.jpg", imgBuffer);
            zip.addFile("predator-elite-2.jpg", imgBuffer);
            zip.addFile("mercurial-vapor.jpg", imgBuffer);
            zip.addFile("mercurial-vapor-thumb.jpg", imgBuffer);
            zip.addFile("mercurial-vapor-1.jpg", imgBuffer);
        }
    }

    return zip.toBuffer();
}
